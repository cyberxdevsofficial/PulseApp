import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { MessageSquare, Users, Radio, Phone, LogOut, Plus, Search, User, Camera, X, Check, Settings as SettingsIcon, Bell, Shield, Moon, Sun, Info, Image as ImageIcon, Loader2, Palette, MoreHorizontal, MoreVertical, Layout, PhoneCall, PhoneMissed, Mic, MicOff, VideoOff, Video as VideoIcon, ChevronRight } from 'lucide-react';
import { auth, db, rtdb } from '../services/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, setDoc, query, where, getDocs, limit, getDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { ref as rRef, onValue as onRtdbValue, set as setRtdb, update as updateRtdb, push as pushRtdb } from 'firebase/database';
import { uploadToGithub } from '../services/githubStorage';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import { motion, AnimatePresence } from 'framer-motion';
import VideoCallModal from '../components/VideoCallModal';
import { usePresence } from '../hooks/usePresence';
import AdvancedSettings from '../components/AdvancedSettings';

const Home = () => {
  usePresence();
  const { user, userData } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('chats');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (location.state?.selectedChatId) {
      const { selectedChatId, selectedType } = location.state;
      setActiveTab(selectedType || 'chats');

      const fetchItem = async () => {
        try {
          const docRef = doc(db, selectedType || 'conversations', selectedChatId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setSelectedItem({ id: docSnap.id, ...docSnap.data() });
          }
        } catch (err) { console.error(err); }
      };
      fetchItem();
    }
  }, [location]);

  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1000);
  const [vh, setVh] = useState(window.innerHeight * 0.01);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1000);
      setVh(window.innerHeight * 0.01);
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [showCreateModal, setShowCreateModal] = useState(null);
  const [createData, setCreateData] = useState({ name: '', description: '', logo: '' });
  const [profileData, setProfileData] = useState({ fullName: '', bio: '', photoURL: '' });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);

  useEffect(() => {
    if (userData) {
      setProfileData({
        fullName: userData.fullName || '',
        bio: userData.bio || '',
        photoURL: userData.photoURL || ''
      });
    }
  }, [userData]);

  useEffect(() => {
    if (!user) return;
    const userCallsRef = rRef(rtdb, `incoming_calls/${user.uid}`);
    return onRtdbValue(userCallsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const callIds = Object.keys(data);
        const lastCallId = callIds[callIds.length - 1];
        const callData = data[lastCallId];
        if (callData.status === 'ringing') setIncomingCall({ id: lastCallId, ...callData });
        else setIncomingCall(null);
      } else setIncomingCall(null);
    });
  }, [user]);

  const handleAcceptCall = async () => {
    if (!incomingCall) return;
    setActiveCall({ id: incomingCall.id, caller: { name: incomingCall.callerName, photoURL: incomingCall.callerPhoto }, isReceiving: true });
    setIncomingCall(null);
  };

  const handleDeclineCall = async () => {
    if (!incomingCall) return;
    try {
      await updateRtdb(rRef(rtdb, `calls/${incomingCall.id}`), { status: 'rejected' });
      await updateRtdb(rRef(rtdb, `incoming_calls/${user.uid}/${incomingCall.id}`), { status: 'rejected' });
      await addDoc(collection(db, 'messages'), {
        chatId: incomingCall.chatId, senderId: incomingCall.callerId, senderName: incomingCall.callerName,
        type: 'call_log', text: 'Missed video call', missed: true, timestamp: serverTimestamp()
      });
    } catch (e) { console.error(e); }
    setIncomingCall(null);
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };


  useEffect(() => {
    if (!user || !userData) return;

    const q = query(
      collection(db, 'messages'),
      where('timestamp', '>', new Date()),
      limit(1)
    );

    const unsub = onSnapshot(q, (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const msg = change.doc.data();


          if (msg.senderId === user.uid) return;


          const notifs = userData.notifications || {};


          if (notifs.messageSound && notifs.messageSound !== 'None') {
            const sounds = {
              'Default': 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3',
              'Elegant': 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3',
              'Minimal': 'https://assets.mixkit.co/active_storage/sfx/2359/2359-preview.mp3',
              'Tech': 'https://assets.mixkit.co/active_storage/sfx/2361/2361-preview.mp3',
              'Classic': 'https://assets.mixkit.co/active_storage/sfx/135/135-preview.mp3',
              'Modern': 'https://assets.mixkit.co/active_storage/sfx/2355/2355-preview.mp3'
            };
            const audio = new Audio(sounds[notifs.messageSound] || sounds['Default']);
            audio.play().catch(e => { });
          }


          if (notifs.desktopEnabled && Notification.permission === 'granted' && document.visibilityState === 'hidden') {
            new Notification(msg.senderName, {
              body: msg.text || 'New message',
              icon: '/logo.png'
            });
          }
        }
      });
    });

    return () => unsub();
  }, [user, userData]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateDoc(doc(db, "users", user.uid), profileData);
      setShowProfile(false);
      showToast('Profile updated!');
    } catch (err) { showToast('Error updating profile'); }
    finally { setLoading(false); }
  };

  const handleUpdateProfilePhoto = async (file) => {
    try {
      setLoading(true);
      const url = await uploadToGithub(file, `avatars/${user.uid}_${Date.now()}.jpg`);
      await updateDoc(doc(db, 'users', user.uid), { photoURL: url });
      setProfileData(prev => ({ ...prev, photoURL: url }));
      showToast('Photo updated!');
    } catch (err) { showToast('Upload failed: ' + err.message); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const collectionName = showCreateModal === 'groups' ? 'groups' : 'channels';
      const docRef = await addDoc(collection(db, collectionName), {
        ...createData, adminId: user.uid, members: [user.uid], createdAt: serverTimestamp()
      });
      showToast(`${showCreateModal === 'groups' ? 'Group' : 'Channel'} created!`);
      setShowCreateModal(null);
      setCreateData({ name: '', description: '', logo: '' });
      setSelectedItem({ id: docRef.id, ...createData });
      setActiveTab(collectionName);
    } catch (err) { showToast('Error creating community'); }
    finally { setLoading(false); }
  };

  const handleLogout = () => auth.signOut();

  const tabs = [
    { id: 'chats', icon: MessageSquare, label: 'Chats' },
    { id: 'groups', icon: Users, label: 'Groups' },
    { id: 'channels', icon: Radio, label: 'Channels' },
    { id: 'calls', icon: Phone, label: 'Calls' },
  ];

  return (
    <div
      className={`app-container ${isMobile && selectedItem ? 'mobile-active' : ''}`}
      style={{
        height: `calc(${vh} * 100)`,
        backgroundImage: userData?.wallpaper ? `linear-gradient(rgba(1, 6, 26, 0.7), rgba(1, 6, 26, 0.7)), url(${userData.wallpaper})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transition: 'background 0.5s ease'
      }}
    >
      <AnimatePresence>
        {toast && <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="toast">{toast}</motion.div>}
        {incomingCall && (
          <div className="incoming-call-overlay">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="call-card glass">
              <div className="call-avatar">{incomingCall.callerPhoto ? <img src={incomingCall.callerPhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={40} />}</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{incomingCall.callerName}</h3>
              <p style={{ color: 'var(--text-dim)', marginTop: 8 }}>Incoming Video Call...</p>
              <div className="call-actions">
                <button onClick={handleDeclineCall} className="decline-btn"><PhoneMissed size={28} /></button>
                <button onClick={handleAcceptCall} className="accept-btn"><PhoneCall size={28} /></button>
              </div>
            </motion.div>
          </div>
        )}
        {activeCall && (
          <VideoCallModal
            callId={activeCall.id}
            caller={activeCall.caller}
            isReceiving={activeCall.isReceiving}
            onClose={() => setActiveCall(null)}
          />
        )}
      </AnimatePresence>

      {/* Vertical Premium Sidebar / Mobile Bottom Nav */}
      <div className="sidebar">
        {!isMobile && (
          <div className="logo" style={{ marginBottom: 40, overflow: 'hidden' }}>
            <img src="/logo.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Sannasa Logo" />
          </div>
        )}

        <div className="sidebar-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedItem(null); }}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              title={tab.label}
            >
              <tab.icon size={isMobile ? 22 : 26} />
              {isMobile && <span>{tab.label}</span>}
            </button>
          ))}
          {isMobile && (
            <button onClick={() => setShowSettings(true)} className="nav-item">
              <SettingsIcon size={22} />
              <span>Settings</span>
            </button>
          )}
        </div>

        {!isMobile && (
          <div className="sidebar-footer">
            <button onClick={() => setShowSettings(true)} className="nav-item"><SettingsIcon size={24} /></button>
            <div onClick={() => setShowProfile(true)} style={{ cursor: 'pointer' }}>
              <div className="avatar-small">
                {profileData.photoURL ? <img src={profileData.photoURL} /> : profileData.fullName?.[0]}
              </div>
            </div>
            <button onClick={handleLogout} className="nav-item" style={{ color: 'var(--error)' }}><LogOut size={24} /></button>
          </div>
        )}
      </div>

      {/* Main Experience */}
      <div className="main-content">
        <div className="list-panel">
          <div className="panel-header" style={{ padding: isMobile ? '20px' : '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>
              {activeTab === 'chats' ? 'Chats' : activeTab === 'groups' ? 'Groups' : activeTab === 'channels' ? 'Channels' : 'Calls'}
            </h2>
            {/* + button: only for chats (new chat) and channels (new channel). Groups require admin invite. */}
            {activeTab !== 'groups' && activeTab !== 'calls' && (
              <button
                onClick={() => setShowCreateModal(activeTab === 'chats' ? 'groups' : activeTab)}
                className="btn-primary"
                style={{ width: 44, height: 44, borderRadius: 12, padding: 0 }}
              >
                <Plus size={24} />
              </button>
            )}
            {activeTab === 'groups' && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 500 }}>Private</span>
            )}
          </div>

          {/* Search bar: hidden for groups (private), shown for chats and channels */}
          {activeTab !== 'groups' && activeTab !== 'calls' && (
            <div className="search-bar-container">
              <div className="search-bar">
                <Search size={18} color="var(--text-dim)" />
                <input
                  type="text"
                  placeholder={activeTab === 'channels' ? 'Search channels...' : 'Search chats...'}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          )}

          <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 20px' }}>
            <ChatList type={activeTab} onSelect={setSelectedItem} selectedId={selectedItem?.id} searchTerm={searchTerm} isMobile={isMobile} />
          </div>
        </div>

        <div className="chat-panel">
          {selectedItem ? (
            <ChatWindow
              item={selectedItem}
              type={activeTab}
              isMobile={isMobile}
              onBack={() => setSelectedItem(null)}
              onClose={() => setSelectedItem(null)}
              onCreateNew={() => setShowCreateModal(activeTab === 'chats' ? 'groups' : activeTab)}
            />
          ) : (
            <div className="welcome-screen">
              <div style={{ maxWidth: 400 }}>
                <div style={{ width: 100, height: 100, background: 'rgba(255,255,255,0.03)', borderRadius: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--primary)', border: '1px solid var(--glass-border)' }}>
                  <MessageSquare size={48} />
                </div>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: 10 }}>Sannasa Web</h2>
                <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem' }}>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showProfile && (
          <div className="modal-overlay" onClick={() => setShowProfile(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="close-btn" onClick={() => setShowProfile(false)}><X size={20} /></button>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 30 }}>Profile Settings</h2>
              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 110, height: 110, borderRadius: 28, background: 'var(--primary)', margin: '0 auto', overflow: 'hidden', position: 'relative', border: '4px solid var(--glass-border)' }}>
                    {profileData.photoURL ? <img src={profileData.photoURL} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : profileData.fullName?.[0]}
                    <label style={{ position: 'absolute', bottom: 0, right: 0, left: 0, height: '35%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Camera size={18} color="white" /><input type="file" onChange={e => e.target.files[0] && handleUpdateProfilePhoto(e.target.files[0])} hidden />
                    </label>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600 }}>Full Name</label>
                  <input type="text" value={profileData.fullName} onChange={e => setProfileData(p => ({ ...p, fullName: e.target.value }))} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: 'white', padding: 14, borderRadius: 14, outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600 }}>Bio</label>
                  <textarea value={profileData.bio} onChange={e => setProfileData(p => ({ ...p, bio: e.target.value }))} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: 'white', padding: 14, borderRadius: 14, outline: 'none', height: 100, resize: 'none' }} />
                </div>
                <button type="submit" className="btn-primary" disabled={loading} style={{ height: 52, margin: '10px auto 0', width: isMobile ? '100%' : '200px' }}>{loading ? <Loader2 className="animate-spin" /> : 'Save Changes'}</button>
                {isMobile && <button type="button" onClick={handleLogout} className="btn-primary" style={{ background: 'var(--error)', height: 52, width: '100%', marginTop: 10 }}><LogOut size={20} /> Logout</button>}
              </form>
            </motion.div>
          </div>
        )}

        {showSettings && (
          <AdvancedSettings onClose={() => setShowSettings(false)} />
        )}

        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="close-btn" onClick={() => setShowCreateModal(null)}><X size={20} /></button>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 30 }}>Create {showCreateModal === 'groups' ? 'Group' : 'Channel'}</h2>
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600 }}>Name</label>
                  <input type="text" value={createData.name} onChange={e => setCreateData(prev => ({ ...prev, name: e.target.value }))} required style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: 'white', padding: 14, borderRadius: 14, outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600 }}>Description</label>
                  <textarea value={createData.description} onChange={e => setCreateData(prev => ({ ...prev, description: e.target.value }))} required style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: 'white', padding: 14, borderRadius: 14, outline: 'none', height: 100, resize: 'none' }} />
                </div>
                <button type="submit" className="btn-primary" disabled={loading} style={{ height: 52 }}>{loading ? <Loader2 className="animate-spin" /> : 'Create'}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
