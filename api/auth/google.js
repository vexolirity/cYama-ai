cat > api/auth/google.js << 'EOF'
export default function handler(req, res) {
    const CLIENT_ID = '75728450214-1q4ravi8pjveco1ruiao3k6qrnvdlfk1.apps.googleusercontent.com';
    const REDIRECT_URI = `https://${req.headers.host}/api/auth/callback`;
    
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=email%20profile`;
    
    res.redirect(url);
}
EOF
