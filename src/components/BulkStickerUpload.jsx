import React, { useState } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { uploadToGithub } from '../services/githubStorage';
import { Loader2, Upload, CheckCircle, AlertCircle } from 'lucide-react';

const BulkStickerUpload = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const startUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    const newResults = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {

        const url = await uploadToGithub(file);


        await addDoc(collection(db, 'stickers'), {
          url,
          ownerId: 'system',
          packName: 'Official Pack',
          timestamp: serverTimestamp()
        });

        newResults.push({ name: file.name, status: 'success' });
      } catch (err) {
        console.error(err);
        newResults.push({ name: file.name, status: 'error', message: err.message });
      }
      setProgress(Math.round(((i + 1) / files.length) * 100));
    }

    setResults(newResults);
    setUploading(false);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', color: 'white' }}>
      <h1 style={{ marginBottom: '20px' }}>Bulk Sticker Uploader</h1>
      <p style={{ opacity: 0.7, marginBottom: '30px' }}>Select all unzipped stickers from your folder to upload them to the server and add them to the database.</p>

      <div className="glass" style={{ padding: '30px', borderRadius: '20px', textAlign: 'center' }}>
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          style={{ marginBottom: '20px' }}
          id="bulk-input"
          hidden
        />
        <label htmlFor="bulk-input" className="btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <Upload size={20} /> Select Stickers ({files.length} selected)
        </label>

        {files.length > 0 && !uploading && (
          <button
            onClick={startUpload}
            className="btn-primary"
            style={{ marginLeft: '10px', background: 'var(--success)' }}
          >
            Start Uploading {files.length} Files
          </button>
        )}

        {uploading && (
          <div style={{ marginTop: '30px' }}>
            <Loader2 className="animate-spin" size={40} style={{ margin: '0 auto 20px', color: 'var(--primary)' }} />
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Uploading... {progress}%</div>
            <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', marginTop: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s' }} />
            </div>
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div style={{ marginTop: '40px' }}>
          <h3>Results</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '15px', marginTop: '10px' }}>
            {results.map((res, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                <span style={{ opacity: 0.8 }}>{res.name}</span>
                {res.status === 'success' ? (
                  <CheckCircle size={16} color="#10b981" />
                ) : (
                  <span title={res.message}><AlertCircle size={16} color="#ef4444" /></span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkStickerUpload;
