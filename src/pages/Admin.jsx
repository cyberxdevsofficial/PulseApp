import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy, addDoc, serverTimestamp, onSnapshot, where, deleteDoc } from 'firebase/firestore';
import { User, Users, Shield, MessageSquare, AlertTriangle, CheckCircle, Ban, Search, LogOut, Send, Activity, Layout, Trash2, ShieldCheck, Mail, Clock, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SupportTicket = ({ msg, isVerified, onReply, onDelete }) => {
  const [reply, setReply] = useState('');
  return (
    <div className="admin-card" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>{msg.senderName?.[0]}</div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              {msg.senderName} {isVerified && <img src="/verified.png" style={{ width: 18, height: 18 }} alt="verified" />}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>ID: {msg.senderId}</div>
          </div>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={16} /> {msg.timestamp?.toDate().toLocaleString()}</div>
      </div>
      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem', fontSize: '1.05rem', lineHeight: 1.6 }}>
        {msg.text}
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <input type="text" className="search-bar" placeholder="Type your official response..." value={reply} onChange={e => setReply(e.target.value)} style={{ flex: 1, padding: '0 20px' }} />
        <button onClick={() => { onReply(msg, reply); setReply(''); }} className="btn-primary" style={{ width: '60px', padding: 0 }}><Send size={24} /></button>
        <button onClick={() => onDelete(msg.id)} className="admin-card" style={{ width: '60px', color: 'var(--error)', border: 'none', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={24} /></button>
      </div>
    </div>
  );
};

const Admin = () => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminCreds, setAdminCreds] = useState({ username: '', password: '' });
  const [activeTab, setActiveTab] = useState('dashboard');

  const [users, setUsers] = useState([]);
  const [supportMsgs, setSupportMsgs] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [stats, setStats] = useState({ users: 0, groups: 0, msgs: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [systemMsg, setSystemMsg] = useState('');
  const [lastError, setLastError] = useState(null);

  const ADMIN_USER = import.meta.env.VITE_ADMIN_USER;
  const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS;

  useEffect(() => {
    if (!isAdminLoggedIn) return;

    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setStats(prev => ({ ...prev, users: snap.size }));
    }, (err) => setLastError(`Users: ${err.message}`));

    const unsubGroups = onSnapshot(collection(db, "groups"), (snap) => {
      const gList = snap.docs.map(doc => ({ id: doc.id, type: 'Group', ...doc.data() }));
      setCommunities(prev => [...gList, ...prev.filter(c => c.type !== 'Group')]);
      setStats(prev => ({ ...prev, groups: snap.size + (communities.filter(c => c.type === 'Channel').length) }));
    }, (err) => setLastError(`Groups: ${err.message}`));

    const unsubChannels = onSnapshot(collection(db, "channels"), (snap) => {
      const cList = snap.docs.map(doc => ({ id: doc.id, type: 'Channel', ...doc.data() }));
      setCommunities(prev => [...cList, ...prev.filter(c => c.type !== 'Channel')]);
    }, (err) => setLastError(`Channels: ${err.message}`));

    const unsubSupport = onSnapshot(collection(db, "support_messages"), (snap) => {
      const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      msgs.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setSupportMsgs(msgs);
    }, (err) => setLastError(`Tickets: ${err.message}`));

    return () => {
      unsubUsers(); unsubGroups(); unsubChannels(); unsubSupport();
    };
  }, [isAdminLoggedIn]);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminCreds.username === ADMIN_USER && adminCreds.password === ADMIN_PASS) {
      setIsAdminLoggedIn(true);
    } else alert("Invalid Credentials. Please check Admin ID and Passkey.");
  };

  const handleReply = async (msg, text) => {
    if (!text.trim()) return;
    try {
      await addDoc(collection(db, 'messages'), {
        chatId: `support_${msg.senderId}`,
        senderId: 'sannasa_system',
        senderName: 'Sannasa Official',
        text: text,
        replyToId: msg.originalMsgId || null,
        replyToText: msg.text || '',
        replyToSender: msg.senderName || 'User',
        timestamp: serverTimestamp(),
        type: 'text'
      });
      await setDoc(doc(db, 'conversations', `support_${msg.senderId}`), {
        lastMessage: `Reply: ${text}`,
        lastMessageTime: serverTimestamp(),
        isPublic: false,
        [`unreadCount.${msg.senderId}`]: increment(1)
      }, { merge: true });
      await deleteDoc(doc(db, 'support_messages', msg.id));
      alert("Reply sent and ticket closed.");
    } catch (err) { console.error(err); }
  };

  const handleDeleteCommunity = async (id, type) => {
    const collectionName = type === 'Group' ? 'groups' : 'channels';
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (err) { console.error(err); }
  };

  const handleSystemBroadcast = async () => {
    if (!systemMsg.trim()) return;
    try {
      await addDoc(collection(db, 'messages'), {
        chatId: 'sannasa_official', senderId: 'sannasa_system', senderName: 'Sannasa Official',
        text: systemMsg, timestamp: serverTimestamp(), type: 'text'
      });
      await setDoc(doc(db, 'conversations', 'sannasa_official'), {
        lastMessage: systemMsg,
        lastMessageTime: serverTimestamp(),
        isPublic: true
      }, { merge: true });
      setSystemMsg('');
      alert('Announcement posted successfully.');
    } catch (err) { console.error(err); }
  };

  const StatCard = ({ icon, title, value, color }) => (
    <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
      <div style={{ width: 60, height: 60, borderRadius: 20, background: `rgba(${color}, 0.1)`, display: 'flex', justifyContent: 'center', alignItems: 'center', color: `rgb(${color})` }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>{title}</div>
        <div style={{ fontSize: '2rem', fontWeight: 800 }}>{value}</div>
      </div>
    </div>
  );

  if (!isAdminLoggedIn) {
    return (
      <div className="modal-overlay">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="modal-content">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 8px 32px var(--primary-glow)' }}>
              <Shield size={32} color="white" />
            </div>
          </div>
          <h1 style={{ textAlign: 'center', marginBottom: '2.5rem', fontSize: '2rem', fontWeight: 800 }}>Admin Access</h1>
          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="search-bar"><User size={18} color="var(--text-dim)" /><input type="text" placeholder="Admin ID" onChange={(e) => setAdminCreds({ ...adminCreds, username: e.target.value })} required /></div>
            <div className="search-bar"><Shield size={18} color="var(--text-dim)" /><input type="password" placeholder="Passkey" onChange={(e) => setAdminCreds({ ...adminCreds, password: e.target.value })} required /></div>
            <button type="submit" className="btn-primary" style={{ height: '56px', fontSize: '1.1rem' }}>Authorize</button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <nav className="admin-sidebar" style={{ width: 280, borderRadius: 32, padding: '2rem', height: '100%', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '3rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Shield size={20} color="white" /></div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Admin HQ</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
          {[
            { id: 'dashboard', icon: <Activity size={20} />, label: 'Dashboard' },
            { id: 'users', icon: <Users size={20} />, label: 'Users' },
            { id: 'communities', icon: <Layout size={20} />, label: 'Communities' },
            { id: 'support', icon: <MessageSquare size={20} />, label: 'Tickets' },
            { id: 'system', icon: <Mail size={20} />, label: 'Broadcast' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`nav-item ${activeTab === tab.id ? 'active' : ''}`} style={{ width: '100%', justifyContent: 'flex-start', padding: '0 20px', gap: 15 }}>
              {tab.icon} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{tab.label}</span>
            </button>
          ))}
        </div>

        <button onClick={() => setIsAdminLoggedIn(false)} className="btn-primary" style={{ background: 'var(--error)', width: '100%', height: 50 }}><LogOut size={20} /> Logout</button>
      </nav>

      <main className="chat-panel" style={{ padding: '40px', overflowY: 'auto' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: 30 }}>Overview</h2>

              {lastError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', padding: '1rem', borderRadius: '16px', marginBottom: '2rem', color: 'var(--error)', fontSize: '0.9rem' }}>
                  <strong>System Alert:</strong> {lastError}. This usually means you need to update your Firestore Security Rules to allow access to these collections.
                </div>
              )}

              <div style={{ display: 'flex', gap: 20, marginBottom: 40 }}>
                <StatCard icon={<Users size={28} />} title="Users" value={stats.users} color="0, 132, 255" />
                <StatCard icon={<Layout size={28} />} title="Communities" value={stats.groups} color="34, 197, 94" />
                <StatCard icon={<AlertTriangle size={28} />} title="Tickets" value={supportMsgs.length} color="239, 68, 68" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="admin-card">
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15 }}><ShieldCheck size={20} color="var(--primary)" /> Verification</h4>
                  <p style={{ color: 'var(--text-dim)', marginBottom: 20 }}>Review and grant verification status to users.</p>
                  <button onClick={() => setActiveTab('users')} className="btn-primary" style={{ width: '100%' }}>Manage Directory</button>
                </div>
                <div className="admin-card">
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15 }}><Mail size={20} color="var(--primary)" /> Broadcast</h4>
                  <p style={{ color: 'var(--text-dim)', marginBottom: 20 }}>Send announcements to all Sannasa users.</p>
                  <button onClick={() => setActiveTab('system')} className="btn-primary" style={{ width: '100%' }}>Create Message</button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Users</h2>
                <div className="search-bar" style={{ width: 300 }}>
                  <Search size={18} color="var(--text-dim)" />
                  <input type="text" placeholder="Search..." onChange={e => setSearchTerm(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {users.filter(u => (u.username || '').toLowerCase().includes(searchTerm.toLowerCase()) || (u.fullName || '').toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                  <div key={u.id} className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div className="avatar-small" style={{ width: 50, height: 50 }}>
                        {u.photoURL ? <img src={u.photoURL} /> : u.fullName?.[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {u.fullName} {u.isVerified && <img src="/verified.png" style={{ width: 18, height: 18 }} alt="verified" />}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>@{u.username}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className="btn-primary" style={{ height: 40, padding: '0 15px', background: u.isVerified ? 'var(--primary)' : 'rgba(255,255,255,0.05)' }} onClick={() => updateDoc(doc(db, "users", u.id), { isVerified: !u.isVerified })}>{u.isVerified ? 'Verified' : 'Verify'}</button>
                      <button className="btn-primary" style={{ height: 40, padding: '0 15px', background: u.isBanned ? 'var(--error)' : 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }} onClick={() => updateDoc(doc(db, "users", u.id), { isBanned: !u.isBanned })}>{u.isBanned ? 'Banned' : 'Ban'}</button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'support' && (
            <motion.div key="support" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: 30 }}>Tickets</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {supportMsgs.map(msg => <SupportTicket key={msg.id} msg={msg} isVerified={users.find(u => u.id === msg.senderId)?.isVerified} onReply={handleReply} onDelete={(id) => deleteDoc(doc(db, 'support_messages', id))} />)}
                {supportMsgs.length === 0 && <div className="admin-card" style={{ textAlign: 'center', color: 'var(--text-dim)' }}>No open tickets</div>}
              </div>
            </motion.div>
          )}

          {activeTab === 'communities' && (
            <motion.div key="communities" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Communities</h2>
                <div className="search-bar" style={{ width: 300 }}>
                  <Search size={18} color="var(--text-dim)" />
                  <input type="text" placeholder="Search..." onChange={e => setSearchTerm(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                {communities.filter(c => (c.name || '').toLowerCase().includes(searchTerm.toLowerCase())).map(c => (
                  <div key={c.id} className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                    <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                      <div className="avatar-small" style={{ width: 48, height: 48, borderRadius: 12 }}>
                        {c.logo ? <img src={c.logo} /> : c.name?.[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800 }}>{c.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{c.type} • {c.members?.length || 0} members</div>
                      </div>
                    </div>
                    <button className="btn-primary" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', width: '100%', height: 40 }} onClick={() => handleDeleteCommunity(c.id, c.type)}>Delete {c.type}</button>
                  </div>
                ))}
                {communities.length === 0 && <div className="admin-card" style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-dim)' }}>No communities found</div>}
              </div>
            </motion.div>
          )}

          {activeTab === 'system' && (
            <motion.div key="system" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: 30 }}>Broadcast Announcement</h2>
              <div className="admin-card" style={{ maxWidth: 600 }}>
                <p style={{ color: 'var(--text-dim)', marginBottom: 20 }}>This message will be sent to the official Sannasa channel and visible to all users.</p>
                <textarea
                  className="input-modern"
                  placeholder="Type your global announcement here..."
                  value={systemMsg}
                  onChange={e => setSystemMsg(e.target.value)}
                  style={{ width: '100%', height: 150, padding: 20, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: 'white', outline: 'none', marginBottom: 20, resize: 'none' }}
                />
                <button onClick={handleSystemBroadcast} className="btn-primary" style={{ width: '100%', height: 52 }} disabled={!systemMsg.trim()}>
                  <Send size={20} /> Post Announcement
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Admin;
