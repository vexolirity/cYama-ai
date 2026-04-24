export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
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
    
    const API_KEY = 'a7k3m9x2p4';
    const userIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
    
    // 3 API dengan urutan prioritas tetap (bukan random)
    const apis = [
        {
            name: 'GPT4',
            url: `https://api.neoxr.eu/api/gpt4?q=${encodeURIComponent(message)}&apikey=${API_KEY}`,
            extract: (data) => data.result || data.data || data.message || data.response
        },
        {
            name: 'Character AI',
            url: `https://api.neoxr.eu/api/cai?character_id=333e7322-a95b-4a14-a051-1c24b8d67b31&message=${encodeURIComponent(message)}&apikey=${API_KEY}`,
            extract: (data) => data.result || data.data || data.message || data.response
        },
        {
            name: 'Kimi AI',
            url: `https://api.neoxr.eu/api/kimi?prompt=${encodeURIComponent(message)}&model=moonshotai%2FKimi-K2-Instruct-0905&session=5e6b8c36-ab3a-408b-b768-c53939b822ac&apikey=${API_KEY}`,
            extract: (data) => data.result || data.data || data.message || data.response || data.content
        }
    ];
    
    // Coba API satu per satu (fallback system)
    for (const api of apis) {
        try {
            console.log(`[cYama] Mencoba ${api.name}...`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            
            const response = await fetch(api.url, {
                signal: controller.signal,
                headers: { 'User-Agent': 'cYama-AI/1.0', 'Accept': 'application/json' }
            });
            
            clearTimeout(timeoutId);
            
            const rawText = await response.text();
            let data;
            
            try {
                data = JSON.parse(rawText);
            } catch(e) {
                return res.status(200).json({
                    success: true,
                    reply: rawText.substring(0, 2000),
                    api_used: api.name
                });
            }
            
            // Jika API mengembalikan error
            if (data.status === false) {
                const errorMsg = data.msg || '';
                
                // Deteksi error IP tidak terdaftar
                if (errorMsg.toLowerCase().includes('ip not allowed')) {
                    return res.status(403).json({
                        success: false,
                        error: errorMsg,
                        api_name: api.name,
                        server_ip: data.ip || 'tidak diketahui',
                        your_ip: userIp,
                        dashboard_url: 'https://api.neoxr.my.id/dashboard',
                        need_whitelist: true
                    });
                }
                
                // Error lain, lanjut ke API berikutnya
                console.log(`[cYama] ${api.name} error: ${errorMsg}`);
                continue;
            }
            
            // Ekstrak reply jika sukses
            let reply = api.extract(data);
            if (reply && typeof reply === 'string' && reply.trim()) {
                return res.status(200).json({
                    success: true,
                    reply: reply,
                    api_used: api.name
                });
            }
            
        } catch (error) {
            console.log(`[cYama] ${api.name} fetch error: ${error.message}`);
            continue;
        }
    }
    
    // Jika semua API gagal
    return res.status(500).json({
        success: false,
        error: 'Semua API tidak merespon',
        detail: 'GPT4, Character AI, dan Kimi AI gagal diproses',
        solution: 'Coba lagi nanti atau periksa koneksi internet'
    });
}
