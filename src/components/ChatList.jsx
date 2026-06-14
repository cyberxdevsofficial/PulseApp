import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, getDocs, limit, doc, updateDoc, arrayUnion, orderBy } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { ChevronRight, Loader2, PlusCircle, Radio } from 'lucide-react';
import { rtdb } from '../services/firebase';
import { ref, onValue } from 'firebase/database';
import { motion, AnimatePresence } from 'framer-motion';

const PresenceBadge = ({ uid }) => {
  const [status, setStatus] = useState('offline');
  useEffect(() => {
    if (!uid) return;
    return onValue(ref(rtdb, `/status/${uid}`), (snap) => {
      setStatus(snap.val()?.state || 'offline');
    });
  }, [uid]);
  if (status === 'online') {
    return <div style={{ position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: '50%', background: 'var(--success)', border: '2px solid #0f172a', zIndex: 10 }} />;
  }
  return null;
};


const Avatar = ({ item, size = 48, radius = 16 }) => {
  const [imgError, setImgError] = useState(false);
  const isPulseApp = item.isSystem || item.isSupport;
  const photoUrl = isPulseApp ? '/logo.png' : (item.photoURL || item.logo);

  useEffect(() => {
    setImgError(false);
  }, [photoUrl]);

  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: isPulseApp ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      fontWeight: 'bold', overflow: 'hidden', position: 'relative',
      border: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
      fontSize: size * 0.4, color: 'white'
    }}>
      {photoUrl && !imgError ? (
        <img
          src={photoUrl}
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <span>{item.name?.[0]?.toUpperCase() || '?'}</span>
      )}
      {item.uid && !item.isSystem && <PresenceBadge uid={item.uid} />}
    </div>
  );
};

const ChatList = ({ type, onSelect, selectedId, searchTerm, isMobile }) => {
  const { user, userData } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null);


  const profileCacheRef = useRef({});
  const profileUnsubsRef = useRef({});

  const convoCacheRef = useRef({});

  const blockedUsersStr = userData?.blockedUsers?.join(',') || '';
  const pinnedChatsStr = userData?.pinnedChats?.join(',') || '';


  const rebuildItems = (systemChats) => {
    const convos = Object.entries(convoCacheRef.current).map(([convoId, meta]) => {
      const profile = profileCacheRef.current[meta.otherUid] || {};
      return {
        id: convoId,
        uid: meta.otherUid,
        name: profile.fullName || 'User',
        photoURL: profile.photoURL || '',
        isVerified: profile.isVerified || false,
        lastMessage: meta.lastMessage || '',
        lastMessageTime: meta.lastMessageTime || { seconds: 0 },
        unreadCount: meta.unreadCount || {},
        isPinned: userData?.pinnedChats?.includes(convoId),
      };
    });
    const allItems = [...systemChats, ...convos];
    allItems.sort((a, b) => {

      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;


      const tA = (a.lastMessageTime?.seconds || 0);
      const tB = (b.lastMessageTime?.seconds || 0);
      return tB - tA;
    });
    setItems(allItems);
  };


  const subscribeProfile = (uid, getSystemChats) => {
    if (profileUnsubsRef.current[uid]) return;
    const unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
      profileCacheRef.current[uid] = snap.exists() ? snap.data() : {};
      rebuildItems(getSystemChats());
    });
    profileUnsubsRef.current[uid] = unsub;
  };

  useEffect(() => {
    if (!user || !userData) { setLoading(false); return; }
    setLoading(true);
    setItems([]);
    convoCacheRef.current = {};


    Object.values(profileUnsubsRef.current).forEach(u => u());
    profileUnsubsRef.current = {};
    profileCacheRef.current = {};

    if (type === 'calls') {
      setItems([]);
      setLoading(false);
      return;
    }

    if (searchTerm && searchTerm.trim().length > 1) {
      handleGlobalSearch();
      return;
    }

    let q;
    if (type === 'chats') {
      q = query(collection(db, 'conversations'), where('participants', 'array-contains', user.uid));
    } else {
      q = query(collection(db, type), where('members', 'array-contains', user.uid));
    }


    const systemChats = [
      { id: 'sannasa_official', name: 'Sannasa Official', username: 'sannasa', bio: 'Platform Updates & Announcements', lastMessage: 'Platform Updates', isVerified: true, isSystem: true, lastMessageTime: { seconds: 0 } },
      { id: 'sannasa_support', name: 'Sannasa Support', username: 'support', bio: 'Official Sannasa Support. We are here to help.', lastMessage: 'Contact Us', isVerified: true, isSupport: true, lastMessageTime: { seconds: 0 } }
    ];
    const getSystemChats = () => systemChats;

    const unsubSystem = onSnapshot(
      query(collection(db, 'conversations'), where('__name__', 'in', [`support_${user.uid}`, 'sannasa_official'])),
      (snap) => {
        snap.docs.forEach(docSnap => {
          const data = docSnap.data();
          const isSupportDoc = docSnap.id === `support_${user.uid}`;
          const targetId = isSupportDoc ? 'sannasa_support' : docSnap.id;
          const idx = systemChats.findIndex(s => s.id === targetId);
          if (idx > -1) {
            systemChats[idx].lastMessage = data.lastMessage || systemChats[idx].lastMessage;
            systemChats[idx].lastMessageTime = data.lastMessageTime || systemChats[idx].lastMessageTime;
            systemChats[idx].unreadCount = data.unreadCount || {};
          }
        });
        rebuildItems(systemChats);
      }, (err) => console.warn("System convo listener failed, falling back to messages", err)
    );

    const unsubOfficialMsg = onSnapshot(
      query(collection(db, 'messages'), where('chatId', '==', 'sannasa_official')),
      (snap) => {
        if (!snap.empty) {
          const msgs = snap.docs.map(d => d.data());
          msgs.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
          const m = msgs[0];
          const idx = systemChats.findIndex(s => s.id === 'sannasa_official');
          if (idx > -1) {
            systemChats[idx].lastMessage = m.text;
            systemChats[idx].lastMessageTime = m.timestamp;
            rebuildItems(systemChats);
          }
        }
      }
    );

    const unsubSupportMsg = onSnapshot(
      query(collection(db, 'messages'), where('chatId', '==', `support_${user.uid}`)),
      (snap) => {
        if (!snap.empty) {
          const msgs = snap.docs.map(d => d.data());
          msgs.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
          const m = msgs[0];
          const idx = systemChats.findIndex(s => s.id === 'sannasa_support');
          if (idx > -1) {
            systemChats[idx].lastMessage = m.text;
            systemChats[idx].lastMessageTime = m.timestamp;
            rebuildItems(systemChats);
          }
        }
      }
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        if (type === 'chats') {
          const activeConvoIds = new Set();
          snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data();
            if (docSnap.id === `support_${user.uid}` || docSnap.id === 'sannasa_support' || docSnap.id === 'sannasa_system' || docSnap.id === 'sannasa_official') return;
            const otherUid = data.participants?.find(p => p !== user.uid);
            if (!otherUid) return;
            if (userData.blockedUsers?.includes(otherUid)) return;

            activeConvoIds.add(docSnap.id);


            convoCacheRef.current[docSnap.id] = {
              otherUid,
              lastMessage: data.lastMessage || '',
              lastMessageTime: data.lastMessageTime || { seconds: 0 },
              unreadCount: data.unreadCount || {},
            };


            subscribeProfile(otherUid, getSystemChats);
          });


          Object.keys(convoCacheRef.current).forEach(id => {
            if (!activeConvoIds.has(id)) delete convoCacheRef.current[id];
          });

          rebuildItems(getSystemChats());
        } else {

          const list = snapshot.docs.map(d => ({
            id: d.id, ...d.data(),
            lastMessageTime: d.data().lastMessageTime || { seconds: 0 },
            unreadCount: d.data().unreadCount || {},
            isPinned: userData.pinnedChats?.includes(d.id),
          }));
          list.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return (b.lastMessageTime?.seconds || 0) - (a.lastMessageTime?.seconds || 0);
          });
          setItems(list);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('ChatList snapshot error:', error);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      unsubSystem();
      unsubOfficialMsg();
      unsubSupportMsg();

      Object.values(profileUnsubsRef.current).forEach(u => u());
      profileUnsubsRef.current = {};
      profileCacheRef.current = {};
      convoCacheRef.current = {};
    };
  }, [type, user?.uid, blockedUsersStr, pinnedChatsStr, searchTerm]);

  const handleGlobalSearch = async () => {
    setLoading(true);
    const term = searchTerm.toLowerCase().replace('@', '');
    try {
      if (type === 'chats') {
        const q = query(collection(db, "users"), where("username", ">=", term), where("username", "<=", term + '\uf8ff'), limit(10));
        const snap = await getDocs(q);
        setItems(snap.docs.map(d => ({
          id: d.id, uid: d.id, name: d.data().fullName, username: d.data().username,
          photoURL: d.data().photoURL, isVerified: d.data().isVerified
        })).filter(u => u.uid !== user.uid));
      } else if (type === 'channels') {

        const q = query(collection(db, 'channels'), where("name", ">=", term), where("name", "<=", term + '\uf8ff'), limit(10));
        const snap = await getDocs(q);
        setItems(snap.docs.map(d => ({
          id: d.id, ...d.data(),
          isNotMember: !d.data().members?.includes(user.uid)
        })));
      } else {

        setItems([]);
      }
    } finally { setLoading(false); }
  };

  const handleFollow = async (c) => {

    try {
      await updateDoc(doc(db, 'channels', c.id), { members: arrayUnion(user.uid) });
      onSelect({ ...c, uid: c.uid || c.id });
    } catch (err) { console.error(err); }
  };

  if (loading && items.length === 0) {
    return <div className="flex-center" style={{ padding: '4rem' }}><Loader2 className="animate-spin" size={32} /></div>;
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {items.map(item => {
          const isNotMember = item.isNotMember;
          const isChannel = type === 'channels';

          return (
            <div
              key={item.id}
              onClick={() => isNotMember && isChannel ? handleFollow(item) : onSelect({ ...item, uid: item.uid || item.id })}
              className="chat-list-item"
              style={{
                padding: isMobile ? '12px 16px' : '0.85rem 1.25rem', cursor: 'pointer', display: 'flex',
                gap: isMobile ? '12px' : '14px', alignItems: 'center',
                background: selectedId === item.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                borderLeft: selectedId === item.id ? '3px solid var(--primary)' : '3px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              <Avatar item={item} size={isMobile ? 44 : 48} radius={(item.isSystem || item.isSupport) ? 50 : (type !== 'chats' ? 12 : 50)} />

              <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                <div style={{ fontWeight: '600', fontSize: isMobile ? '0.9rem' : '0.95rem', display: 'flex', alignItems: 'center', gap: 6, marginBottom: isMobile ? 1 : 3 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                  {item.isVerified && <img src="/verified.png" style={{ width: 14, height: 14, flexShrink: 0 }} alt="verified" />}
                  {item.isSystem && <span style={{ fontSize: '0.5rem', background: 'var(--primary)', padding: '1px 5px', borderRadius: '8px', flexShrink: 0 }}>OFFICIAL</span>}
                </div>
                <div style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {isNotMember
                    ? (isChannel ? 'Tap to follow' : 'Private group')
                    : (item.lastMessage || item.description || item.bio || (item.username ? `@${item.username}` : ''))
                  }
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                {item.lastMessageTime?.seconds > 1 && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 500 }}>
                    {new Date(item.lastMessageTime.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {(() => {
                    const uTime = Math.max(userData?.lastReadOfficial?.seconds || 0, parseInt(localStorage.getItem('lastReadOfficial') || '0'));
                    const mTime = item.lastMessageTime?.seconds || 0;
                    const shouldShowBubble = item.unreadCount?.[user.uid] > 0 || (item.isSystem && mTime > uTime);

                    return shouldShowBubble && (
                      <div className="unread-badge" style={{ minWidth: 18, height: 18, padding: '0 5px', fontSize: '0.65rem' }}>
                        {item.unreadCount?.[user.uid] || '1'}
                      </div>
                    );
                  })()}
                  {isNotMember && isChannel ? (
                    <span style={{ fontSize: '0.7rem', background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                      Follow
                    </span>
                  ) : (
                    !isMobile && <ChevronRight size={16} style={{ opacity: 0.1 }} />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {!loading && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-dim)' }}>
            {type === 'groups'
              ? 'You have no groups yet.\nCreate one or get an invite link from an admin.'
              : searchTerm
                ? 'No results found'
                : `No ${type} yet`
            }
          </div>
        )}
      </div>

      {/* Premium Custom Dialog */}
      <AnimatePresence>
        {dialog && (
          <div className="dialog-overlay" onClick={() => setDialog(null)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="dialog-content"
              onClick={e => e.stopPropagation()}
            >
              <div className="dialog-title">{dialog.title}</div>
              <div className="dialog-message">{dialog.message}</div>
              <div className="dialog-actions">
                <button className="btn-primary" style={{ padding: '12px 28px', borderRadius: 20 }} onClick={() => setDialog(null)}>OK</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatList;
