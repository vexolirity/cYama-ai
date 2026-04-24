export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method tidak diizinkan' });
    }
    
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ success: false, error: 'Pesan tidak boleh kosong' });
    }
    
    const API_KEY = 'a7k3m9x2p4';
    const MAX_RETRY = 3;
    
    for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
        try {
            const response = await fetch(
                `https://api.neoxr.eu/api/gpt4?q=${encodeURIComponent(message)}&apikey=${API_KEY}`,
                { headers: { 'User-Agent': 'cYama-AI/1.0' } }
            );
            
            const data = await response.json();
            
            if (data.status === true) {
                const reply = data.data?.message || data.result || data.message;
                return res.status(200).json({ success: true, reply });
            }
            
            if (data.status === false) {
                const errorMsg = data.msg || '';
                
                if (errorMsg.includes('IP not allowed')) {
                    // Kirim instruksi whitelist yang jelas
                    return res.status(403).json({
                        success: false,
                        error: `⚠️ IP ${data.ip || 'server'} belum diwhitelist`,
                        solution: `1. Login ke https://api.neoxr.my.id/dashboard\n2. Tambahkan IP: ${data.ip}\n3. Simpan\n4. Tunggu 1 menit lalu coba lagi`,
                        server_ip: data.ip
                    });
                }
                
                return res.status(400).json({ success: false, error: errorMsg });
            }
            
        } catch (err) {
            if (attempt === MAX_RETRY) {
                return res.status(500).json({ success: false, error: `Server error: ${err.message}` });
            }
        }
    }
}
