export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false,
            error: 'Method tidak diizinkan',
            detail: 'Hanya method POST yang diperbolehkan',
            solution: 'Gunakan method POST untuk mengirim pesan'
        });
    }
    
    const { message } = req.body;
    
    if (!message || message.trim() === '') {
        return res.status(400).json({
            success: false,
            error: 'Pesan tidak boleh kosong',
            detail: 'Parameter "message" tidak boleh kosong atau hanya berisi spasi',
            solution: 'Isi pesan dengan teks yang valid'
        });
    }
    
    const getClientIp = (req) => {
        const ip = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] ||
                   req.headers['cf-connecting-ip'] ||
                   req.connection?.remoteAddress ||
                   req.socket?.remoteAddress ||
                   '';
        return ip.split(',')[0].trim();
    };
    
    const clientIp = getClientIp(req);
    const API_KEY = process.env.NEOXR_API_KEY || 'a7k3m9x2p4';
    const API_URL = 'https://api.neoxr.eu/api/blackbox';
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch(`${API_URL}?q=${encodeURIComponent(message)}&apikey=${API_KEY}`, {
            method: 'GET',
            signal: controller.signal,
            headers: {
                'User-Agent': 'cYama-AI/1.0',
                'Accept': 'application/json'
            }
        });
        
        clearTimeout(timeoutId);
        
        const responseText = await response.text();
        let data;
        
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            return res.status(500).json({
                success: false,
                error: 'Response API tidak valid',
                detail: `Server mengembalikan: ${responseText.substring(0, 100)}`,
                solution: 'API mungkin sedang bermasalah. Coba lagi nanti.',
                user_ip: clientIp
            });
        }
        
        // Cek error dari API
        if (data.status === false) {
            const errorMsg = data.msg || '';
            
            // Deteksi error IP whitelist
            if (errorMsg.toLowerCase().includes('ip') || 
                errorMsg.toLowerCase().includes('whitelist') ||
                errorMsg.toLowerCase().includes('access')) {
                return res.status(403).json({
                    success: false,
                    error: '⚠️ IP Belum Dikonfirmasi',
                    detail: `IP ${clientIp} belum terdaftar di whitelist API Neoxr`,
                    solution: 'Hubungi owner cYama AI untuk konfirmasi IP',
                    user_ip: clientIp,
                    need_whitelist: true
                });
            }
            
            // Error lainnya
            return res.status(400).json({
                success: false,
                error: 'API Error',
                detail: errorMsg,
                solution: 'Coba beberapa saat lagi',
                user_ip: clientIp
            });
        }
        
        // Ekstrak reply
        let reply = data.result || data.data || data.message || data.response || data.reply || data.content || 'Maaf, saya tidak bisa memproses permintaan Anda.';
        
        return res.status(200).json({
            success: true,
            reply: reply,
            timestamp: new Date().toISOString(),
            user_ip: clientIp
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Kesalahan Sistem',
            detail: error.message,
            solution: 'Refresh halaman atau coba lagi nanti',
            user_ip: clientIp
        });
    }
}
