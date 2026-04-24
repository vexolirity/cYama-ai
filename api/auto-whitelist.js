export default async function handler(req, res) {
    const API_KEY = 'a7k3m9x2p4';
    const DASHBOARD_URL = 'https://api.neoxr.my.id/dashboard';
    
    // Dapatkan IP saat ini
    const currentIp = req.headers['x-forwarded-for']?.split(',')[0] || 
                      req.socket?.remoteAddress || 
                      'unknown';
    
    // Cek apakah IP sudah terdaftar dengan test request
    const testApi = await fetch(`https://api.neoxr.eu/api/gpt4?q=test&apikey=${API_KEY}`);
    const testResult = await testApi.json();
    
    if (testResult.status === false && testResult.msg?.includes('IP not allowed')) {
        // IP belum terdaftar
        res.status(200).json({
            status: 'IP BELUM TERDAFTAR',
            current_ip: currentIp,
            server_ip_menurut_neoxr: testResult.ip,
            action: `Login ke ${DASHBOARD_URL} dan tambahkan IP: ${testResult.ip || currentIp}`,
            dashboard_link: DASHBOARD_URL
        });
    } else {
        res.status(200).json({
            status: 'IP SUDAH TERDAFTAR',
            current_ip: currentIp,
            api_works: true
        });
    }
}
