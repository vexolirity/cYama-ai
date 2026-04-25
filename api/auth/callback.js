export default async function handler(req, res) {
    const { code } = req.query;
    const CLIENT_ID = '75728450214-1q4ravi8pjveco1ruiao3k6qrnvdlfk1.apps.googleusercontent.com';
    const CLIENT_SECRET = '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';
    const REDIRECT_URI = `https://${req.headers.host}/api/auth/callback`;
    
    if (!code) {
        return res.redirect('/?error=Login%20Gagal');
    }
    
    try {
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
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
        
        const tokenData = await tokenResponse.json();
        
        if (!tokenData.access_token) {
            throw new Error('Gagal mendapatkan access token');
        }
        
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });
        
        const userData = await userResponse.json();
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Login Berhasil</title>
                <script>
                    localStorage.setItem('cyama_user', JSON.stringify({
                        name: '${userData.name.replace(/'/g, "\\'")}',
                        email: '${userData.email}',
                        picture: '${userData.picture}',
                        id: '${userData.id}'
                    }));
                    localStorage.setItem('cyama_auth', 'true');
                    window.location.href = '/dashboard.html';
                </script>
            </head>
            <body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;background:#0f0c29;color:white;">
                <div>Redirecting to dashboard...</div>
            </body>
            </html>
        `;
        
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(html);
        
    } catch (error) {
        console.error('Auth error:', error);
        res.redirect('/?error=Login%20Gagal');
    }
}
