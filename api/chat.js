// ============================================
// cYama AI - Chat API Endpoint
// Method: POST
// Body: { message, personality, image }
// ============================================

// Konfigurasi
const API_KEY = process.env.NEOXR_API_KEY;
const RATE_LIMIT = 30; // maksimal request per menit per IP
const rateLimitStore = new Map();

// Cleanup rate limit setiap jam
setInterval(() => rateLimitStore.clear(), 60 * 60 * 1000);

function checkRateLimit(ip) {
    const now = Date.now();
    const windowStart = now - 60 * 1000; // 1 menit
    const requests = rateLimitStore.get(ip) || [];
    const recentRequests = requests.filter(t => t > windowStart);
    
    if (recentRequests.length >= RATE_LIMIT) {
        return false;
    }
    
    recentRequests.push(now);
    rateLimitStore.set(ip, recentRequests);
    return true;
}

export default async function handler(req, res) {
    // ========== CORS ==========
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method tidak diizinkan. Gunakan POST.' 
        });
    }
    
    // ========== VALIDASI API KEY ==========
    if (!API_KEY) {
        console.error('❌ NEOXR_API_KEY tidak ditemukan di environment variables!');
        return res.status(500).json({ 
            success: false, 
            error: 'Konfigurasi server error. Hubungi administrator.' 
        });
    }
    
    // ========== RATE LIMITING ==========
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(clientIp)) {
        return res.status(429).json({ 
            success: false, 
            error: `Terlalu banyak request. Maksimal ${RATE_LIMIT} request per menit.` 
        });
    }
    
    // ========== VALIDASI INPUT ==========
    const { message, personality, image } = req.body;
    
    if (!message && !image) {
        return res.status(400).json({ 
            success: false, 
            error: 'Pesan atau gambar diperlukan' 
        });
    }
    
    if (message && message.length > 4000) {
        return res.status(400).json({ 
            success: false, 
            error: 'Pesan terlalu panjang. Maksimal 4000 karakter.' 
        });
    }
    
    if (image && image.length > 5 * 1024 * 1024) {
        return res.status(400).json({ 
            success: false, 
            error: 'Ukuran gambar terlalu besar. Maksimal 5MB.' 
        });
    }
    
    // ========== PROMPT MAPPING ==========
    const promptMap = {
        formal: 'Jawab dengan bahasa Indonesia yang formal, profesional, dan sopan.',
        santai: 'Jawab dengan bahasa Indonesia yang santai, ramah, dan bersahabat seperti teman ngobrol.',
        lucu: 'Jawab dengan bahasa Indonesia yang lucu, menghibur, dan penuh candaan ringan.'
    };
    
    const systemPrompt = promptMap[personality] || promptMap.formal;
    const finalMessage = image 
        ? `${systemPrompt}\n\nDeskripsikan gambar ini dengan detail dalam bahasa Indonesia: ${message || 'Apa yang ada di gambar ini?'}`
        : `${systemPrompt}\n\n${message}`;
    
    // ========== CALL EXTERNAL API ==========
    try {
        console.log(`📨 [${new Date().toISOString()}] Processing request from ${clientIp}`);
        
        let url;
        if (image) {
            // Vision API (gambar)
            url = `https://api.neoxr.eu/api/gemini-vision?image=${encodeURIComponent(image)}&query=${encodeURIComponent(finalMessage)}&lang=id&apikey=${API_KEY}`;
            console.log('🖼️ Using Vision API');
        } else {
            // Text API
            url = `https://api.neoxr.eu/api/gpt4?q=${encodeURIComponent(finalMessage)}&apikey=${API_KEY}`;
            console.log('💬 Using GPT-4 API');
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 detik timeout
        
        const response = await fetch(url, { 
            headers: { 'User-Agent': 'cYama-AI/2.0' },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        // Log response status
        console.log(`📡 API Response status: ${response.status}, success: ${data.status}`);
        
        if (data.status === true) {
            const reply = data.data?.message || data.result || data.message;
            
            if (!reply || reply.length === 0) {
                return res.status(500).json({ 
                    success: false, 
                    error: 'AI tidak memberikan respons. Coba lagi nanti.' 
                });
            }
            
            console.log(`✅ Request successful, response length: ${reply.length}`);
            
            return res.status(200).json({ 
                success: true, 
                reply: reply 
            });
        }
        
        // API returning error
        console.warn(`⚠️ API error: ${data.msg || 'Unknown error'}`);
        return res.status(400).json({ 
            success: false, 
            error: data.msg || 'Terjadi kesalahan dari server AI. Coba lagi nanti.' 
        });
        
    } catch (error) {
        console.error(`❌ API Error [${clientIp}]:`, error.message);
        
        if (error.name === 'AbortError') {
            return res.status(504).json({ 
                success: false, 
                error: 'Request timeout. Server AI terlalu lama merespons. Coba lagi.' 
            });
        }
        
        return res.status(500).json({ 
            success: false, 
            error: 'Gagal terhubung ke server AI. Periksa koneksi internet Anda.' 
        });
    }
}
