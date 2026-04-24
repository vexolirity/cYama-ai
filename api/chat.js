export default async function handler(req, res) {
    // CORS headers
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
    
    // Validasi pesan kosong
    if (!message || message.trim() === '') {
        return res.status(400).json({
            success: false,
            error: 'Pesan tidak boleh kosong',
            detail: 'Parameter "message" tidak boleh kosong atau hanya berisi spasi',
            solution: 'Isi pesan dengan teks yang valid'
        });
    }
    
    // DAPATKAN IP ASLI USER (Bahkan melalui proxy/Vercel)
    const getClientIp = (req) => {
        // Cek berbagai header yang mungkin berisi IP asli
        const ip = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] ||
                   req.headers['cf-connecting-ip'] || // Cloudflare
                   req.headers['true-client-ip'] ||
                   req.connection?.remoteAddress ||
                   req.socket?.remoteAddress ||
                   req.connection?.socket?.remoteAddress ||
                   '';
        
        // Jika IP dalam format IPv6 localhost, konversi
        if (ip === '::1' || ip === '::ffff:127.0.0.1') {
            return '127.0.0.1';
        }
        
        // Ambil IP pertama jika ada multiple IP (x-forwarded-for)
        return ip.split(',')[0].trim();
    };
    
    const clientIp = getClientIp(req);
    
    const API_KEY = process.env.NEOXR_API_KEY || 'a7k3m9x2p4';
    const API_URL = 'https://api.neoxr.eu/api/blackbox';
    
    console.log(`[cYama AI] IP User: ${clientIp}`);
    console.log(`[cYama AI] Pesan: "${message.substring(0, 50)}..."`);
    
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
        
        let data;
        const responseText = await response.text();
        
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
        
        // CEK ERROR IP WHITELIST
        if (data.status === false) {
            const errorMsg = data.msg || '';
            
            // Deteksi apakah error karena IP tidak terdaftar
            if (errorMsg.toLowerCase().includes('ip') || 
                errorMsg.toLowerCase().includes('whitelist') ||
                errorMsg.toLowerCase().includes('access') ||
                errorMsg.toLowerCase().includes('forbidden')) {
                
                return res.status(403).json({
                    success: false,
                    error: '⚠️ IP belum dikonfirmasi',
                    detail: `IP ${clientIp} belum terdaftar di whitelist API Neoxr`,
                    solution: `📞 Hubungi Owner cYama AI untuk konfirmasi IP:
                    
┌─────────────────────────────────────┐
│  👤 Owner: Yama                      │
│  📱 WhatsApp: +62 882-8670-8193      │
│  📧 Email: yusufhisyamaa@gmail.com   │
│  💬 Telegram: @Yamaxiar              │
│  🌐 Website: cyama-ai.vercel.app     │
└─────────────────────────────────────┘

Atau chat langsung dengan command: 
/request_ip ${clientIp}`,
                    user_ip: clientIp,
                    need_whitelist: true,
                    contact_owner: {
                        name: 'Yama',
                        chat_link: 'https://wa.me/6288286708193?text=Halo%20Yama,%20saya%20mau%20konfirmasi%20IP%20untuk%20cYama%20AI%0AIP%20saya:%20' + encodeURIComponent(clientIp) + '%0ATolong%20didaftarkan%20ya',
                        telegram: '@Yamaxiar'
                    }
                });
            }
            
            // Error lainnya (bukan IP)
            return res.status(400).json({
                success: false,
                error: 'API Neoxr Error',
                detail: errorMsg,
                solution: 'Coba beberapa saat lagi atau hubungi owner',
                user_ip: clientIp
            });
        }
        
        // Ekstrak reply dari response sukses
        let reply = null;
        if (data.result) reply = data.result;
        else if (data.data) reply = data.data;
        else if (data.message) reply = data.message;
        else if (data.response) reply = data.response;
        else if (data.reply) reply = data.reply;
        else if (data.content) reply = data.content;
        else if (data.text) reply = data.text;
        else if (data.answer) reply = data.answer;
        else reply = 'Maaf, format response tidak dikenali';
        
        return res.status(200).json({
            success: true,
            reply: reply,
            timestamp: new Date().toISOString(),
            user_ip: clientIp // Info IP untuk debugging
        });
        
    } catch (error) {
        console.error('[cYama AI] Error:', error);
        
        return res.status(500).json({
            success: false,
            error: 'Kesalahan Sistem',
            detail: error.message,
            solution: 'Coba refresh halaman atau hubungi owner jika masalah berlanjut',
            user_ip: clientIp,
            contact_owner: 'https://wa.me/6288286708193?text=Error%20cYama%20AI:%20' + encodeURIComponent(error.message)
        });
    }
}
