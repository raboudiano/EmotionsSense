import React, { useState, useRef } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('sentimentHistory');
    return saved ? JSON.parse(saved) : [];
  });

  const [useCamera, setUseCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    setUseCamera(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setUseCamera(false);
  };

  const captureFromCamera = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        setImage(blob);
        setPreview(URL.createObjectURL(blob));
        stopCamera();
      }, 'image/png');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const analyzeSentiment = async () => {
    if (!image) return alert('No image to analyze.');

    setLoading(true);
    const formData = new FormData();
    formData.append('image', image);

    try {
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      const newEntry = { image: preview, result: data };
      const updatedHistory = [...history, newEntry];
      setHistory(updatedHistory);
      localStorage.setItem('sentimentHistory', JSON.stringify(updatedHistory));
    } catch (err) {
      console.error('Analysis error:', err);
      alert('Failed to analyze image.');
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('sentimentHistory');
  };

  return (
    <div className="bg-light text-dark min-vh-100 d-flex flex-column">
      {/* Header */}
      <header className="gradient-header text-white py-4 shadow">
  <div className="container d-flex justify-content-between align-items-center">
    <h1 className="h3 fw-bold">🎭 EmotionWave</h1>
    <span className="fst-italic">Feel the AI Pulse</span>
  </div>
</header>


      {/* Main Content */}
      <main className="flex-grow-1 py-5">
        <div className="container">
          <div className="card shadow-sm p-4">
            <div className="d-flex flex-column flex-sm-row justify-content-center gap-3 mb-4">
              <input type="file" accept="image/*" onChange={handleFileUpload} className="form-control" />
              {!useCamera ? (
                <button onClick={startCamera} className="btn btn-success">Open Camera</button>
              ) : (
                <button onClick={stopCamera} className="btn btn-warning">Stop Camera</button>
              )}
            </div>

            {useCamera && (
              <div className="mb-4">
                <video ref={videoRef} autoPlay className="w-100 rounded shadow-sm" style={{ maxHeight: '300px' }} />
                <canvas ref={canvasRef} className="d-none" />
                <button
                  onClick={captureFromCamera}
                  className="btn btn-primary mt-2 w-100"
                >
                  Capture from Camera
                </button>
              </div>
            )}

            {preview && (
              <div className="mb-4 text-center">
                <img src={preview} alt="Preview" className="img-fluid rounded border shadow-sm" style={{ maxHeight: '250px' }} />
              </div>
            )}

            {loading && (
              <div className="text-center mb-3">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Analyzing...</p>
              </div>
            )}

            <div className="d-flex justify-content-center gap-3 mb-4">
              <button onClick={analyzeSentiment} className="btn btn-primary">Analyze Emotion</button>
              <button onClick={clearHistory} className="btn btn-danger">Clear History</button>
            </div>

            <h4 className="mb-3">Analysis History</h4>
            {history.length === 0 ? (
              <p className="text-muted">No analysis yet.</p>
            ) : (
              <div className="row g-3">
                {history.map((entry, index) => (
                  <div key={index} className="col-sm-6">
                    <div className="card h-100">
                      <img src={entry.image} alt="Analyzed" className="card-img-top" style={{ maxHeight: '180px', objectFit: 'cover' }} />
                      <div className="card-body">
                        {entry.result.error ? (
                          <p className="text-danger fw-bold">{entry.result.error}</p>
                        ) : (
                          <>
                            <p><strong>Sentiment:</strong> <span className="text-primary">{entry.result.label}</span></p>
                            <p><strong>Emotion:</strong> {entry.result.emotion}</p>
                            <p><strong>Confidence:</strong> {(entry.result.score * 100).toFixed(2)}%</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-white text-center py-4 mt-auto">
  <div className="container">
  <p className="mb-0">Made with ❤️ by Ibrahim Raboudi · © {new Date().getFullYear()} EmotionSense</p>
    
  </div>
</footer>

    </div>
  );
}

export default App;
