import formidable from 'formidable';
import fs from 'fs';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method tidak diizinkan' });
    }
    
    const API_KEY = 'a7k3m9x2p4';
    
    try {
        const form = formidable({
            maxFileSize: 10 * 1024 * 1024,
            allowEmptyFiles: false
        });
        
        const [fields, files] = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) reject(err);
                else resolve([fields, files]);
            });
        });
        
        const imageFile = files.image?.[0];
        if (!imageFile) {
            return res.status(400).json({ error: 'Tidak ada file yang diupload' });
        }
        
        const imageBuffer = fs.readFileSync(imageFile.filepath);
        const base64Image = imageBuffer.toString('base64');
        const query = fields.query?.[0] || 'Deskripsikan gambar ini dalam bahasa Indonesia';
        
        const visionRes = await fetch(
            `https://api.neoxr.eu/api/gemini-vision?image=${encodeURIComponent(base64Image)}&query=${encodeURIComponent(query)}&lang=id&apikey=${API_KEY}`,
            { headers: { 'User-Agent': 'cYama-AI/1.0' } }
        );
        
        const visionData = await visionRes.json();
        fs.unlinkSync(imageFile.filepath);
        
        if (visionData.status === true) {
            return res.status(200).json({
                success: true,
                description: visionData.result || visionData.data || visionData.message
            });
        } else {
            return res.status(500).json({
                success: false,
                error: visionData.msg || 'Gagal memproses gambar'
            });
        }
        
    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({ error: error.message });
    }
}
