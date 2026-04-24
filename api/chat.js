export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false,
            error: 'Method tidak diizinkan',
            detail: 'Hanya method POST yang diperbolehkan',
            solution: 'Gunakan method POST untuk mengirim pesan'
        });
    }
    
    const { message } = req.body;
    
    // Validasi pesan kosong
    if (!message || message.trim() === '') {
        return res.status(400).json({
            success: false,
            error: 'Pesan tidak boleh kosong',
            detail: 'Parameter "message" tidak boleh kosong atau hanya berisi spasi',
            solution: 'Isi pesan dengan teks yang valid'
        });
    }
    
    const API_KEY = 'a7k3m9x2p4';
    const API_URL = 'https://api.neoxr.eu/api/blackbox';
    
    // Validasi API Key
    if (!API_KEY || API_KEY === 'a7k3m9x2p4') {
        return res.status(500).json({
            success: false,
            error: 'Konfigurasi API Key tidak valid',
            detail: 'API Key mungkin salah atau belum dikonfigurasi',
            solution: 'Periksa kembali API Key di file api/chat.js'
        });
    }
    
    try {
        console.log(`Mengirim request ke API dengan pesan: ${message.substring(0, 50)}...`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 detik timeout
        
        const response = await fetch(`${API_URL}?q=${encodeURIComponent(message)}&apikey=${API_KEY}`, {
            method: 'GET',
            signal: controller.signal,
            headers: {
                'User-Agent': 'cYama-AI/1.0'
            }
        });
        
        clearTimeout(timeoutId);
        
        // Cek status response
        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                error: `API merespon dengan status ${response.status}`,
                detail: `Server API mengembalikan kode error ${response.status}`,
                solution: response.status === 404 ? 'Endpoint API mungkin sudah berubah' :
                         response.status === 403 ? 'API Key tidak valid atau expired' :
                         response.status === 429 ? 'Terlalu banyak request, coba lagi nanti' :
                         'Coba periksa koneksi internet atau coba lagi nanti'
            });
        }
        
        const data = await response.json();
        console.log('Response API:', JSON.stringify(data).substring(0, 200));
        
        // Cek berbagai kemungkinan struktur response
        let reply = null;
        let errorDetail = null;
        
        if (data.status === false) {
            // API mengembalikan error
            errorDetail = {
                success: false,
                error: data.msg || 'API mengembalikan error',
                detail: `API Error: ${data.msg || 'Unknown error'}`,
                solution: data.msg?.includes('apikey') ? 'Periksa kembali API Key yang digunakan' :
                         data.msg?.includes('parameter') ? 'Parameter request mungkin salah' :
                         'Hubungi pengelola API untuk informasi lebih lanjut'
            };
            
            return res.status(400).json(errorDetail);
        }
        
        // Coba ekstrak reply dari berbagai kemungkinan struktur
        if (data.result) reply = data.result;
        else if (data.data) reply = data.data;
        else if (data.message) reply = data.message;
        else if (data.response) reply = data.response;
        else if (data.reply) reply = data.reply;
        else if (data.content) reply = data.content;
        else if (typeof data === 'string') reply = data;
        else reply = 'Maaf, saya tidak bisa memproses permintaan Anda. Format response tidak dikenali.';
        
        return res.status(200).json({
            success: true,
            reply: reply,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error detail:', error);
        
        // Deteksi tipe error dengan detail
        let errorMessage = {
            success: false,
            error: 'Terjadi kesalahan pada sistem',
            detail: error.message,
            solution: 'Coba beberapa langkah berikut:\n1. Periksa koneksi internet\n2. Coba kirim pesan lagi\n3. Refresh halaman\n4. Hubungi administrator jika error terus berulang'
        };
        
        if (error.name === 'AbortError') {
            errorMessage.error = 'Request timeout';
            errorMessage.detail = 'API tidak merespon dalam waktu yang ditentukan (30 detik)';
            errorMessage.solution = 'Server API mungkin sedang sibuk. Coba lagi beberapa saat.';
        } else if (error.message.includes('fetch')) {
            errorMessage.error = 'Gagal terhubung ke API';
            errorMessage.detail = 'Tidak dapat menjangkau server API';
            errorMessage.solution = 'Periksa apakah URL API masih aktif atau coba gunakan VPN.';
        } else if (error.message.includes('invalid json')) {
            errorMessage.error = 'Response API tidak valid';
            errorMessage.detail = 'Server API mengembalikan format yang tidak dikenali';
            errorMessage.solution = 'API mungkin sedang mengalami masalah. Coba lagi nanti.';
        }
        
        return res.status(500).json(errorMessage);
    }
}
