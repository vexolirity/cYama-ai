export default async function handler(req, res) {
    const { code } = req.query;
    const CLIENT_ID = '75728450214-1q4ravi8pjveco1ruiao3k6qrnvdlfk1.apps.googleusercontent.com';
    const CLIENT_SECRET = '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';
    const REDIRECT_URI = `https://${req.headers.host}/api/auth/callback`;
    
    if (!code) {
        return res.redirect('/?error=Login%20Gagal');
    }
    
    try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code, client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
                redirect_uri: REDIRECT_URI, grant_type: 'authorization_code'
            })
        });
        
        const token = await tokenRes.json();
        const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${token.access_token}` }
        });
        const user = await userRes.json();
        
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(`
            <script>
                localStorage.setItem('cyama_user', JSON.stringify({
                    name: '${user.name.replace(/'/g, "\\'")}',
                    email: '${user.email}',
                    picture: '${user.picture}'
                }));
                localStorage.setItem('cyama_auth', 'true');
                location.href = '/dashboard.html';
            </script>
        `);
    } catch (err) {
        res.redirect('/?error=Login%20Gagal');
    }
}
