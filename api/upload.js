import formidable from 'formidable';
import fs from 'fs';

export const config = {
    api: {
        bodyParser: false,
    },
};

const API_KEY = process.env.NEOXR_API_KEY;

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method tidak diizinkan' });
    }
    
    // Validasi API Key
    if (!API_KEY) {
        console.error('❌ NEOXR_API_KEY tidak ditemukan!');
        return res.status(500).json({ error: 'Konfigurasi server error' });
    }
    
    try {
        // Parse form data
        const form = formidable({
            maxFileSize: 5 * 1024 * 1024, // 5MB max
            allowEmptyFiles: false,
            uploadDir: '/tmp',
            keepExtensions: true
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
        
        // Baca file ke base64
        const imageBuffer = fs.readFileSync(imageFile.filepath);
        const base64Image = imageBuffer.toString('base64');
        const query = fields.query?.[0] || 'Deskripsikan gambar ini dalam bahasa Indonesia secara detail';
        
        // Panggil Vision API
        const visionRes = await fetch(
            `https://api.neoxr.eu/api/gemini-vision?image=${encodeURIComponent(base64Image)}&query=${encodeURIComponent(query)}&lang=id&apikey=${API_KEY}`,
            { headers: { 'User-Agent': 'cYama-AI/2.0' } }
        );
        
        const visionData = await visionRes.json();
        
        // Cleanup temp file
        try { fs.unlinkSync(imageFile.filepath); } catch(e) {}
        
        if (visionData.status === true) {
            const description = visionData.result || visionData.data || visionData.message;
            return res.status(200).json({
                success: true,
                description: description
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
