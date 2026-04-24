export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false,
            error: 'Method tidak diizinkan'
        });
    }
    
    const { message } = req.body;
    
    if (!message || message.trim() === '') {
        return res.status(400).json({
            success: false,
            error: 'Pesan tidak boleh kosong'
        });
    }
    
    // Ambil IP user
    const getClientIp = (req) => {
        const ip = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] ||
                   req.headers['cf-connecting-ip'] ||
                   req.connection?.remoteAddress ||
                   req.socket?.remoteAddress ||
                   '';
        return ip.split(',')[0].trim() || '0.0.0.0';
    };
    
    const clientIp = getClientIp(req);
    const API_KEY = process.env.NEOXR_API_KEY || 'a7k3m9x2p4';
    const API_URL = 'https://api.neoxr.eu/api/blackbox';
    
    console.log(`[cYama] IP: ${clientIp}, Pesan: ${message.substring(0, 30)}`);
    
    try {
        // Panggil API Neoxr
        const response = await fetch(`${API_URL}?q=${encodeURIComponent(message)}&apikey=${API_KEY}`);
        const rawText = await response.text();
        
        console.log(`[cYama] Raw Response: ${rawText.substring(0, 200)}`);
        
        let data;
        try {
            data = JSON.parse(rawText);
        } catch (e) {
            return res.status(500).json({
                success: false,
                error: 'Response API tidak valid',
                detail: rawText.substring(0, 100),
                solution: 'API sedang bermasalah, coba lagi nanti'
            });
        }
        
        // ========== CEK STATUS RESPONSE DARI API ==========
        // Contoh response Neoxr:
        // { "status": false, "msg": "parameter \"apikey\" is required" }
        // { "status": true, "result": "jawaban..." }
        
        if (data.status === false) {
            const errorMsg = data.msg || 'Unknown error';
            
            console.log(`[cYama] API Error: ${errorMsg}`);
            
            // DETEKSI JENIS ERROR BERDASARKAN PESANNYA
            let errorTitle = 'API Error';
            let detailError = errorMsg;
            let solusi = 'Coba lagi nanti';
            let needWhitelist = false;
            
            // Case 1: API Key salah atau tidak ada
            if (errorMsg.toLowerCase().includes('apikey')) {
                errorTitle = 'API Key Tidak Valid';
                detailError = 'API Key yang digunakan tidak dikenali oleh server';
                solusi = 'Periksa kembali API Key di environment variable Vercel';
            }
            // Case 2: IP tidak terdaftar (harusnya error msg mengandung kata IP)
            else if (errorMsg.toLowerCase().includes('ip') || 
                     errorMsg.toLowerCase().includes('whitelist') ||
                     errorMsg.toLowerCase().includes('access denied')) {
                errorTitle = '⚠️ IP Belum Dikonfirmasi';
                detailError = `IP ${clientIp} belum terdaftar di whitelist API Neoxr`;
                solusi = 'Hubungi owner cYama AI untuk konfirmasi IP';
                needWhitelist = true;
            }
            // Case 3: Rate limit / quota habis
            else if (errorMsg.toLowerCase().includes('limit') || 
                     errorMsg.toLowerCase().includes('quota')) {
                errorTitle = 'Kuota Habis';
                detailError = errorMsg;
                solusi = 'Kuota API sudah habis, hubungi owner untuk upgrade';
            }
            // Case 4: Parameter salah
            else if (errorMsg.toLowerCase().includes('parameter')) {
                errorTitle = 'Parameter Error';
                detailError = errorMsg;
                solusi = 'Parameter query yang dikirim mungkin salah format';
            }
            // Case 5: Error lain
            else {
                errorTitle = 'API Neoxr Error';
                detailError = errorMsg;
                solusi = 'Coba beberapa saat lagi, atau hubungi @neoxr.js';
            }
            
            return res.status(400).json({
                success: false,
                error: errorTitle,
                detail: detailError,
                solution: solusi,
                user_ip: clientIp,
                need_whitelist: needWhitelist,
                raw_error: errorMsg  // Kirim error asli untuk debugging
            });
        }
        
        // ========== SUKSES ==========
        // Ekstrak reply dari berbagai kemungkinan
        let reply = data.result || data.data || data.message || data.response || data.reply || data.content;
        
        if (!reply) {
            reply = 'Maaf, saya tidak bisa memproses permintaan Anda.';
        }
        
        return res.status(200).json({
            success: true,
            reply: reply,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('[cYama] Fatal Error:', error);
        
        return res.status(500).json({
            success: false,
            error: 'Kesalahan Server',
            detail: error.message,
            solution: 'Refresh halaman atau coba lagi nanti'
        });
    }
}
