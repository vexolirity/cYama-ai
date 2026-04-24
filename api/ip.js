export default function handler(req, res) {
    const getClientIp = (req) => {
        const ip = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] ||
                   req.headers['cf-connecting-ip'] ||
                   req.connection?.remoteAddress ||
                   req.socket?.remoteAddress ||
                   '';
        return ip.split(',')[0].trim();
    };
    
    const clientIp = getClientIp(req);
    
    res.status(200).json({
        ip: clientIp,
        message: `IP Anda: ${clientIp}`,
        contact_owner: 'https://wa.me/6288286708193?text=Halo%20Yama,%20saya%20mau%20konfirmasi%20IP%20untuk%20cYama%20AI'
    });
}
