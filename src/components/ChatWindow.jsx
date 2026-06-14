import React, { useState, useEffect, useRef } from 'react';
import { db, rtdb } from '../services/firebase';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, updateDoc, setDoc, getDoc, getDocs, arrayUnion, arrayRemove, deleteDoc, increment, writeBatch, deleteField, limit } from 'firebase/firestore';
import { ref as rRef, set as setRtdb, update as updateRtdb, push as pushRtdb } from 'firebase/database';
import { useAuth } from '../hooks/useAuth';
import { uploadToGithub } from '../services/githubStorage';
import { Send, Paperclip, X, MoreVertical, Plus, Mic, MicOff, Image as ImageIcon, Video, VideoOff, FileText, Loader2, Download, User, Users, Shield, Clock, File as FileIcon, Play, Pause, Square, PhoneMissed, PhoneCall, Phone, Reply, CornerUpLeft, Info, CheckCheck, RotateCw, Smile, Type as TypeIcon, Pencil, History, Crop, ChevronLeft, ChevronRight, Trash2, Ban, Eraser, Info as InfoIcon, Search, BellOff, Lock, XCircle, Flag, UserPlus, Link, LogOut, ShieldAlert, List, MinusCircle, ChevronDown, Minus, Eye, EyeOff, SmilePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VideoCallModal from './VideoCallModal';
import StickerPicker from './StickerPicker';

const VoicePlayer = ({ url }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);
  const [errorDetail, setErrorDetail] = useState('');

  useEffect(() => {
    console.log("VoicePlayer initialized with URL:", url);
  }, [url]);

  const toggle = (e) => {
    e.stopPropagation();
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.pause();
    else a.play().catch(err => setError(true));
    setPlaying(!playing);
  };

  const seek = (e) => {
    e.stopPropagation();
    const a = audioRef.current;
    if (!a || !duration || !isFinite(duration)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    a.currentTime = ratio * duration;
  };

  const fmt = (s) => {
    if (!s || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = (duration > 0 && isFinite(duration)) ? (current / duration) * 100 : 0;
  const bars = [4, 8, 12, 16, 10, 6, 14, 9, 5, 11];

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 14px', borderRadius: 14, background: 'rgba(255,0,0,0.1)', opacity: 0.8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <MicOff size={14} color="#ef4444" />
        <span style={{ fontSize: '0.8rem', color: '#ef4444' }}>Voice note error</span>
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.7rem', color: 'var(--primary)', textDecoration: 'underline' }}>Try direct link</a>
      </div>
      {errorDetail && <div style={{ fontSize: '0.65rem', color: '#ef4444', opacity: 0.8, wordBreak: 'break-all', marginTop: 4 }}>{errorDetail}</div>}
    </div>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: 20, minWidth: 260, maxWidth: 320, border: '1px solid rgba(255,255,255,0.08)' }}>
      <audio
        ref={audioRef}
        src={url}
        preload="auto"
        onTimeUpdate={() => setCurrent(audioRef.current.currentTime)}
        onLoadedMetadata={() => setDuration(audioRef.current.duration)}
        onEnded={() => setPlaying(false)}
        onError={(e) => {
          const err = e.target.error;
          let msg = "Unknown error";
          if (err) {
            if (err.code === 1) msg = "Aborted";
            else if (err.code === 2) msg = "Network error";
            else if (err.code === 3) msg = "Decoding error";
            else if (err.code === 4) msg = "Source not supported";
          }
          console.error("Audio Load Error:", msg, "URL:", url);
          setErrorDetail(`${msg} (Size/Format issue)`);
          setError(true);
        }}
      />

      <button
        onClick={toggle}
        style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: 'white', boxShadow: '0 4px 15px var(--primary-glow)' }}
      >
        {playing ? <Pause size={20} fill="white" /> : <Play size={20} style={{ marginLeft: 2 }} fill="white" />}
      </button>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 20 }}>
          {bars.map((h, i) => (
            <motion.div
              key={i}
              animate={playing ? { height: [h, h * 1.6, h] } : { height: h }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.05 }}
              style={{ width: 3, borderRadius: 1, background: progress > (i / bars.length) * 100 ? 'var(--primary)' : 'rgba(255,255,255,0.2)' }}
            />
          ))}
        </div>

        <div
          onClick={seek}
          style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, cursor: 'pointer' }}
        >
          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--primary)', borderRadius: 2 }} />
        </div>
      </div>

      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, width: 35, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {fmt(playing || current > 0 ? current : duration)}
      </div>
    </div>
  );
};


const ChatWindow = ({ item, type, isMaximized, onToggleMaximize, onClose, onCreateNew, isMobile }) => {
  const { user, userData } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSecs, setRecordingSecs] = useState(0);
  const [loadingMessages, setLoadingMessages] = useState(true);


  const [showVideoCall, setShowVideoCall] = useState(false);
  const [activeCallId, setActiveCallId] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [otherUserStatus, setOtherUserStatus] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [messageInfo, setMessageInfo] = useState(null);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [showEditor, setShowEditor] = useState(false);
  const [isViewOnce, setIsViewOnce] = useState(false);
  const [captions, setCaptions] = useState({});
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showStickers, setShowStickers] = useState(false);

  const handleSendSticker = async (url) => {
    try {
      const cid = getChatId();
      await addDoc(collection(db, 'messages'), {
        chatId: cid,
        senderId: user.uid,
        senderName: userData?.fullName || 'User',
        text: '',
        type: 'sticker',
        fileUrl: url,
        timestamp: serverTimestamp(),
        isViewOnce: false
      });
      setShowStickers(false);
    } catch (err) { console.error(err); }
  };
  const [isSearchingInChat, setIsSearchingInChat] = useState(false);
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberContextMenu, setMemberContextMenu] = useState(null);
  const [mediaList, setMediaList] = useState([]);
  const [msgContextMenu, setMsgContextMenu] = useState(null);
  const [emojiPicker, setEmojiPicker] = useState(null);
  const [viewedOnce, setViewedOnce] = useState({});
  const [ownerName, setOwnerName] = useState('');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [liveItem, setLiveItem] = useState(item);

  useEffect(() => {
    setLiveItem(item);
  }, [item]);


  const scrollRef = useRef();
  const fileRef = useRef();

  useEffect(() => {
    if (showInfo && liveItem.ownerId) {
      getDoc(doc(db, 'users', liveItem.ownerId)).then(s => {
        if (s.exists()) setOwnerName(s.data().fullName);
      });
    }
  }, [showInfo, liveItem.ownerId]);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const cancelRecordingRef = useRef(false);
  const recordingTimerRef = useRef(null);
  const recordingSecsRef = useRef(0);

  const getChatId = () => {
    if (!item) return null;
    if (item.isSupport) return `support_${user.uid}`;
    if (type === 'chats' && item.uid) return item.id;
    if (item.id && item.id.includes('_')) return item.id;
    if (type === 'chats' && !item.isSystem && !item.isSupport) {
      const oUid = item.uid || item.id;
      return [user.uid, oUid].sort().join('_');
    }
    return item.id;
  };

  const chatId = getChatId();
  const otherUid = type === 'chats' ? (item?.uid || (item?.participants?.find(p => p !== user.uid)) || item?.id) : null;
  const isBlocked = userData?.blockedUsers?.includes(otherUid);
  const isBlockingMe = otherUserStatus?.blockedUsers?.includes(user.uid);

  useEffect(() => {
    if (!chatId) return;
    setMessages([]);
    setLoadingMessages(true);
    const q = query(collection(db, 'messages'), where('chatId', '==', chatId));
    const unsub = onSnapshot(q, (snap) => {
      let msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      msgs.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
      setMessages(msgs);
      setLoadingMessages(false);


      msgs.forEach(m => {
        if (m.senderId !== user.uid && (!m.readBy || !m.readBy.includes(user.uid))) {
          updateDoc(doc(db, 'messages', m.id), {
            readBy: arrayUnion(user.uid),
            [`readAt.${user.uid}`]: serverTimestamp()
          }).catch(() => { });
        }
      });

      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, (err) => { setLoadingMessages(false); });


    const resetUnread = async () => {
      const col = (type === 'chats') ? 'conversations' : type;

      if (chatId === 'sannasa_official') {
        const nowSeconds = Math.floor(Date.now() / 1000);
        localStorage.setItem('lastReadOfficial', nowSeconds.toString());
        if (userData) {
          setUserData(prev => ({ ...prev, lastReadOfficial: { seconds: nowSeconds } }));
        }
        await updateDoc(doc(db, 'users', user.uid), {
          lastReadOfficial: serverTimestamp()
        }).catch(() => { });
      }

      try {
        await updateDoc(doc(db, col, chatId), {
          [`unreadCount.${user.uid}`]: 0
        });
      } catch (err) {
        console.warn('Failed to reset unread count on conversation doc:', err);
      }
    };
    resetUnread();

    return () => unsub();
  }, [chatId]);


  useEffect(() => {
    if (!chatId || type === 'chats' || item.isSystem || item.isSupport) return;
    const unsub = onSnapshot(doc(db, type, chatId), (snap) => {
      if (snap.exists()) setLiveItem({ ...item, ...snap.data() });
    });
    return () => unsub();
  }, [chatId, type]);

  useEffect(() => {
    if (showInfo && type !== 'chats' && liveItem.members) {
      setLoadingMembers(true);
      const fetchMembers = async () => {
        try {
          const mems = [];
          for (const mid of liveItem.members) {
            const uSnap = await getDoc(doc(db, 'users', mid));
            if (uSnap.exists()) mems.push({ id: mid, ...uSnap.data() });
          }
          setGroupMembers(mems);
        } catch (err) { console.error(err); }
        finally { setLoadingMembers(false); }
      };
      fetchMembers();
    }
  }, [showInfo, liveItem.members, type]);

  useEffect(() => {
    const list = messages.filter(m => m.type === 'image' || m.type === 'video').slice(-8);
    setMediaList(list);
  }, [messages]);

  const isAdmin = type !== 'chats' && (liveItem.admins?.includes(user.uid) || liveItem.ownerId === user.uid);
  const isOwner = type !== 'chats' && liveItem.ownerId === user.uid;

  const handlePromote = async (uid) => {
    if (!isAdmin) return setConfirmConfig({ title: 'Admin Required', message: 'Only admins can promote others', hideCancel: true, onConfirm: () => setConfirmConfig(null) });
    const coll = type === 'chats' ? 'conversations' : type;
    await updateDoc(doc(db, coll, chatId), {
      admins: arrayUnion(uid)
    });
    alert('Member promoted to Admin');
    setMemberContextMenu(null);
  };

  const handleDismissAdmin = async (uid) => {
    if (!isAdmin) return setConfirmConfig({ title: 'Admin Required', message: 'Only admins can dismiss others', hideCancel: true, onConfirm: () => setConfirmConfig(null) });
    if (uid === liveItem.ownerId) return setConfirmConfig({ title: 'Error', message: 'You cannot dismiss the group creator', hideCancel: true, onConfirm: () => setConfirmConfig(null) });
    try {
      const coll = type === 'chats' ? 'conversations' : type;
      await updateDoc(doc(db, coll, chatId), {
        admins: arrayRemove(uid)
      });
      setMemberContextMenu(null);
      alert('Admin dismissed');
    } catch (err) { console.error(err); }
  };

  const handleKickMember = async (uid) => {
    if (!isAdmin) return setConfirmConfig({ title: 'Admin Required', message: 'Only admins can kick members', hideCancel: true, onConfirm: () => setConfirmConfig(null) });
    if (uid === user.uid) return setConfirmConfig({ title: 'Error', message: 'You cannot kick yourself', hideCancel: true, onConfirm: () => setConfirmConfig(null) });
    if (uid === liveItem.ownerId) return setConfirmConfig({ title: 'Error', message: 'You cannot kick the group creator', hideCancel: true, onConfirm: () => setConfirmConfig(null) });
    setConfirmConfig({
      title: 'Kick Member',
      message: 'Kick this member permanently? They will not be able to join back via link.',
      confirmText: 'Kick',
      onConfirm: async () => {
        setConfirmConfig(null);
        try {
          await updateDoc(doc(db, type, item.id), {
            members: arrayRemove(uid),
            admins: arrayRemove(uid),
            bannedUsers: arrayUnion(uid)
          });
          setConfirmConfig({ title: 'Success', message: 'Member kicked permanently', hideCancel: true, onConfirm: () => setConfirmConfig(null) });
        } catch (err) {
          setConfirmConfig({ title: 'Error', message: 'Failed to kick member', hideCancel: true, onConfirm: () => setConfirmConfig(null) });
        }
      }
    });
    return;

    try {
      const coll = type === 'chats' ? 'conversations' : type;
      await updateDoc(doc(db, coll, chatId), {
        members: arrayRemove(uid),
        admins: arrayRemove(uid),
        bannedUsers: arrayUnion(uid)
      });
      setMemberContextMenu(null);
      alert('Member kicked permanently');
    } catch (err) { console.error(err); }
  };

  const handleRemoveMember = async (uid) => {
    if (!isAdmin) return setConfirmConfig({ title: 'Admin Required', message: 'Only admins can remove members', hideCancel: true, onConfirm: () => setConfirmConfig(null) });
    if (uid === user.uid) return setConfirmConfig({ title: 'Error', message: 'You cannot remove yourself', hideCancel: true, onConfirm: () => setConfirmConfig(null) });
    setConfirmConfig({
      title: 'Remove Member',
      message: 'Remove this member from the group?',
      confirmText: 'Remove',
      onConfirm: async () => {
        setConfirmConfig(null);
        try {
          await updateDoc(doc(db, type, item.id), {
            members: arrayRemove(uid),
            admins: arrayRemove(uid)
          });
          setConfirmConfig({ title: 'Success', message: 'Member removed', hideCancel: true, onConfirm: () => setConfirmConfig(null) });
        } catch (err) {
          setConfirmConfig({ title: 'Error', message: 'Failed to remove member', hideCancel: true, onConfirm: () => setConfirmConfig(null) });
        }
      }
    });
    return;
    const coll = type === 'chats' ? 'conversations' : type;
    await updateDoc(doc(db, coll, chatId), {
      members: arrayRemove(uid),
      admins: arrayRemove(uid)
    });
    alert('Member removed');
    setMemberContextMenu(null);
  };

  const handleExitGroup = async () => {
    setConfirmConfig({
      title: type === 'channels' ? 'Unfollow Channel' : 'Exit Group',
      message: type === 'channels' ? 'Are you sure you want to unfollow this channel?' : 'Are you sure you want to exit this group?',
      confirmText: type === 'channels' ? 'Unfollow' : 'Exit',
      onConfirm: async () => {
        setConfirmConfig(null);
        try {
          await updateDoc(doc(db, type, item.id), {
            members: arrayRemove(user.uid),
            admins: arrayRemove(user.uid)
          });
          onClose();
        } catch (err) {
          setConfirmConfig({ title: 'Error', message: 'Failed to exit group', hideCancel: true, onConfirm: () => setConfirmConfig(null) });
        }
      }
    });
    return;
    const coll = type === 'chats' ? 'conversations' : type;
    await updateDoc(doc(db, coll, chatId), {
      members: arrayRemove(user.uid),
      admins: arrayRemove(user.uid)
    });
    onClose();
  };

  const handleDeleteMessage = async (msgId, forEveryone = false) => {
    try {
      if (forEveryone) {
        await updateDoc(doc(db, 'messages', msgId), {
          isDeleted: true,
          text: 'This message was deleted',
          type: 'text',
          fileUrl: deleteField(),
          replyToId: deleteField()
        });
      } else {
        await updateDoc(doc(db, 'messages', msgId), {
          deletedFor: arrayUnion(user.uid)
        });
      }
      setMsgContextMenu(null);
    } catch (err) { console.error(err); }
  };

  const handleAddMember = async (targetUser) => {
    try {
      const coll = type === 'chats' ? 'conversations' : type;
      await updateDoc(doc(db, coll, chatId), {
        members: arrayUnion(targetUser.id)
      });
      alert(`${targetUser.fullName} added to group`);
      setShowAddMemberModal(false);
    } catch (err) { alert('Error adding member'); }
  };

  const handleUpdateGroupPhoto = async (file) => {
    if (!isAdmin) return;
    try {
      setIsUploading(true);
      const url = await uploadToGithub(file);
      const coll = type === 'chats' ? 'conversations' : type;
      await updateDoc(doc(db, coll, chatId), {
        photoURL: url,
        logo: url
      });
      alert('Group photo updated');
    } catch (err) {
      console.error("Upload error:", err);
      alert('Upload failed: ' + err.message);
    }
    finally { setIsUploading(false); }
  };

  const handleUpdateGroupName = async () => {
    if (!isAdmin) return;
    const newName = prompt('Enter new community name:', liveItem.name);
    if (newName && newName !== liveItem.name) {
      const coll = type === 'chats' ? 'conversations' : type;
      await updateDoc(doc(db, coll, chatId), { name: newName });
    }
  };

  const handleUpdateGroupDesc = async () => {
    if (!isAdmin) return;
    const newDesc = prompt('Enter new description:', liveItem.description || '');
    if (newDesc !== null && newDesc !== liveItem.description) {
      const coll = type === 'chats' ? 'conversations' : type;
      await updateDoc(doc(db, coll, chatId), { description: newDesc });
    }
  };

  useEffect(() => {
    if (showAddMemberModal) {
      const q = query(collection(db, 'users'), limit(50));
      getDocs(q).then(snap => {
        setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.id !== user.uid));
      });
    }
  }, [showAddMemberModal]);

  const handleDirectMessage = async (member) => {
    setMemberContextMenu(null);
    setShowInfo(false);
    onSelect({
      id: member.id,
      uid: member.id,
      name: member.fullName,
      photoURL: member.photoURL,
      isVerified: member.isVerified
    }, 'chats');
  };

  const handleReport = async () => {
    if (window.confirm(`Report this ${type === 'channels' ? 'channel' : 'group'} for inappropriate content?`)) {
      try {
        await addDoc(collection(db, 'reports'), {
          reportedBy: user.uid,
          chatId: chatId,
          type: type,
          timestamp: serverTimestamp()
        });
        alert('Report submitted. Thank you for keeping Sannasa safe.');
      } catch (err) { alert('Report failed'); }
    }
  };

  const handleClearChat = async () => {
    if (window.confirm('Clear all messages in this chat?')) {
      try {
        const q = query(collection(db, 'messages'), where('chatId', '==', chatId));
        const snaps = await getDocs(q);
        const batch = writeBatch(db);
        snaps.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        const coll = type === 'chats' ? 'conversations' : type;
        await updateDoc(doc(db, coll, chatId), { lastMessage: '', lastMessageTime: serverTimestamp() });
        alert('Chat cleared');
      } catch (err) { alert('Clear failed'); }
    }
  };

  const formatMessageDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const copyInviteLink = () => {
    const link = `https://sannasa.udmodz.site/join/${type}/${chatId}`;
    navigator.clipboard.writeText(link);
    navigator.clipboard.writeText(link);
    setConfirmConfig({ title: 'Link Copied', message: 'The invite link has been copied to your clipboard.', hideCancel: true, onConfirm: () => setConfirmConfig(null) });
  };

  useEffect(() => {
    if (type === 'chats' && item && !item.isSystem && !item.isSupport) {
      const otherUid = item.uid || item.id;
      const unsub = onSnapshot(doc(db, 'users', otherUid), (snap) => {
        if (snap.exists()) {
          setOtherUserStatus(snap.data());
        }
      });
      return () => unsub();
    } else {
      setOtherUserStatus(null);
    }
  }, [item, type]);

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Offline';
    const date = timestamp.toDate();
    const now = new Date();
    const diff = (now - date) / 1000;

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const handleStartCall = async () => {
    try {
      const otherUid = item.uid || item.id;
      const callId = Date.now().toString();
      const callPath = `calls/${callId}`;

      const callData = {
        callerId: user.uid,
        callerName: userData?.fullName || 'User',
        callerPhoto: userData?.photoURL || '',
        receiverId: otherUid,
        chatId: chatId,
        status: 'ringing',
        timestamp: Date.now()
      };


      await setRtdb(rRef(rtdb, callPath), callData);


      await setRtdb(rRef(rtdb, `incoming_calls/${otherUid}/${callId}`), callData);

      setActiveCallId(callId);
      setShowVideoCall(true);


      await addDoc(collection(db, 'messages'), {
        chatId, senderId: user.uid, senderName: userData.fullName || 'User',
        type: 'call_log', text: 'Outgoing video call', missed: false, timestamp: serverTimestamp(), callId: callId
      });
    } catch (err) {
      console.error("Call Error:", err);
      setConfirmConfig({ title: 'Call Error', message: `Could not start call: ${err.message}`, hideCancel: true, onConfirm: () => setConfirmConfig(null) });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/mp4'
      ];
      const mimeType = mimeTypes.find(t => MediaRecorder.isTypeSupported(t)) || '';
      const ext = mimeType.startsWith('audio/ogg') ? 'ogg'
        : mimeType.startsWith('audio/mp4') ? 'mp4'
          : 'webm';

      mediaRecorder.current = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      audioChunks.current = [];
      cancelRecordingRef.current = false;


      setRecordingSecs(0);
      recordingSecsRef.current = 0;
      recordingTimerRef.current = setInterval(() => {
        setRecordingSecs(s => s + 1);
        recordingSecsRef.current += 1;
      }, 1000);

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = async () => {
        try {
          clearInterval(recordingTimerRef.current);
          const duration = recordingSecsRef.current;
          setRecordingSecs(0);
          recordingSecsRef.current = 0;

          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }

          setIsRecording(false);

          if (cancelRecordingRef.current) return;

          const rawMime = mediaRecorder.current?.mimeType || mimeType || 'audio/webm';
          const actualMime = rawMime.split(';')[0];
          const audioBlob = new Blob(audioChunks.current, { type: actualMime });

          if (audioBlob.size < 1000) {
            alert("Voice note was too short or empty.");
            return;
          }

          const file = new window.File([audioBlob], `voice_${Date.now()}.${ext}`, { type: actualMime });

          setIsUploading(true);
          let voiceUrl = null;
          try {
            voiceUrl = await uploadToGithub(file);
            console.log("Voice uploaded successfully. URL:", voiceUrl);
          } catch (err) {
            console.error('Voice upload failed:', err);
            alert("Voice upload failed: " + err.message);
            return;
          } finally {
            setIsUploading(false);
          }

          try {
            await handleSend(null, {
              type: 'voice',
              fileUrl: voiceUrl,
              text: '🎙 Voice message',
              duration: duration
            });
          } catch (err) {
            console.error('Voice send failed:', err);
          }
        } catch (globalErr) {
          console.error("Voice Global Error in onstop:", globalErr);
        }
      };

      mediaRecorder.current.start(250);
      setIsRecording(true);
    } catch (err) {
      console.error('Recording error:', err);
      if (err.name === 'NotAllowedError') alert('Microphone access denied. Please allow microphone access in your browser settings.');
      else alert('Could not start recording: ' + err.message);
    }
  };

  const stopRecording = () => {
    cancelRecordingRef.current = false;
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    } else {
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    cancelRecordingRef.current = true;
    clearInterval(recordingTimerRef.current);
    setRecordingSecs(0);
    recordingSecsRef.current = 0;
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    } else {
      setIsRecording(false);
    }
  };

  const handleSend = async (e, customData = null) => {
    if (e) e.preventDefault();
    const text = customData ? '' : newMessage.trim();

    if (!text && !customData || !chatId || isSending || !userData) return;

    setIsSending(true);
    if (!customData) setNewMessage('');

    try {
      const payload = customData || { type: 'text', text };
      if (replyingTo) {
        payload.replyToId = replyingTo.id;
        payload.replyToText = replyingTo.text || `Sent a ${replyingTo.type}`;
        payload.replyToSender = replyingTo.senderName;
      }

      const msgRef = await addDoc(collection(db, 'messages'), {
        chatId,
        senderId: user.uid,
        senderName: userData?.fullName || 'User',
        ...payload,
        timestamp: serverTimestamp(),
        readBy: [user.uid],
        readAt: { [user.uid]: serverTimestamp() }
      });

      if (item.isSupport && user.uid !== 'admin') {
        await addDoc(collection(db, 'support_messages'), {
          originalMsgId: msgRef.id,
          senderId: user.uid,
          senderName: userData?.fullName || 'User',
          text: payload.text || `Sent a ${payload.type}`,
          timestamp: serverTimestamp()
        });
      }
      setReplyingTo(null);

      const col = (type === 'chats') ? 'conversations' : type;
      const metaUpdate = { lastMessage: payload.text || `Sent a ${payload.type}`, lastMessageTime: serverTimestamp() };

      const dRef = doc(db, col, chatId);
      if (type === 'chats' && !item.isSystem && !item.isSupport) {
        const otherUid = item.uid || item.id;
        await updateDoc(dRef, {
          ...metaUpdate,
          [`unreadCount.${otherUid}`]: increment(1),
          participants: [user.uid, otherUid]
        }).catch(async (err) => {
          if (err.code === 'not-found') {
            await setDoc(dRef, {
              ...metaUpdate,
              participants: [user.uid, otherUid],
              unreadCount: { [otherUid]: 1 }
            });
          }
        });
      } else {
        const dSnap = await getDoc(dRef);
        if (item.members) {
          item.members.forEach(mId => {
            if (mId !== user.uid) metaUpdate[`unreadCount.${mId}`] = increment(1);
          });
        } else if (item.isSupport || item.isSystem) {
          if (user.uid !== 'admin') metaUpdate[`unreadCount.admin`] = increment(1);
          else {
            const targetUid = payload.text?.match(/@([a-zA-Z0-0-_]+):/)?.[1];
            if (targetUid) metaUpdate[`unreadCount.${targetUid}`] = increment(1);
          }
        }

        if (dSnap.exists()) await updateDoc(dRef, metaUpdate);
        else await setDoc(dRef, { ...metaUpdate, participants: [user.uid] });
      }
      console.log("handleSend: successfully sent message");
    } catch (err) {
      console.error("handleSend error:", err);
      alert("Failed to send message: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const QUICK_EMOJIS = ['❤️', '💙', '😂', '😮', '😢', '👍', '🔥', '🎉', '😡'];

  const handleReaction = async (msgId, emoji) => {
    setEmojiPicker(null);
    const msgRef = doc(db, 'messages', msgId);
    const snap = await getDoc(msgRef);
    if (!snap.exists()) return;
    const reactions = snap.data().reactions || {};
    const key = `${emoji}`;
    const voters = reactions[key] || [];
    const alreadyReacted = voters.includes(user.uid);
    await updateDoc(msgRef, {
      [`reactions.${key}`]: alreadyReacted ? arrayRemove(user.uid) : arrayUnion(user.uid)
    });
  };

  const handleViewOnce = async (msg) => {
    setViewedOnce(prev => ({ ...prev, [msg.id]: true }));
    setFullScreenImage(msg);
    setZoom(1);

    await updateDoc(doc(db, 'messages', msg.id), {
      viewedBy: arrayUnion(user.uid)
    }).catch(() => { });
  };

  const downloadFile = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) { window.open(url, '_blank'); }
  };

  if (!item) return null;

  return (
    <>
      <div style={{ display: 'flex', height: '100%', position: 'relative' }}>
        <AnimatePresence>
          {showVideoCall && <VideoCallModal caller={liveItem} callId={activeCallId} isReceiving={false} onClose={() => { setShowVideoCall(false); setActiveCallId(null); }} />}
        </AnimatePresence>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <header className="glass" style={{ height: isMobile ? 60 : 75, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0 12px' : '0 2rem', zIndex: 10, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 14, cursor: 'pointer', flex: 1, overflow: 'hidden' }} onClick={() => setShowInfo(true)}>
              {isMobile && (
                <button onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ background: 'transparent', border: 'none', color: 'white', padding: '8px 4px' }}>
                  <ChevronLeft size={26} />
                </button>
              )}
              <div style={{ width: isMobile ? 38 : 46, height: isMobile ? 38 : 46, borderRadius: isMobile ? 19 : 15, background: 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', overflow: 'hidden', flexShrink: 0 }}>
                {(() => {
                  const isSannasa = liveItem.isSystem || liveItem.isSupport;
                  const photoUrl = isSannasa ? '/logo.png' : ((type === 'chats' ? otherUserStatus?.photoURL : null) || liveItem.photoURL || liveItem.logo);
                  if (photoUrl) {
                    return (
                      <img
                        key={photoUrl}
                        src={photoUrl}
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        onLoad={(e) => { e.target.style.display = 'block'; e.target.nextSibling.style.display = 'none'; }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    );
                  }
                  return null;
                })()}
                <div style={{ display: (liveItem.isSystem || liveItem.isSupport || (type === 'chats' ? otherUserStatus?.photoURL : null) || liveItem.photoURL || liveItem.logo) ? 'none' : 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  {(type === 'chats' ? otherUserStatus?.fullName : liveItem.name)?.[0]}
                </div>
              </div>
              {!isSearchingInChat && (
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: isMobile ? '0.95rem' : '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {type === 'chats' ? (otherUserStatus?.fullName || liveItem.name) : liveItem.name}
                    {liveItem.isSystem && <span style={{ fontSize: '0.55rem', background: 'var(--primary)', padding: '2px 6px', borderRadius: '8px', flexShrink: 0 }}>OFFICIAL</span>}
                    {(otherUserStatus?.isVerified || liveItem.isVerified) && <img src="/verified.png" style={{ width: 14, height: 14, flexShrink: 0 }} alt="verified" />}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {loadingMessages ? 'syncing...' : (
                      type === 'chats' && !liveItem.isSystem && !liveItem.isSupport ? (
                        otherUserStatus?.isOnline ? (
                          <><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} /> Online</>
                        ) : `last seen ${formatLastSeen(otherUserStatus?.lastSeen)}`
                      ) : (<span>{liveItem.members?.length || 0} {type === 'channels' ? 'followers' : 'members'}</span>)
                    )}
                  </div>
                </div>
              )}
            </div>
            {isSearchingInChat && (
              <div className="glass-card" style={{ flex: 2, display: 'flex', alignItems: 'center', padding: '4px 12px', gap: 8, margin: isMobile ? '0 10px' : '0 20px' }}>
                <Search size={16} opacity={0.5} />
                <input
                  autoFocus
                  className="input-modern"
                  value={chatSearchTerm}
                  onChange={e => setChatSearchTerm(e.target.value)}
                  placeholder="Search..."
                  style={{ background: 'transparent', border: 'none', fontSize: '0.9rem' }}
                />
                <X size={16} style={{ cursor: 'pointer' }} onClick={() => { setIsSearchingInChat(false); setChatSearchTerm(''); }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: isMobile ? '4px' : '0.75rem' }}>
              {!isSearchingInChat && (
                <button onClick={() => setIsSearchingInChat(true)} style={{ background: 'transparent', border: 'none', color: 'white', padding: 8, cursor: 'pointer' }}>
                  <Search size={20} />
                </button>
              )}
              {type === 'chats' && !item.isSystem && !item.isSupport && (
                <button onClick={handleStartCall} style={{ background: 'transparent', border: 'none', color: 'white', padding: 8, cursor: 'pointer' }}>
                  <Video size={22} />
                </button>
              )}
              <button onClick={() => setShowChatMenu(!showChatMenu)} style={{ background: 'transparent', border: 'none', color: 'white', padding: 8, cursor: 'pointer' }}><MoreVertical size={20} /></button>
            </div>
          </header>

          <div className="hide-scrollbar chat-messages-container" style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '12px' : '2rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {messages.filter(m => !chatSearchTerm || m.text?.toLowerCase().includes(chatSearchTerm.toLowerCase())).map((msg, idx) => {
              const prevMsg = messages[idx - 1];
              const showDate = !prevMsg || formatMessageDate(msg.timestamp) !== formatMessageDate(prevMsg.timestamp);
              const isDeletedForMe = msg.deletedFor?.includes(user.uid);
              if (isDeletedForMe) return null;

              const isMine = msg.senderId === user.uid;
              const isSameSenderAsPrev = prevMsg && prevMsg.senderId === msg.senderId && !showDate;

              return (
                <React.Fragment key={msg.id || idx}>
                  {showDate && (
                    <div style={{ alignSelf: 'center', margin: '12px 0', background: 'rgba(0,0,0,0.2)', padding: '4px 14px', borderRadius: 20, fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600, backdropFilter: 'blur(10px)' }}>
                      {formatMessageDate(msg.timestamp)}
                    </div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={(e) => setMsgContextMenu({ target: e.currentTarget, msg })}
                    style={{
                      alignSelf: type === 'channels' ? 'center' : (isMine ? 'flex-end' : 'flex-start'),
                      maxWidth: type === 'channels' ? '90%' : (isMobile ? '85%' : '75%'),
                      position: 'relative',
                      cursor: 'pointer',
                      textAlign: type === 'channels' ? 'center' : 'left',
                      marginTop: isSameSenderAsPrev ? '2px' : '8px'
                    }}
                  >
                    <div
                      className="message-bubble"
                      style={{
                        background: msg.type === 'sticker' ? 'transparent' : (isMine ? 'rgba(0, 132, 255, 0.55)' : 'rgba(255,255,255,0.08)'),
                        backdropFilter: msg.type === 'sticker' ? 'none' : 'blur(20px)',
                        borderRadius: isMine
                          ? (isSameSenderAsPrev ? '18px 4px 18px 18px' : '18px 18px 4px 18px')
                          : (isSameSenderAsPrev ? '4px 18px 18px 18px' : '18px 18px 18px 4px'),
                        padding: msg.type === 'sticker' ? 0 : '8px 12px',
                        border: msg.type === 'sticker' ? 'none' : '1px solid rgba(255,255,255,0.05)',
                        position: 'relative',
                        opacity: msg.isDeleted ? 0.6 : 1,
                        boxShadow: msg.type === 'sticker' ? 'none' : '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    >
                      {type !== 'chats' && !isMine && !isSameSenderAsPrev && (
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>{msg.senderName}</div>
                      )}

                      {(msg.replyToId || msg.replyToText) && !msg.isDeleted && (
                        <div style={{ background: 'rgba(0,0,0,0.15)', padding: '6px 10px', borderRadius: '8px', borderLeft: '3px solid var(--primary)', marginBottom: '6px', fontSize: '0.75rem', opacity: 0.9 }}>
                          <div style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '0.7rem', marginBottom: 1 }}>{msg.replyToSender || 'User'}</div>
                          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.replyToText || 'Original message'}</div>
                        </div>
                      )}

                      {msg.isDeleted ? (
                        <div style={{ fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 6, opacity: 0.7, fontSize: '0.9rem' }}>
                          <Ban size={14} /> {isMine ? 'You deleted this message' : 'This message was deleted'}
                        </div>
                      ) : (
                        <>
                          {msg.type === 'image' && (
                            <div
                              style={{ width: isMobile ? '240px' : '300px', height: isMobile ? '180px' : '220px', borderRadius: 12, overflow: 'hidden', marginBottom: 4, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)' }}
                              onClick={(e) => { e.stopPropagation(); setFullScreenImage(msg); setZoom(1); }}
                            >
                              <img src={msg.fileUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          )}
                          {msg.type === 'video' && (
                            <div style={{ width: isMobile ? '240px' : '300px', height: isMobile ? '180px' : '220px', borderRadius: 12, overflow: 'hidden', marginBottom: 4, cursor: 'pointer', position: 'relative', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)' }} onClick={(e) => { e.stopPropagation(); setFullScreenImage(msg); setZoom(1); }}>
                              <video src={msg.fileUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} preload="metadata" />
                              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
                                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Play size={24} fill="white" color="white" /></div>
                              </div>
                            </div>
                          )}
                          {(msg.type === 'view_once_image' || msg.type === 'view_once_video') && (
                            (!viewedOnce[msg.id] && !msg.viewedBy?.includes(user.uid) && msg.senderId !== user.uid) ? (
                              <div onClick={(e) => { e.stopPropagation(); handleViewOnce(msg); }} style={{ width: 220, height: 120, borderRadius: 12, background: 'linear-gradient(135deg,rgba(0,132,255,0.1),rgba(120,80,255,0.1))', border: '1px dashed rgba(0,132,255,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', marginBottom: 4 }}>
                                <Eye size={30} color="var(--primary)" />
                                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{msg.type === 'view_once_video' ? 'View video' : 'View photo'}</div>
                              </div>
                            ) : (
                              <div style={{ width: 220, height: 80, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 4 }}>
                                <EyeOff size={22} color="rgba(255,255,255,0.2)" />
                                <div style={{ fontSize: '0.7rem', opacity: 0.4 }}>{msg.senderId === user.uid ? 'Viewed' : 'Opened'}</div>
                              </div>
                            )
                          )}
                          {msg.type === 'voice' && <VoicePlayer url={msg.fileUrl} />}
                          {msg.type === 'file' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '10px', marginBottom: 4 }}>
                              <FileIcon size={18} stroke="white" /><div style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.text}</div>
                              <button onClick={() => downloadFile(msg.fileUrl, msg.text)} style={{ background: 'var(--primary)', border: 'none', color: 'white', width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Download size={14} /></button>
                            </div>
                          )}
                          {msg.type === 'sticker' && (
                            <div style={{ width: isMobile ? '160px' : '200px', height: isMobile ? '160px' : '200px', marginBottom: 4, filter: 'drop-shadow(0 0 10px rgba(0,132,255,0.2))' }}>
                              <img src={msg.fileUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                          )}
                          {msg.type === 'text' && <div style={{ fontSize: isMobile ? '0.95rem' : '1rem', lineHeight: 1.4, wordBreak: 'break-word' }}>{msg.text}</div>}
                        </>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 2, gap: 4 }}>
                        <div style={{ fontSize: '0.65rem', opacity: 0.5, fontVariantNumeric: 'tabular-nums' }}>
                          {msg.timestamp ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '...'}
                        </div>
                        {isMine && !msg.isDeleted && (
                          <CheckCheck size={12} color={msg.readBy?.length > 1 ? "#34b7f1" : "var(--text-dim)"} style={{ opacity: 0.8 }} />
                        )}
                      </div>

                      {msg.reactions && Object.keys(msg.reactions).filter(k => msg.reactions[k]?.length > 0).length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, position: 'absolute', bottom: -12, [isMine ? 'right' : 'left']: 0, zIndex: 5 }}>
                          {Object.entries(msg.reactions).filter(([, v]) => v?.length > 0).map(([emoji, voters]) => (
                            <button key={emoji} onClick={(e) => { e.stopPropagation(); handleReaction(msg.id, emoji); }} style={{ background: 'rgba(30, 41, 59, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '2px 6px', fontSize: '0.8rem', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: 3, backdropFilter: 'blur(10px)', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                              {emoji} <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>{voters.length}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </React.Fragment>
              );
            })}
            <div ref={scrollRef} style={{ height: 10 }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {(isBlocked || isBlockingMe) ? (
              <motion.div
                whileHover={isBlocked ? { background: 'rgba(255,255,255,0.05)' } : {}}
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!isBlocked) return;

                  setConfirmConfig({
                    title: 'Unblock Contact',
                    message: 'Are you sure you want to unblock this contact?',
                    confirmText: 'Unblock',
                    onConfirm: async () => {
                      setConfirmConfig(null);
                      try {
                        await updateDoc(doc(db, 'users', user.uid), {
                          blockedUsers: arrayRemove(otherUid)
                        });
                        setConfirmConfig({ title: 'Success', message: 'Contact unblocked successfully', hideCancel: true, onConfirm: () => setConfirmConfig(null) });
                      } catch (err) {
                        setConfirmConfig({ title: 'Error', message: 'Failed to unblock contact: ' + err.message, hideCancel: true, onConfirm: () => setConfirmConfig(null) });
                      }
                    }
                  });
                }}
                style={{
                  padding: '1.5rem',
                  textAlign: 'center',
                  background: 'rgba(0,0,0,0.2)',
                  color: 'var(--text-dim)',
                  fontSize: '0.9rem',
                  borderTop: '1px solid var(--glass-border)',
                  cursor: isBlocked ? 'pointer' : 'default',
                  zIndex: 100,
                  position: 'relative'
                }}
              >
                {isBlocked ? 'You blocked this contact. Tap to unblock.' : 'You can no longer send messages to this contact.'}
              </motion.div>
            ) : (
              <>
                <AnimatePresence>
                  {replyingTo && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                      <div style={{ padding: '12px 2rem', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderLeft: '3px solid var(--primary)', paddingLeft: 12 }}>
                          <CornerUpLeft size={16} color="var(--primary)" />
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)' }}>Replying to {replyingTo.senderName}</div>
                            <div style={{ fontSize: '0.85rem', opacity: 0.7, maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{replyingTo.text || `Sent a ${replyingTo.type}`}</div>
                          </div>
                        </div>
                        <X size={20} onClick={() => setReplyingTo(null)} style={{ cursor: 'pointer', opacity: 0.5 }} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {(type === 'channels' && !isAdmin) || liveItem.isSystem ? (
                  <div style={{ padding: '15px', textAlign: 'center', opacity: 0.6, fontSize: '0.9rem', background: 'rgba(0,0,0,0.1)', borderTop: '1px solid var(--glass-border)' }}>
                    Only admins can send messages.
                  </div>
                ) : (
                  <footer style={{ padding: isMobile ? '8px 10px' : '20px 40px', background: isMobile ? 'var(--bg-dark)' : 'rgba(0,0,0,0.3)', borderTop: '1px solid var(--glass-border)', display: 'flex', alignItems: 'flex-end', gap: isMobile ? 8 : 15, position: 'relative', minHeight: isMobile ? 56 : 80 }}>
                    {!isRecording && (
                      <button onClick={() => fileRef.current.click()} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><Paperclip size={24} /></button>
                    )}
                    <input type="file" ref={fileRef} multiple hidden onChange={(e) => {
                      const files = Array.from(e.target.files);
                      if (files.length > 0) {
                        setPendingFiles(files);
                        setShowEditor(true);
                        setActiveFileIndex(0);
                        setCaptions({});
                      }
                    }} />

                    <div className="message-input-container" style={{ background: 'rgba(255,255,255,0.06)', minHeight: 40, borderRadius: 20, position: 'relative', display: 'flex', alignItems: 'center', padding: '0 10px', flex: 1, marginBottom: 1 }}>
                      <AnimatePresence>
                        {showStickers && <StickerPicker onSelect={handleSendSticker} user={user} onClose={() => setShowStickers(false)} />}
                      </AnimatePresence>
                      {isRecording ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, paddingLeft: 6, height: 40 }}>
                          <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }} style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ef4444', fontVariantNumeric: 'tabular-nums' }}>
                            {`${Math.floor(recordingSecs / 60)}:${(recordingSecs % 60).toString().padStart(2, '0')}`}
                          </span>
                          <span style={{ fontSize: '0.8rem', opacity: 0.5, flex: 1 }}>Slide to cancel</span>
                          <button onClick={cancelRecording} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', padding: 6 }}><X size={18} /></button>
                        </div>
                      ) : (
                        <>
                          <button onClick={() => { setShowStickers(!showStickers); }} style={{ background: 'transparent', border: 'none', color: showStickers ? 'var(--primary)' : 'rgba(255,255,255,0.4)', padding: 4, cursor: 'pointer' }}><Smile size={22} /></button>
                          <input
                            className="input-modern"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                            placeholder="Message"
                            style={{ padding: '8px 4px', fontSize: '1rem', background: 'transparent', border: 'none', color: 'white', flex: 1 }}
                          />
                        </>
                      )}
                    </div>

                    <div style={{ width: 42, height: 42, flexShrink: 0 }}>
                      <AnimatePresence mode="wait">
                        {(newMessage.trim() || isRecording) ? (
                          <motion.button
                            key="send"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            onClick={isRecording ? stopRecording : handleSend}
                            disabled={isSending || isUploading}
                            style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--primary)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', boxShadow: '0 4px 12px var(--primary-glow)' }}
                          >
                            {isSending || isUploading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} style={{ marginLeft: 2 }} />}
                          </motion.button>
                        ) : (
                          <motion.button
                            key="mic"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            onMouseDown={startRecording}
                            onTouchStart={startRecording}
                            style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--primary)' }}
                          >
                            <Mic size={24} />
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                  </footer>
                )}
              </>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showInfo && (
            <div className="flex-center" style={{ position: 'absolute', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)' }}>
              <motion.div
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="glass-card"
                style={{ width: '100%', maxWidth: '450px', height: '100%', position: 'absolute', right: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto', background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(40px)', borderRadius: '30px 0 0 30px', borderLeft: '1px solid rgba(255,255,255,0.1)', borderRight: 'none', borderTop: 'none', borderBottom: 'none' }}
              >
                {/* Header Section */}
                <div style={{ position: 'relative', minHeight: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
                  <X size={28} onClick={() => setShowInfo(false)} style={{ position: 'absolute', top: 30, left: 30, cursor: 'pointer', zIndex: 10, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }} />

                  <div style={{ textAlign: 'center', zIndex: 5 }}>
                    <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto 1.5rem' }}>
                      <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '4px solid rgba(255,255,255,0.1)', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {(() => {
                          const isSannasa = liveItem.isSystem || liveItem.isSupport;
                          const photoUrl = isSannasa ? '/logo.png' : ((type === 'chats' ? otherUserStatus?.photoURL : null) || liveItem.photoURL || liveItem.logo);
                          if (photoUrl) {
                            return (
                              <img
                                key={photoUrl}
                                src={photoUrl}
                                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                onLoad={(e) => { e.target.style.display = 'block'; e.target.nextSibling.style.display = 'none'; }}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            );
                          }
                          return null;
                        })()}
                        <div style={{ fontSize: '4rem', fontWeight: 'bold', display: (liveItem.isSystem || liveItem.isSupport || (type === 'chats' ? otherUserStatus?.photoURL : null) || liveItem.photoURL || liveItem.logo) ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>{(type === 'chats' ? otherUserStatus?.fullName : liveItem.name)?.[0]}</div>
                      </div>
                      {isAdmin && (
                        <label style={{ position: 'absolute', bottom: 5, right: 5, width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', border: '2px solid rgba(255,255,255,0.2)' }}>
                          <ImageIcon size={20} color="white" />
                          <input type="file" hidden accept="image/*" onChange={(e) => e.target.files[0] && handleUpdateGroupPhoto(e.target.files[0])} />
                        </label>
                      )}
                    </div>
                    <h1 style={{ margin: '0 0 8px', fontSize: '1.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      {type === 'chats' ? (otherUserStatus?.fullName || liveItem.name) : liveItem.name}
                      {liveItem.isSystem && <span style={{ fontSize: '0.7rem', background: 'var(--primary)', padding: '3px 8px', borderRadius: '10px', flexShrink: 0 }}>OFFICIAL</span>}
                      {(otherUserStatus?.isVerified || liveItem.isVerified) && <img src="/verified.png" style={{ width: 24, height: 24, flexShrink: 0 }} alt="verified" />}
                      {isAdmin && <Pencil size={18} style={{ opacity: 0.5, cursor: 'pointer' }} onClick={handleUpdateGroupName} />}
                    </h1>
                    <div style={{ fontSize: '1.1rem', opacity: 0.6 }}>
                      {type === 'chats' ? (
                        liveItem.isSystem ? '@sannasa' : (liveItem.isSupport ? '@support' : `@${otherUserStatus?.username || 'user'}`)
                      ) : `${type === 'channels' ? 'Channel' : 'Group'} · ${liveItem.members?.length || 0} ${type === 'channels' ? 'followers' : 'members'}`}
                    </div>
                  </div>
                </div>

                <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Actions Row */}
                  {type === 'channels' ? (
                    <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1.5rem' }}>
                      <button className="glass-card" style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, border: 'none', background: 'rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                        <Reply size={24} style={{ transform: 'scaleX(-1)' }} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Forward</span>
                      </button>
                      <button onClick={copyInviteLink} className="glass-card" style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, border: 'none', background: 'rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                        <Link size={24} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Copy link</span>
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1.5rem' }}>
                      {type !== 'chats' && (
                        <div onClick={() => isAdmin ? setShowAddMemberModal(true) : alert('Only admins can add members')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <div className="glass-card" style={{ width: 60, height: 60, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}><UserPlus size={26} color="var(--success)" /></div>
                          <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>Add</span>
                        </div>
                      )}
                      <div onClick={() => { setIsSearchingInChat(true); setShowInfo(false); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <div className="glass-card" style={{ width: 60, height: 60, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}><Search size={26} color="var(--success)" /></div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>Search</span>
                      </div>
                    </div>
                  )}

                  {/* About Section */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)' }}>About</div>
                      {isAdmin && <Pencil size={16} style={{ opacity: 0.5, cursor: 'pointer' }} onClick={handleUpdateGroupDesc} />}
                    </div>
                    <div style={{ fontSize: '1rem', lineHeight: 1.5 }}>                       {liveItem.isSystem ? 'Platform Updates & Announcements' : (liveItem.isSupport ? 'Official Sannasa Support. We are here to help.' : (otherUserStatus?.bio || liveItem.description || 'No description available.'))}</div>
                  </div>

                  {/* Creation Info */}
                  {type !== 'chats' && (
                    <div style={{ fontSize: '0.85rem', opacity: 0.5, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                      Created {liveItem.createdAt?.toDate().toLocaleDateString()} at {liveItem.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}

                  {/* Channel Insights */}
                  {type === 'channels' && isAdmin && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.6)' }}>Insights for last 30 days</span>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <div className="glass-card" style={{ flex: 1, padding: '1.25rem', background: 'rgba(255,255,255,0.03)', border: 'none', borderRadius: 16 }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: 4 }}>{liveItem.members?.length || 0}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Accounts reached</div>
                        </div>
                        <div className="glass-card" style={{ flex: 1, padding: '1.25rem', background: 'rgba(255,255,255,0.03)', border: 'none', borderRadius: 16 }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: 4 }}>+{liveItem.members?.length || 0}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Net follows</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Media Section */}
                  {mediaList.length > 0 && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', cursor: 'pointer' }}>
                        <span style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.6)' }}>Media, links and docs</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                          {mediaList.length} <ChevronRight size={16} />
                        </div>
                      </div>
                      <div className="hide-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                        {mediaList.length > 0 ? mediaList.map((m, i) => (
                          <div key={i} onClick={() => setFullScreenImage(m)} style={{ minWidth: 100, height: 100, borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                            <img src={m.fileUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )) : (
                          <div style={{ padding: '1rem', color: 'var(--text-dim)', fontSize: '0.85rem', width: '100%', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12 }}>No media shared yet</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Members Section */}
                  {(type === 'groups' || (type === 'channels' && isAdmin)) && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)' }}>{liveItem.members?.length || 0} {type === 'channels' ? 'followers' : 'members'}</div>

                      {isAdmin && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                          <div onClick={() => setShowAddMemberModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 20, cursor: 'pointer' }}>
                            <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserPlus size={24} color="black" /></div>
                            <span style={{ fontSize: '1rem' }}>Add member</span>
                          </div>
                          <div onClick={copyInviteLink} style={{ display: 'flex', alignItems: 'center', gap: 20, cursor: 'pointer' }}>
                            <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Link size={24} color="black" /></div>
                            <span style={{ fontSize: '1rem' }}>Invite via link</span>
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {loadingMembers ? (
                          <div style={{ opacity: 0.5 }}>Loading...</div>
                        ) : groupMembers.map(m => {
                          const isTargetAdmin = liveItem.admins?.includes(m.id) || liveItem.ownerId === m.id;
                          return (
                            <div key={m.id} onClick={(e) => { e.stopPropagation(); m.id !== user.uid && setMemberContextMenu({ target: e.currentTarget, member: m }); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 0', cursor: m.id !== user.uid ? 'pointer' : 'default' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden' }}>
                                  {m.photoURL ? (
                                    <img key={m.photoURL} src={m.photoURL} onLoad={(e) => { e.target.style.display = 'block'; e.target.nextSibling.style.display = 'none'; }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : null}
                                  <div style={{ height: '100%', width: '100%', display: m.photoURL ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary)' }}>{m.fullName?.[0]}</div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <div style={{ fontWeight: 600, fontSize: '1rem' }}>{m.id === user.uid ? 'You' : m.fullName}</div>
                                  <div style={{ fontSize: '0.85rem', opacity: 0.5 }}>{m.bio || 'Hey there! I am using Sannasa.'}</div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                {isTargetAdmin && <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: 6 }}>Admin</div>}
                                {m.id !== user.uid && <ChevronDown size={20} style={{ opacity: 0.5 }} />}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {type !== 'channels' && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 20, opacity: 0.8, cursor: 'pointer' }}>
                            <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><List size={20} /></div>
                            <span style={{ fontSize: '1rem' }}>View member changes</span>
                          </div>
                          <div onClick={handleClearChat} style={{ display: 'flex', alignItems: 'center', gap: 20, color: 'var(--error)', cursor: 'pointer' }}>
                            <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MinusCircle size={20} /></div>
                            <span style={{ fontSize: '1rem' }}>Clear chat</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Danger Zone */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {type === 'chats' && !liveItem.isSystem && !liveItem.isSupport ? (
                      <>
                        <button
                          onClick={() => {
                            setShowInfo(false);
                            setConfirmConfig({
                              title: isBlocked ? 'Unblock Contact' : 'Block Contact',
                              message: isBlocked
                                ? 'Are you sure you want to unblock this contact?'
                                : 'Blocking this contact will prevent them from sending you messages.',
                              confirmText: isBlocked ? 'Unblock' : 'Block',
                              onConfirm: async () => {
                                setConfirmConfig(null);
                                try {
                                  const action = isBlocked ? arrayRemove(otherUid) : arrayUnion(otherUid);
                                  await updateDoc(doc(db, 'users', user.uid), { blockedUsers: action });
                                } catch (err) {
                                  setConfirmConfig({ title: 'Error', message: err.message, hideCancel: true, onConfirm: () => setConfirmConfig(null) });
                                }
                              }
                            });
                          }}
                          style={{ background: 'transparent', border: 'none', color: 'var(--error)', padding: '1rem 0', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', fontSize: '1rem' }}
                        >
                          <Ban size={20} /> {isBlocked ? 'Unblock' : 'Block'}
                        </button>
                        <button
                          onClick={() => {
                            setShowInfo(false);
                            setConfirmConfig({
                              title: 'Delete Chat',
                              message: 'This will permanently delete all messages in this conversation. This cannot be undone.',
                              confirmText: 'Delete',
                              onConfirm: async () => {
                                setConfirmConfig(null);
                                try {
                                  const q = query(collection(db, 'messages'), where('chatId', '==', chatId));
                                  const snaps = await getDocs(q);
                                  const batch = writeBatch(db);
                                  snaps.docs.forEach(d => batch.delete(d.ref));
                                  await batch.commit();
                                  await deleteDoc(doc(db, 'conversations', chatId));
                                  onClose && onClose();
                                } catch (err) {
                                  setConfirmConfig({ title: 'Error', message: err.message, hideCancel: true, onConfirm: () => setConfirmConfig(null) });
                                }
                              }
                            });
                          }}
                          style={{ background: 'transparent', border: 'none', color: 'var(--error)', padding: '1rem 0', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', fontSize: '1rem' }}
                        >
                          <Trash2 size={20} /> Delete chat
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={handleExitGroup} style={{ background: 'transparent', border: 'none', color: 'var(--error)', padding: '1rem 0', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', fontSize: '1rem' }}>
                          <LogOut size={20} /> {type === 'channels' ? 'Unfollow channel' : 'Exit group'}
                        </button>
                        <button onClick={handleReport} style={{ background: 'transparent', border: 'none', color: 'var(--error)', padding: '1rem 0', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', fontSize: '1rem' }}>
                          <Flag size={20} /> {type === 'channels' ? 'Report channel' : 'Report group'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {messageInfo && (
            <div className="flex-center" style={{ position: 'absolute', inset: 0, zIndex: 110, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }}>
              <motion.div initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }} className="glass" style={{ width: '100%', maxWidth: '400px', height: '100%', position: 'absolute', right: 0, padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <X size={24} onClick={() => setMessageInfo(null)} style={{ cursor: 'pointer' }} />
                    <h3 style={{ margin: 0 }}>Message info</h3>
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '1.5rem', alignSelf: 'flex-end', maxWidth: '90%', background: 'rgba(0, 132, 255, 0.45)', backdropFilter: 'blur(20px) saturate(180%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {messageInfo.type === 'text' && <div>{messageInfo.text}</div>}
                  {messageInfo.type === 'image' && <img src={messageInfo.fileUrl} style={{ width: '100%', borderRadius: 12 }} />}
                  <div style={{ fontSize: '0.6rem', opacity: 0.7, marginTop: 8, textAlign: 'right' }}>
                    {messageInfo.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <CheckCheck size={24} color="#34b7f1" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: 4 }}>Read</div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                        {Object.entries(messageInfo.readAt || {}).filter(([uid]) => uid !== user.uid).length === 0 ? (
                          <div style={{ fontStyle: 'italic' }}>Not read yet</div>
                        ) : (
                          Object.entries(messageInfo.readAt || {})
                            .filter(([uid]) => uid !== user.uid)
                            .map(([uid, time]) => {
                              const readerName = type === 'chats'
                                ? (otherUserStatus?.fullName || 'Contact')
                                : (groupMembers.find(m => m.id === uid)?.fullName || 'Member');
                              return (
                                <div key={uid} style={{ marginBottom: 4 }}>
                                  {type === 'chats' ? '' : `${readerName}: `}{time?.toDate().toLocaleString()}
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 16 }}>
                    <CheckCheck size={24} color="var(--text-dim)" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: 4 }}>Delivered</div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                        {messageInfo.timestamp?.toDate().toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showEditor && (
            <div className="flex-center" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(30px) saturate(200%)' }}>
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <header style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <X size={24} onClick={() => setShowEditor(false)} style={{ cursor: 'pointer' }} />
                  <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <RotateCw size={22} style={{ cursor: 'pointer', opacity: 0.8 }} />
                    <Crop size={22} style={{ cursor: 'pointer', opacity: 0.8 }} />
                    <Smile size={22} style={{ cursor: 'pointer', opacity: 0.8 }} />
                    <TypeIcon size={22} style={{ cursor: 'pointer', opacity: 0.8 }} />
                    <Pencil size={22} style={{ cursor: 'pointer', opacity: 0.8 }} />
                  </div>
                  <div style={{ width: 24 }} />
                </header>

                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', padding: '1rem', position: 'relative' }}>
                  {isUploading && (
                    <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <Loader2 size={48} className="animate-spin" color="var(--success)" />
                    </div>
                  )}
                  {pendingFiles[activeFileIndex].type.startsWith('video/') ? (
                    <video
                      key={activeFileIndex}
                      src={URL.createObjectURL(pendingFiles[activeFileIndex])}
                      controls
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }}
                    />
                  ) : (
                    <motion.img
                      key={activeFileIndex}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      src={URL.createObjectURL(pendingFiles[activeFileIndex])}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }}
                    />
                  )}
                </div>

                <footer style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'rgba(0,0,0,0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                    <div className="glass-card" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, padding: '4px 16px' }}>
                      <Smile size={24} style={{ opacity: 0.6 }} />
                      <input
                        className="input-modern"
                        value={captions[activeFileIndex] || ''}
                        onChange={e => setCaptions(prev => ({ ...prev, [activeFileIndex]: e.target.value }))}
                        placeholder="Add a caption..."
                        style={{ background: 'transparent', border: 'none' }}
                      />
                      <div
                        onClick={() => setIsViewOnce(!isViewOnce)}
                        style={{ cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: '50%', background: isViewOnce ? 'var(--success)' : 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}
                      >
                        <History size={16} color={isViewOnce ? 'white' : 'rgba(255,255,255,0.6)'} />
                        <span style={{ position: 'absolute', fontSize: '0.5rem', fontWeight: 'bold' }}>1</span>
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        const filesToUpload = [...pendingFiles];
                        const currentCaptions = { ...captions };
                        setIsUploading(true);
                        try {
                          for (let i = 0; i < filesToUpload.length; i++) {
                            const file = filesToUpload[i];
                            const url = await uploadToGithub(file, `chats/${chatId}/${Date.now()}_${file.name}`);
                            let baseType = file.type.startsWith('image/') ? 'image' : (file.type.startsWith('video/') ? 'video' : 'file');
                            let fType = isViewOnce && baseType !== 'file'
                              ? (baseType === 'image' ? 'view_once_image' : 'view_once_video')
                              : baseType;
                            await handleSend(null, {
                              type: fType,
                              fileUrl: url,
                              text: currentCaptions[i] || file.name,
                              isViewOnce: isViewOnce
                            });
                          }
                          setShowEditor(false);
                        } catch (err) {
                          console.error(err);
                          alert("Failed to upload file: " + err.message);
                        } finally {
                          setIsUploading(false);
                        }
                      }}
                      className="glass-card"
                      style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--success)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isUploading ? 'not-allowed' : 'pointer' }}
                      disabled={isUploading}
                    >
                      {isUploading ? <Loader2 size={28} className="animate-spin" color="white" /> : <Send size={28} color="white" />}
                    </button>
                  </div>

                  {pendingFiles.length > 1 && (
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                      {pendingFiles.map((file, idx) => (
                        <div
                          key={idx}
                          onClick={() => setActiveFileIndex(idx)}
                          style={{ width: 50, height: 50, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', border: activeFileIndex === idx ? '2px solid var(--success)' : '2px solid transparent', position: 'relative' }}
                        >
                          {file.type.startsWith('video/') ? (
                            <div style={{ width: '100%', height: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Play size={16} color="white" />
                            </div>
                          ) : (
                            <img src={URL.createObjectURL(file)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )}
                        </div>
                      ))}
                      <div className="glass-card" style={{ width: 50, height: 50, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => fileRef.current.click()}>
                        <Plus size={24} />
                      </div>
                    </div>
                  )}
                </footer>
              </div>
            </div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {fullScreenImage && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column', userSelect: 'none' }}>
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <header style={{ padding: '1.5rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <X size={28} onClick={() => { setFullScreenImage(null); setZoom(1); }} style={{ cursor: 'pointer' }} />
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{fullScreenImage.senderName}</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{fullScreenImage.timestamp?.toDate().toLocaleString()}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                    {(fullScreenImage.type === 'image' || fullScreenImage.type === 'view_once_image') && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '6px 16px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)' }}>
                        <button onClick={() => setZoom(z => Math.max(0.5, z - 0.5))} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><Minus size={18} /></button>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, minWidth: 40, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
                        <button onClick={() => setZoom(z => Math.min(5, z + 0.5))} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><Plus size={18} /></button>
                      </div>
                    )}
                    {!fullScreenImage.type?.startsWith('view_once') && (
                      <button onClick={() => downloadFile(fullScreenImage.fileUrl, fullScreenImage.text)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: 10, borderRadius: 12, cursor: 'pointer' }}>
                        <Download size={22} />
                      </button>
                    )}
                  </div>
                </header>

                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden', padding: '1rem' }}>
                  {(fullScreenImage.type === 'video' || fullScreenImage.type === 'view_once_video') ? (
                    <video
                      src={fullScreenImage.fileUrl?.startsWith('//') ? 'https:' + fullScreenImage.fileUrl : fullScreenImage.fileUrl}
                      controls
                      autoPlay
                      style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}
                      preload="auto"
                      playsInline
                    />
                  ) : (() => {
                    const imgSrc = fullScreenImage.fileUrl?.startsWith('//') ? 'https:' + fullScreenImage.fileUrl : fullScreenImage.fileUrl;
                    return (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s', transform: `scale(${zoom})` }}>
                        <img
                          key={imgSrc}
                          src={imgSrc}
                          alt="media"
                          referrerPolicy="no-referrer"
                          style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: 8, display: 'block' }}
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                        <div style={{ display: 'none', flexDirection: 'column', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.4)' }}>
                          <span style={{ fontSize: '3rem' }}>⚠️</span>
                          <span style={{ fontSize: '0.9rem' }}>Image expired or unavailable</span>
                          <a href={imgSrc} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'underline' }}>Try opening directly</a>
                        </div>
                      </div>
                    );
                  })()}

                  {fullScreenImage.text && fullScreenImage.text !== fullScreenImage.senderName && (
                    <div style={{ position: 'absolute', bottom: '5%', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', padding: '12px 24px', borderRadius: '24px', backdropFilter: 'blur(20px)', maxWidth: '80%', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)', zIndex: 10 }}>
                      {fullScreenImage.text}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
        {/* FIXED OVERLAYS AT ROOT LEVEL */}
        {memberContextMenu && (
          <div onClick={() => setMemberContextMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(0,0,0,0.4)' }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ position: 'fixed', top: Math.min(window.innerHeight - 300, memberContextMenu.target.getBoundingClientRect().top), right: Math.max(20, window.innerWidth - memberContextMenu.target.getBoundingClientRect().right), background: 'rgba(30, 41, 59, 0.85)', backdropFilter: 'blur(30px) saturate(200%)', borderRadius: 16, padding: '12px 0', boxShadow: '0 10px 40px rgba(0,0,0,0.6)', minWidth: 260, zIndex: 5001, border: '1px solid rgba(255,255,255,0.08)' }}>
              {isAdmin && (
                <>
                  {(liveItem.admins?.includes(memberContextMenu.member.id) || liveItem.ownerId === memberContextMenu.member.id) ? (
                    <div onClick={(e) => { e.stopPropagation(); handleDismissAdmin(memberContextMenu.member.id); }} style={{ padding: '14px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }} className="menu-item"><ShieldAlert size={20} /> Dismiss as admin</div>
                  ) : (
                    <div onClick={(e) => { e.stopPropagation(); handlePromote(memberContextMenu.member.id); }} style={{ padding: '14px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }} className="menu-item"><Shield size={20} /> Make Admin</div>
                  )}
                  <div onClick={(e) => { e.stopPropagation(); handleRemoveMember(memberContextMenu.member.id); }} style={{ padding: '14px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }} className="menu-item"><MinusCircle size={20} /> Remove member</div>
                </>
              )}
              <div onClick={(e) => { e.stopPropagation(); alert('Security Code: ' + Math.random().toString().slice(2, 10)); }} style={{ padding: '14px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }} className="menu-item"><Lock size={20} /> Verify security code</div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '8px 0' }} />
              <div onClick={(e) => { e.stopPropagation(); handleDirectMessage(memberContextMenu.member); }} style={{ padding: '14px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }} className="menu-item"><Send size={20} /> Message {memberContextMenu.member.fullName}</div>
            </motion.div>
          </div>
        )}

        {showChatMenu && (
          <div onClick={() => setShowChatMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.2)' }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              style={{
                position: 'fixed',
                top: isMobile ? 55 : 70,
                right: isMobile ? 10 : 30,
                background: 'rgba(30, 41, 59, 0.98)',
                backdropFilter: 'blur(40px) saturate(200%)',
                borderRadius: 18,
                padding: '10px 0',
                boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                minWidth: 200,
                zIndex: 9001,
                border: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <div onClick={(e) => { e.stopPropagation(); setShowInfo(true); setShowChatMenu(false); }} style={{ padding: '12px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }} className="menu-item"><Info size={18} /> View Info</div>
              <div onClick={(e) => { e.stopPropagation(); setIsSearchingInChat(true); setShowChatMenu(false); }} style={{ padding: '12px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }} className="menu-item"><Search size={18} /> Search Chat</div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '8px 0' }} />
              <div onClick={(e) => { e.stopPropagation(); handleClearChat(); }} style={{ padding: '12px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, color: 'var(--error)' }} className="menu-item"><Eraser size={18} /> Clear Chat</div>
              {type !== 'chats' && (
                <div onClick={(e) => { e.stopPropagation(); handleExitGroup(); setShowChatMenu(false); }} style={{ padding: '12px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, color: 'var(--error)' }} className="menu-item"><LogOut size={18} /> Leave {type === 'channels' ? 'Channel' : 'Group'}</div>
              )}
            </motion.div>
          </div>
        )}

        {showAddMemberModal && (
          <div className="flex-center" style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card" style={{ width: '90%', maxWidth: '450px', maxHeight: '85vh', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h2 style={{ margin: 0 }}>Add Members</h2><X size={28} onClick={() => setShowAddMemberModal(false)} style={{ cursor: 'pointer', opacity: 0.7 }} /></div>
              <input className="input-modern" placeholder="Search users..." value={memberSearchTerm} onChange={e => setMemberSearchTerm(e.target.value)} style={{ padding: '1rem 1.5rem' }} />
              <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {allUsers.filter(u => u.fullName?.toLowerCase().includes(memberSearchTerm.toLowerCase())).map(u => (
                  <div key={u.id} onClick={() => handleAddMember(u)} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '1rem', borderRadius: 16, background: 'rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{u.photoURL ? <img src={u.photoURL} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : u.fullName?.[0]}</div>
                    <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{u.fullName}</div><div style={{ fontSize: '0.8rem', opacity: 0.5 }}>@{u.username}</div></div>
                    <Plus size={20} color="var(--success)" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {msgContextMenu && (
          <div onClick={() => setMsgContextMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'transparent' }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ position: 'fixed', top: Math.min(window.innerHeight - 250, msgContextMenu.target.getBoundingClientRect().top), left: msgContextMenu.msg.senderId === user.uid ? 'auto' : msgContextMenu.target.getBoundingClientRect().left, right: msgContextMenu.msg.senderId === user.uid ? (window.innerWidth - msgContextMenu.target.getBoundingClientRect().right) : 'auto', background: 'rgba(30, 41, 59, 0.85)', backdropFilter: 'blur(30px) saturate(200%)', borderRadius: 16, padding: '10px 0', boxShadow: '0 10px 40px rgba(0,0,0,0.6)', minWidth: 200, border: '1px solid rgba(255,255,255,0.08)', zIndex: 5001 }}>
              {type !== 'channels' && (
                <div onClick={(e) => { e.stopPropagation(); setReplyingTo(msgContextMenu.msg); setMsgContextMenu(null); }} style={{ padding: '14px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }} className="menu-item"><Reply size={18} /> Reply</div>
              )}
              <div onClick={(e) => { e.stopPropagation(); const r = msgContextMenu.target.getBoundingClientRect(); setEmojiPicker({ msgId: msgContextMenu.msg.id, x: r.left, y: r.top }); setMsgContextMenu(null); }} style={{ padding: '14px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }} className="menu-item"><SmilePlus size={18} /> React</div>
              {msgContextMenu.msg.senderId === user.uid && (
                <div onClick={(e) => { e.stopPropagation(); setMessageInfo(msgContextMenu.msg); setMsgContextMenu(null); }} style={{ padding: '14px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }} className="menu-item"><Info size={18} /> Info</div>
              )}
              {type !== 'channels' && (
                <div onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msgContextMenu.msg.id, false); }} style={{ padding: '14px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }} className="menu-item"><Trash2 size={18} /> Delete for me</div>
              )}
              {(msgContextMenu.msg.senderId === user.uid || isAdmin) && (
                <div onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msgContextMenu.msg.id, true); }} style={{ padding: '14px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, color: 'var(--error)' }} className="menu-item"><Trash2 size={18} /> Delete for everyone</div>
              )}
            </motion.div>
          </div>
        )}

        {/* Floating emoji picker */}
        {emojiPicker && (
          <div onClick={() => setEmojiPicker(null)} style={{ position: 'fixed', inset: 0, zIndex: 6000 }}>
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} style={{ position: 'fixed', top: Math.min(window.innerHeight - 120, emojiPicker.y - 80), left: Math.min(window.innerWidth - 320, emojiPicker.x), background: 'rgba(20,30,50,0.95)', backdropFilter: 'blur(30px)', borderRadius: 20, padding: '12px 16px', boxShadow: '0 10px 40px rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)', zIndex: 6001, display: 'flex', gap: 8 }}>
              {QUICK_EMOJIS.map(emoji => (
                <button key={emoji} onClick={() => handleReaction(emojiPicker.msgId, emoji)} style={{ fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', transition: 'transform 0.15s', padding: '4px 6px', borderRadius: 10 }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.35)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>{emoji}</button>
              ))}
            </motion.div>
          </div>
        )}
        <AnimatePresence>
          {confirmConfig && (
            <div className="dialog-overlay" onClick={() => setConfirmConfig(null)}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="dialog-content"
                onClick={e => e.stopPropagation()}
              >
                <div className="dialog-title">{confirmConfig.title}</div>
                <div className="dialog-message">{confirmConfig.message}</div>
                <div className="dialog-actions">
                  {!confirmConfig.hideCancel && <button className="btn-secondary" onClick={() => setConfirmConfig(null)}>Cancel</button>}
                  <button className="btn-primary" style={{ padding: '12px 28px', borderRadius: 20 }} onClick={confirmConfig.onConfirm}>
                    {confirmConfig.confirmText || 'OK'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default ChatWindow;
