const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// إعداد multer لتخزين الملفات المرفوعة في مجلد "uploads"
const upload = multer({ dest: 'uploads/' });

// إنشاء مجلد "uploads" إذا لم يكن موجودًا
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.post('/api/analyze', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image uploaded' });
    }

    const imagePath = path.join(__dirname, req.file.path);
    const scriptPath = path.join(__dirname, 'sentiment.py');

    // تشغيل سكريبت Python مع مسار الصورة كوسيط
    const pythonProcess = spawn(
        'C:\\Users\\boub0\\AppData\\Local\\Programs\\Python\\Python310\\python.exe',
        [scriptPath, imagePath]
    );

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error(`Python stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        // حذف الصورة بعد المعالجة
        fs.unlinkSync(imagePath);

        if (code === 0) {
            try {
                console.log("Python output:", output);
                res.json(JSON.parse(output));
            } catch (error) {
                console.error("JSON parse error:", error);
                res.status(500).json({ error: 'Failed to parse sentiment analysis result' });
            }
        } else {
            console.error("Python exited with code:", code);
            res.status(500).json({
                error: 'Image analysis failed',
                details: errorOutput || 'No additional error output.'
            });
        }
    });
});

app.listen(5000, () => {
    console.log('Server running at http://localhost:5000');
});
