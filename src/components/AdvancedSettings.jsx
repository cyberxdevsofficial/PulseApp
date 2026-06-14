import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Camera, Trash2, Wallpaper, Shield, Bell, Lock,
  ChevronRight, ArrowLeft, Loader2, Globe, Monitor,
  Smartphone, LogOut, Check, X, Music, Volume2,
  Upload, Image as ImageIcon, Palette
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { db, auth } from '../services/firebase';
import { doc, updateDoc, collection, query, where, getDocs, deleteDoc, onSnapshot } from 'firebase/firestore';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { uploadToGithub } from '../services/githubStorage';

const AdvancedSettings = ({ onClose }) => {
  const { user, userData } = useAuth();
  const [activeSection, setActiveSection] = useState('main');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [sessions, setSessions] = useState([]);


  const [profileData, setProfileData] = useState({
    fullName: userData?.fullName || '',
    bio: userData?.bio || '',
    photoURL: userData?.photoURL || ''
  });


  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPassModal, setShowPassModal] = useState(false);


  const [wallpaper, setWallpaper] = useState(userData?.wallpaper || '');
  const wallPresets = [
    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1533035350221-afc02ed5a36d?q=80&w=1974&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=1974&auto=format&fit=crop'
  ];

  const [notifSettings, setNotifSettings] = useState(userData?.notifications || {
    messageSound: 'default',
    callSound: 'default',
    vibrate: true,
    desktopEnabled: false
  });

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      showToast("Browser doesn't support notifications");
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      showToast("Notifications enabled!");
      return true;
    } else {
      showToast("Notification permission denied");
      return false;
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };


  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'sessions'), where('uid', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSessions(docs);
    });
    return unsub;
  }, [user]);

  const handleUpdateAccount = async () => {
    try {
      setLoading(true);
      await updateDoc(doc(db, 'users', user.uid), profileData);
      showToast('Profile updated successfully!');
    } catch (err) {
      showToast('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (file) => {
    try {
      setLoading(true);
      const url = await uploadToGithub(file);
      await updateDoc(doc(db, 'users', user.uid), { photoURL: url });
      setProfileData(prev => ({ ...prev, photoURL: url }));
      showToast('Photo updated!');
    } catch (err) {
      showToast('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWallpaperChange = async (url) => {
    try {
      setWallpaper(url);
      await updateDoc(doc(db, 'users', user.uid), { wallpaper: url });
      showToast('Wallpaper applied!');
    } catch (err) {
      showToast('Error saving wallpaper');
    }
  };

  const handleCustomWallpaper = async (file) => {
    try {
      setLoading(true);
      const url = await uploadToGithub(file);
      handleWallpaperChange(url);
    } catch (err) {
      showToast('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) {
      return showToast("Passwords don't match");
    }
    try {
      setLoading(true);
      const credential = EmailAuthProvider.credential(user.email, passwords.current);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, passwords.new);
      showToast('Password updated!');
      setPasswords({ current: '', new: '', confirm: '' });
      setShowPassModal(false);
    } catch (err) {
      showToast('Incorrect current password');
    } finally {
      setLoading(false);
    }
  };

  const terminateSession = async (sessionId) => {
    try {
      await deleteDoc(doc(db, 'sessions', sessionId));
      showToast('Device logged out');
    } catch (err) {
      showToast('Error terminating session');
    }
  };

  const playTone = (tone) => {

    const sounds = {
      'Default': 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3',
      'Elegant': 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3',
      'Minimal': 'https://assets.mixkit.co/active_storage/sfx/2359/2359-preview.mp3',
      'Tech': 'https://assets.mixkit.co/active_storage/sfx/2361/2361-preview.mp3',
      'Classic': 'https://assets.mixkit.co/active_storage/sfx/135/135-preview.mp3',
      'Modern': 'https://assets.mixkit.co/active_storage/sfx/2355/2355-preview.mp3'
    };
    const audio = new Audio(sounds[tone] || sounds['Default']);
    audio.play().catch(e => console.log("Audio play blocked"));
  };

  const handleNotifUpdate = async (newSettings, previewTone) => {
    setNotifSettings(newSettings);
    await updateDoc(doc(db, 'users', user.uid), { notifications: newSettings });
    if (previewTone) playTone(previewTone);
  };

  const sections = [
    { id: 'account', icon: User, label: 'Account', sub: 'Bio, Name, Profile Photo', color: '#0084ff' },
    { id: 'chat', icon: Wallpaper, label: 'Chat Settings', sub: 'Wallpaper, Themes', color: '#f59e0b' },
    { id: 'privacy', icon: Shield, label: 'Privacy & Security', sub: 'Devices, Password', color: '#10b981' },
    { id: 'notifications', icon: Bell, label: 'Notifications', sub: 'Sounds, Alerts', color: '#ef4444' },
    { id: 'language', icon: Globe, label: 'Language', sub: 'English', color: '#a855f7' },
    { id: 'power', icon: Smartphone, label: 'Power Saving', sub: 'Off', color: '#6366f1' },
    { id: 'logout', icon: LogOut, label: 'Logout', sub: 'Sign out of your account', color: '#ef4444' }
  ];

  const renderMain = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '28px', marginBottom: '16px', cursor: 'pointer' }} onClick={() => setActiveSection('account')}>
        <div style={{ width: '85px', height: '85px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--glass-border)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
          {profileData.photoURL ? <img src={profileData.photoURL} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary)', color: 'white', fontSize: '2.5rem', fontWeight: 800 }}>{userData?.fullName?.[0]}</div>}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>{userData?.fullName}</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>{userData?.bio || 'Tap to edit bio'}</p>
        </div>
        <ChevronRight size={20} color="var(--text-dim)" />
      </div>

      <div style={{ padding: '8px 20px', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Settings</div>

      <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '28px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
        {sections.map((s, idx) => (
          <React.Fragment key={s.id}>
            <div
              onClick={() => setActiveSection(s.id)}
              style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.3s' }}
              className="menu-item-hover"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.icon size={22} color={s.color} />
                </div>
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>{s.label}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{s.sub}</span>
                <ChevronRight size={18} color="var(--text-dim)" opacity={0.5} />
              </div>
            </div>
            {idx < sections.length - 1 && <div style={{ height: 1, background: 'var(--glass-border)', margin: '0 20px' }} />}
          </React.Fragment>
        ))}
      </div>

      <div style={{ marginTop: '24px', background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(0, 132, 255, 0.2))', padding: '24px', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: 'var(--primary)', filter: 'blur(60px)', opacity: 0.3 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: '14px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Palette size={24} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>PulseApp Plus</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>Unlock exclusive features and themes</div>
          </div>
          <button className="btn-primary" style={{ height: 36, padding: '0 16px', borderRadius: 12, fontSize: '0.85rem' }}>View</button>
        </div>
      </div>
    </div>
  );

  const renderAccount = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '120px', height: '120px', margin: '0 auto', position: 'relative' }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '32px', overflow: 'hidden', border: '4px solid var(--glass-border)' }}>
            {profileData.photoURL ? <img src={profileData.photoURL} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary)', color: 'white', fontSize: '3rem' }}>{userData?.fullName?.[0]}</div>}
          </div>
          <label className="flex-center" style={{ position: 'absolute', bottom: '-10px', right: '-10px', width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '14px', cursor: 'pointer', border: '4px solid var(--bg-dark)' }}>
            <Camera size={18} color="white" />
            <input type="file" hidden onChange={e => e.target.files[0] && handlePhotoUpload(e.target.files[0])} />
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <label style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 600 }}>Full Name</label>
        <input
          className="input-glass"
          value={profileData.fullName}
          onChange={e => setProfileData(p => ({ ...p, fullName: e.target.value }))}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <label style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 600 }}>Bio</label>
        <textarea
          className="input-glass"
          style={{ height: '100px', resize: 'none' }}
          value={profileData.bio}
          onChange={e => setProfileData(p => ({ ...p, bio: e.target.value }))}
        />
      </div>

      <button className="btn-primary" onClick={handleUpdateAccount} disabled={loading}>
        {loading ? <Loader2 className="animate-spin" /> : 'Save Changes'}
      </button>
    </div>
  );

  const renderChat = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Chat Wallpaper</h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        <label className="glass flex-center" style={{ height: '120px', borderRadius: '20px', cursor: 'pointer', flexDirection: 'column', gap: '8px', border: '2px dashed var(--glass-border)' }}>
          <Upload size={24} color="var(--primary)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Custom Photo</span>
          <input type="file" hidden onChange={e => e.target.files[0] && handleCustomWallpaper(e.target.files[0])} />
        </label>
        {wallPresets.map((p, i) => (
          <div
            key={i}
            onClick={() => handleWallpaperChange(p)}
            style={{ height: '120px', borderRadius: '20px', overflow: 'hidden', cursor: 'pointer', border: wallpaper === p ? '3px solid var(--primary)' : '2px solid transparent' }}
          >
            <img src={p} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}
      </div>

      <div style={{ marginTop: '20px' }}>
        <h4 style={{ marginBottom: '10px', fontSize: '0.9rem', color: 'var(--text-dim)' }}>Preview</h4>
        <div style={{ height: '150px', borderRadius: '24px', background: wallpaper ? `url(${wallpaper}) center/cover` : 'var(--panel-bg)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', bottom: '20px', left: '20px', padding: '10px 20px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '15px 15px 15px 0', fontSize: '0.8rem' }}>
            This is how your chat will look!
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Active Devices</h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>{sessions.length} Devices</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sessions.map(s => (
          <div key={s.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.device === 'mobile' ? <Smartphone size={20} /> : <Monitor size={20} />}
              </div>
              <div>
                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {s.browser || 'Unknown Browser'}
                  {s.isCurrent && <span style={{ fontSize: '0.6rem', background: 'var(--success)', color: 'white', padding: '2px 6px', borderRadius: '6px' }}>THIS DEVICE</span>}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {s.city || 'Unknown City'}, {s.country || 'Unknown Country'} • {s.ip}
                </div>
              </div>
            </div>
            {!s.isCurrent && (
              <button onClick={() => terminateSession(s.id)} style={{ color: 'var(--error)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <Trash2 size={18} />
              </button>
            )}
          </div>
        ))}
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)' }} />

      <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Security</h3>
      <button
        className="glass-card"
        style={{ padding: '16px', borderRadius: '18px', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        onClick={() => setShowPassModal(true)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Lock size={20} color="var(--primary)" />
          <span style={{ fontWeight: 600 }}>Change Password</span>
        </div>
        <ChevronRight size={18} />
      </button>

      {showPassModal && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '24px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input className="input-glass" type="password" placeholder="Current Password" value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} />
          <input className="input-glass" type="password" placeholder="New Password" value={passwords.new} onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))} />
          <input className="input-glass" type="password" placeholder="Confirm New Password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} />
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button className="btn-primary" style={{ flex: 1 }} onClick={handlePasswordChange}>Update</button>
            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowPassModal(false)}>Cancel</button>
          </div>
        </motion.div>
      )}
    </div>
  );

  const renderNotifications = () => {
    const tones = ['None', 'Default', 'Elegant', 'Minimal', 'Tech', 'Classic', 'Modern'];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Monitor size={20} color="var(--primary)" />
              <div>
                <div style={{ fontWeight: 600 }}>Desktop Notifications</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Show system notifications for new messages</div>
              </div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={notifSettings.desktopEnabled}
                onChange={async (e) => {
                  const checked = e.target.checked;
                  if (checked) {
                    const granted = await requestNotificationPermission();
                    if (granted) handleNotifUpdate({ ...notifSettings, desktopEnabled: true });
                  } else {
                    handleNotifUpdate({ ...notifSettings, desktopEnabled: false });
                  }
                }}
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>

        <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Volume2 size={20} color="var(--primary)" />
              <div>
                <div style={{ fontWeight: 600 }}>Notification Sounds</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Play audio for incoming messages</div>
              </div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={notifSettings.messageSound !== 'None'}
                onChange={(e) => {
                  handleNotifUpdate({ ...notifSettings, messageSound: e.target.checked ? 'Default' : 'None' });
                }}
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Message Sound</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {tones.map(t => (
              <div
                key={t}
                onClick={() => handleNotifUpdate({ ...notifSettings, messageSound: t }, t)}
                style={{ padding: '12px', background: notifSettings.messageSound === t ? 'var(--primary)' : 'rgba(255,255,255,0.03)', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--glass-border)' }}
              >
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t}</span>
                <Music size={14} opacity={notifSettings.messageSound === t ? 1 : 0.4} />
              </div>
            ))}
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)' }} />

        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Call Ringtone</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {['Classic', 'Modern', 'Melodic', 'Digital'].map(t => (
              <div
                key={t}
                onClick={() => handleNotifUpdate({ ...notifSettings, callSound: t }, t)}
                style={{ padding: '12px', background: notifSettings.callSound === t ? 'var(--primary)' : 'rgba(255,255,255,0.03)', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--glass-border)' }}
              >
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t}</span>
                <Volume2 size={14} opacity={notifSettings.callSound === t ? 1 : 0.4} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="modal-content"
        style={{ maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px', position: 'sticky', top: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(20px)', zIndex: 10, padding: '10px 0' }}>
          {activeSection !== 'main' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button onClick={() => setActiveSection('main')} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer' }}>
                <ArrowLeft size={20} />
              </button>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</h2>
            </div>
          ) : (
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Settings</h2>
          )}
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {activeSection === 'main' && renderMain()}
        {activeSection === 'account' && renderAccount()}
        {activeSection === 'chat' && renderChat()}
        {activeSection === 'privacy' && renderPrivacy()}
        {activeSection === 'notifications' && renderNotifications()}
        {activeSection === 'logout' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <h3 style={{ marginBottom: 20 }}>Are you sure you want to logout?</h3>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn-primary" style={{ background: 'var(--error)', width: 150 }} onClick={() => auth.signOut()}>Logout</button>
              <button className="btn-secondary" style={{ width: 150 }} onClick={() => setActiveSection('main')}>Cancel</button>
            </div>
          </div>
        )}

        {toast && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: 'white', padding: '10px 25px', borderRadius: '50px', zIndex: 100, fontWeight: 600, boxShadow: '0 10px 20px var(--primary-glow)' }}>
            {toast}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default AdvancedSettings;
