import formidable from 'formidable';
import fs from 'fs';

export const config = {
    api: { bodyParser: false }
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Methods', 'POST');
        return res.status(200).end();
    }
    
    if (req.method === 'POST' && req.url === '/api/chat') {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Pesan kosong' });
        }
        
        try {
            const response = await fetch(`https://api.neoxr.eu/api/gpt4?q=${encodeURIComponent(message)}&apikey=a7k3m9x2p4`);
            const data = await response.json();
            
            if (data.status) {
                const reply = data.data?.message || data.result || data.message;
                return res.status(200).json({ reply });
            } else {
                return res.status(500).json({ error: data.msg });
            }
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    
    if (req.method === 'POST' && req.url === '/api/upload') {
        const form = formidable({ maxFileSize: 10 * 1024 * 1024 });
        
        try {
            const [fields, files] = await new Promise((resolve, reject) => {
                form.parse(req, (err, fields, files) => {
                    if (err) reject(err);
                    else resolve([fields, files]);
                });
            });
            
            const file = files.image?.[0];
            if (!file) return res.status(400).json({ error: 'Tidak ada file' });
            
            const base64 = fs.readFileSync(file.filepath).toString('base64');
            const query = fields.query?.[0] || 'Deskripsikan gambar ini dalam bahasa Indonesia';
            
            const visionRes = await fetch(`https://api.neoxr.eu/api/gemini-vision?image=${encodeURIComponent(base64)}&query=${encodeURIComponent(query)}&lang=id&apikey=a7k3m9x2p4`);
            const visionData = await visionRes.json();
            
            fs.unlinkSync(file.filepath);
            
            if (visionData.status) {
                return res.status(200).json({ description: visionData.result || visionData.data });
            } else {
                return res.status(500).json({ error: visionData.msg });
            }
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    
    res.status(404).json({ error: 'Not found' });
}
