export default function handler(req, res) {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || 
               req.socket?.remoteAddress || 
               'Tidak terdeteksi';
    
    res.status(200).json({
        ip: ip,
        message: 'Masukkan IP ini ke dashboard Neoxr untuk whitelist'
    });
}
