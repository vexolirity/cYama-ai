export default function handler(req, res) {
    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const REDIRECT_URI = `https://${req.headers.host}/api/auth/callback`;
    
    if (!CLIENT_ID) {
        console.error('❌ GOOGLE_CLIENT_ID tidak ditemukan!');
        return res.status(500).send('Konfigurasi Google Login error');
    }
    
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=email%20profile`;
    
    res.redirect(url);
}
