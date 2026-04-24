export default async function handler(req, res) {
    const getClientIp = (req) => {
        const ip = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] ||
                   req.connection?.remoteAddress ||
                   '';
        return ip.split(',')[0].trim();
    };
    
    const clientIp = getClientIp(req);
    const API_KEY = process.env.NEOXR_API_KEY || 'a7k3m9x2p4';
    
    try {
        // Test dengan pesan sederhana
        const response = await fetch(`https://api.neoxr.eu/api/blackbox?q=halo&apikey=${API_KEY}`);
        const data = await response.json();
        
        res.status(200).json({
            your_ip: clientIp,
            api_response: data,
            api_key_used: API_KEY.substring(0, 4) + '...' + API_KEY.substring(API_KEY.length - 4),
            suggestion: data.status === false ? 'Cek error message di atas' : 'API berhasil!'
        });
    } catch (error) {
        res.status(500).json({
            your_ip: clientIp,
            error: error.message
        });
    }
}
