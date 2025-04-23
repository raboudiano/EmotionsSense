const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'emotion_db',
  port: 3307
});

db.connect(err => {
  if (err) throw err;
  console.log('MySQL connected.');
});

app.post('/api/analyze', upload.single('image'), (req, res) => {
  const imagePath = path.join(__dirname, 'uploads', req.file.filename);
  const imgUrl = `http://localhost:5000/uploads/${req.file.filename}`;

  const python = spawn('python', ['sentiment.py', imagePath]);

  let data = '';
  let errorData = '';

  python.stdout.on('data', (chunk) => {
    data += chunk.toString();
  });

  python.stderr.on('data', (chunk) => {
    errorData += chunk.toString();
  });

  python.on('close', (code) => {
    if (code !== 0) {
      console.error('[PYTHON ERROR]', errorData);
      return res.status(500).json({ error: 'Emotion analysis failed' });
    }

    try {
      const result = JSON.parse(data);
      const { label, emotion, score } = result;

      db.query(
        'INSERT INTO analysis_history (image_url, sentiment, emotion, confidence) VALUES (?, ?, ?, ?)',
        [imgUrl, label, emotion, score],
        (err) => {
          if (err) return res.status(500).json({ error: 'Database error' });
          res.json({ ...result, image_url: imgUrl });
        }
      );
    } catch (e) {
      console.error('[PARSE ERROR]', e.message);
      res.status(500).json({ error: 'Invalid response from sentiment.py' });
    }
  });
});

app.listen(port, () => console.log(`Server running on port ${port}`));
