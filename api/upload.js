export default async function handler(req, res) {
    const { code } = req.query;
    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const REDIRECT_URI = `https://${req.headers.host}/api/auth/callback`;
    
    if (!code) {
        return res.redirect('/?error=Login%20Gagal');
    }
    
    if (!CLIENT_ID || !CLIENT_SECRET) {
        console.error('❌ Google OAuth credentials missing!');
        return res.redirect('/?error=Konfigurasi%20Login%20Error');
    }
    
    try {
        // Exchange code for token
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code, 
                client_id: CLIENT_ID, 
                client_secret: CLIENT_SECRET,
                redirect_uri: REDIRECT_URI, 
                grant_type: 'authorization_code'
            })
        });
        
        const token = await tokenRes.json();
        
        if (!token.access_token) {
            console.error('Token error:', token);
            throw new Error('Gagal mendapatkan access token');
        }
        
        // Get user info
        const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${token.access_token}` }
        });
        const user = await userRes.json();
        
        if (!user.email) {
            throw new Error('Gagal mendapatkan data user');
        }
        
        // Return HTML with localStorage setup
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Login Success - cYama AI</title>
                <style>
                    body {
                        margin: 0;
                        min-height: 100vh;
                        background: linear-gradient(145deg, #0f0c29, #302b63, #24243e);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-family: system-ui, -apple-system, sans-serif;
                    }
                    .card {
                        background: rgba(255,255,255,0.1);
                        backdrop-filter: blur(20px);
                        border-radius: 32px;
                        padding: 40px;
                        text-align: center;
                        color: white;
                    }
                    .loader {
                        width: 40px;
                        height: 40px;
                        border: 3px solid rgba(255,255,255,0.3);
                        border-top-color: white;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 20px auto;
                    }
                    @keyframes spin { to { transform: rotate(360deg); } }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="loader"></div>
                    <h2>Login Berhasil!</h2>
                    <p>Mengalihkan ke dashboard...</p>
                </div>
                <script>
                    localStorage.setItem('cyama_user', JSON.stringify({
                        name: ${JSON.stringify(user.name)},
                        email: ${JSON.stringify(user.email)},
                        picture: ${JSON.stringify(user.picture)}
                    }));
                    localStorage.setItem('cyama_auth', 'true');
                    setTimeout(() => { location.href = '/dashboard'; }, 1000);
                </script>
            </body>
            </html>
        `);
    } catch (err) {
        console.error('Auth error:', err);
        res.redirect('/?error=Login%20Gagal%2C%20silakan%20coba%20lagi');
    }
}
