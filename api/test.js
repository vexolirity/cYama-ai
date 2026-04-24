export default async function handler(req, res) {
    const API_KEY = 'a7k3m9x2p4';
    
    // Dapatkan IP dari berbagai header
    const ipFromHeader = req.headers['x-forwarded-for']?.split(',')[0] || 
                         req.headers['x-real-ip'] ||
                         req.socket?.remoteAddress ||
                         'unknown';
    
    // Test panggil API Neoxr
    try {
        const response = await fetch(`https://api.neoxr.eu/api/gpt4?q=halo&apikey=${API_KEY}`);
        const data = await response.json();
        
        res.status(200).json({
            your_ip_according_to_vercel: ipFromHeader,
            neoxr_response: data,
            analysis: data.status === false ? 
                `❌ Gagal. Neoxr melihat IP: ${data.ip || 'tidak diketahui'}` : 
                '✅ Berhasil! IP sudah terdaftar'
        });
    } catch (error) {
        res.status(500).json({
            error: error.message,
            your_ip: ipFromHeader
        });
    }
}
