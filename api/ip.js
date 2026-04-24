export default function handler(req, res) {
    // Logika untuk mendapatkan IP asli dari berbagai header proxy
    const ip = req.headers['x-forwarded-for']?.split(',').shift() 
               || req.socket?.remoteAddress 
               || 'IP tidak terdeteksi';
    
    // Bersihkan format IPv6 localhost jika perlu
    const cleanIp = ip.replace('::ffff:', '');
    
    res.status(200).json({
        success: true,
        server_ip: cleanIp,
        message: 'Masukkan IP ini ke dashboard Neoxr untuk whitelist',
        dashboard_url: 'https://api.neoxr.my.id/dashboard',
        timestamp: new Date().toISOString()
    });
}
