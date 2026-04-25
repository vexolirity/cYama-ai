export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method tidak diizinkan' });
    }
    
    const { message } = req.body;
    if (!message || message.trim() === '') {
        return res.status(400).json({ success: false, error: 'Pesan tidak boleh kosong' });
    }
    
    const API_KEY = 'a7k3m9x2p4';
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const response = await fetch(
            `https://api.neoxr.eu/api/gpt4?q=${encodeURIComponent(message)}&apikey=${API_KEY}`,
            { 
                signal: controller.signal,
                headers: { 'User-Agent': 'cYama-AI/1.0' } 
            }
        );
        
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        if (data.status === true) {
            const reply = data.data?.message || data.result || data.message || 'Maaf, tidak ada respons';
            return res.status(200).json({ success: true, reply });
        }
        
        // Error dari API
        return res.status(400).json({ 
            success: false, 
            error: data.msg || 'Terjadi kesalahan pada API' 
        });
        
    } catch (error) {
        console.error('Chat error:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Gagal terhubung ke server: ' + error.message 
        });
    }
}
