import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, X, Loader2, Smile, Clock, Star, Heart, Zap } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot, orderBy } from 'firebase/firestore';
import { uploadToGithub } from '../services/githubStorage';

const StickerPicker = ({ onSelect, user, onClose }) => {
  const [activeTab, setActiveTab] = useState('recent');
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const DEFAULT_STICKERS = [
    { id: 'd1', url: 'https://qu.ax/x/rKi4T.png' },
    { id: 'd2', url: 'https://qu.ax/x/WA_Business_1.png' },
  ];

  useEffect(() => {

    const q = query(collection(db, 'stickers'));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => {
        const timeA = a.timestamp?.toMillis?.() || a.timestamp?.seconds * 1000 || 0;
        const timeB = b.timestamp?.toMillis?.() || b.timestamp?.seconds * 1000 || 0;
        return timeB - timeA;
      });
      setStickers(docs);
    });
    return unsub;
  }, []);

  const handleCreateSticker = async (file) => {
    try {
      setIsUploading(true);
      console.log('Uploading sticker:', file.name);
      const url = await uploadToGithub(file);
      console.log('Upload success:', url);
      await addDoc(collection(db, 'stickers'), {
        url,
        ownerId: user.uid,
        packName: 'My Stickers',
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error('Sticker Creation Error:', err);
      alert('Failed to create sticker: ' + (err.message || 'Unknown error') + '\n\nCheck console for details.');
    } finally {
      setIsUploading(false);
    }
  };

  const tabs = [
    { id: 'recent', icon: Clock },
    { id: 'favorites', icon: Star },
    { id: 'trending', icon: Zap },
    { id: 'custom', icon: Heart },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="glass"
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 15px)',
        left: 0,
        width: 'min(90vw, 400px)',
        height: '450px',
        borderRadius: '24px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(40px) saturate(200%)'
      }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '14px', display: 'flex', alignItems: 'center', padding: '0 12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <Search size={16} opacity={0.5} />
          <input
            placeholder="Search stickers..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'white', padding: '10px', fontSize: '0.9rem', outline: 'none', width: '100%' }}
          />
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', opacity: 0.5 }}><X size={20} /></button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          <label className="flex-center hover-bright" style={{ aspectRatio: '1/1', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', cursor: 'pointer', border: '2px dashed rgba(255,255,255,0.1)', flexDirection: 'column', gap: 4 }}>
            {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
            <span style={{ fontSize: '0.65rem', fontWeight: 600, opacity: 0.6 }}>Create</span>
            <input type="file" hidden accept="image/*" onChange={e => e.target.files[0] && handleCreateSticker(e.target.files[0])} />
          </label>

          {DEFAULT_STICKERS.map((stk) => (
            <motion.div
              key={stk.id}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onSelect(stk.url)}
              style={{ aspectRatio: '1/1', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', cursor: 'pointer', overflow: 'hidden', padding: 8, border: '1px solid rgba(0,132,255,0.2)' }}
            >
              <img src={stk.url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="sticker" />
            </motion.div>
          ))}

          {stickers.map((stk) => (
            <motion.div
              key={stk.id}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onSelect(stk.url)}
              style={{ aspectRatio: '1/1', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', cursor: 'pointer', overflow: 'hidden', padding: 8 }}
            >
              <img src={stk.url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="sticker" />
            </motion.div>
          ))}
        </div>
      </div>

      <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ background: 'transparent', border: 'none', color: activeTab === tab.id ? 'var(--primary)' : 'white', opacity: activeTab === tab.id ? 1 : 0.4, cursor: 'pointer', transition: 'all 0.3s' }}
            >
              <tab.icon size={20} />
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />
        <button style={{ background: 'transparent', border: 'none', color: 'white', opacity: 0.4 }}><Smile size={20} /></button>
      </div>
    </motion.div>
  );
};

export default StickerPicker;
