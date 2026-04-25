export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method tidak diizinkan' });
    }
    
    const { message, personality, image } = req.body;
    if (!message && !image) {
        return res.status(400).json({ error: 'Pesan atau gambar diperlukan' });
    }
    
    const API_KEY = 'a7k3m9x2p4';
    const promptMap = {
        formal: 'Jawab dengan bahasa formal dan profesional',
        santai: 'Jawab dengan bahasa santai dan ramah',
        lucu: 'Jawab dengan lucu dan menghibur'
    };
    const prompt = promptMap[personality] || promptMap.formal;
    const finalMessage = image ? `${prompt} Deskripsikan gambar ini: ${message || 'Apa yang ada di gambar ini?'}` : `${prompt} ${message}`;
    
    try {
        let url;
        if (image) {
            url = `https://api.neoxr.eu/api/gemini-vision?image=${encodeURIComponent(image)}&query=${encodeURIComponent(finalMessage)}&lang=id&apikey=${API_KEY}`;
        } else {
            url = `https://api.neoxr.eu/api/gpt4?q=${encodeURIComponent(finalMessage)}&apikey=${API_KEY}`;
        }
        
        const response = await fetch(url, { headers: { 'User-Agent': 'cYama-AI/1.0' } });
        const data = await response.json();
        
        if (data.status === true) {
            const reply = data.data?.message || data.result || data.message;
            return res.status(200).json({ success: true, reply });
        }
        
        return res.status(400).json({ success: false, error: data.msg || 'Terjadi kesalahan' });
        
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
