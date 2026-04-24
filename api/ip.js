export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const getIp = (req) => {
        const ip = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] ||
                   req.headers['cf-connecting-ip'] ||
                   req.socket?.remoteAddress ||
                   req.connection?.remoteAddress ||
                   '';
        return ip.split(',')[0].trim() || 'Tidak terdeteksi';
    };
    
    const serverIp = getIp(req);
    
    res.status(200).json({
        success: true,
        server_ip: serverIp,
        message: 'Masukkan IP ini ke dashboard Neoxr untuk whitelist',
        dashboard_url: 'https://api.neoxr.my.id/dashboard',
        apikey_owner: 'Anda'
    });
}
