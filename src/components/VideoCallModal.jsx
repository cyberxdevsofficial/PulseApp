import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, PhoneMissed, Video, VideoOff, User, Loader2, PhoneCall } from 'lucide-react';
import { db, rtdb } from '../services/firebase';
import { doc, collection, addDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref as rRef, onValue as onRtdbValue, set as setRtdb, update as updateRtdb, push as pushRtdb, remove as removeRtdb, onChildAdded } from 'firebase/database';

const servers = {
  iceServers: [
    { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
    { urls: ['stun:stun3.l.google.com:19302', 'stun:stun4.l.google.com:19302'] },
    { urls: ['stun:stun.l.google.com:19302'] },
  ],
  iceCandidatePoolSize: 10,
};

const VideoCallModal = ({ caller, callId, isReceiving, onClose }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1000);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callStatus, setCallStatus] = useState(isReceiving ? 'Initializing...' : 'Calling...');
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState(null);
  const [isEnding, setIsEnding] = useState(false);
  const [mediaStarted, setMediaStarted] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pc = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1000);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cleanup();
    };
  }, []);

  const handleStartMedia = () => {
    setMediaStarted(true);
    startCommunication();
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (pc.current) {
      pc.current.close();
      pc.current = null;
    }
  };

  const handleEndCall = async (notifyOther = true) => {
    if (isEnding) return;
    setIsEnding(true);
    cleanup();
    if (notifyOther && callId) {
      try {
        const status = callStatus === 'Connected' ? 'ended' : 'rejected';
        const callPath = `calls/${callId}`;
        await updateRtdb(rRef(rtdb, callPath), { status, duration: callDuration });


        const callSnap = await new Promise(resolve => onRtdbValue(rRef(rtdb, callPath), snapshot => resolve(snapshot.val()), { onlyOnce: true }));
        if (callSnap) {
          await addDoc(collection(db, 'messages'), {
            chatId: callSnap.chatId,
            senderId: callSnap.callerId,
            senderName: callSnap.callerName,
            type: 'call_log',
            text: status === 'rejected' ? 'Missed video call' : `Video call ended (${formatTime(callDuration)})`,
            timestamp: serverTimestamp()
          });
        }
      } catch (e) { console.error(e); }
    }
    onClose();
  };

  const startCommunication = async () => {
    try {

      let audioStream, videoStream, stream;
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {
        throw new Error("Microphone access denied.");
      }

      try {
        videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      } catch (e) {
        try {
          videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (e2) {
          console.warn("Camera failed", e2);
          setIsVideoOff(true);
        }
      }

      stream = new MediaStream();
      audioStream.getAudioTracks().forEach(t => stream.addTrack(t));
      if (videoStream) {
        videoStream.getVideoTracks().forEach(t => stream.addTrack(t));
      }

      streamRef.current = stream;
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;


      pc.current = new RTCPeerConnection(servers);

      pc.current.onconnectionstatechange = () => {
        if (pc.current?.connectionState === 'connected') setCallStatus('Connected');
        if (pc.current?.connectionState === 'disconnected' || pc.current?.connectionState === 'failed') handleEndCall(false);
      };


      stream.getTracks().forEach(track => pc.current.addTrack(track, stream));


      pc.current.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      const callPath = `calls/${callId}`;
      const offerCandidatesPath = `${callPath}/offerCandidates`;
      const answerCandidatesPath = `${callPath}/answerCandidates`;

      pc.current.onicecandidate = (event) => {
        if (event.candidate) {
          const path = isReceiving ? answerCandidatesPath : offerCandidatesPath;
          pushRtdb(rRef(rtdb, path), event.candidate.toJSON());
        }
      };


      if (isReceiving) {
        setCallStatus('Connecting...');
        const queuedCandidates = [];

        onChildAdded(rRef(rtdb, offerCandidatesPath), (snapshot) => {
          if (pc.current) {
            const candidate = new RTCIceCandidate(snapshot.val());
            if (pc.current.remoteDescription) pc.current.addIceCandidate(candidate).catch(console.error);
            else queuedCandidates.push(candidate);
          }
        });

        onRtdbValue(rRef(rtdb, callPath), async (snapshot) => {
          const data = snapshot.val();
          if (!data || !pc.current) return;
          if (data.status === 'ended' || data.status === 'rejected') return handleEndCall(false);

          if (data.offer && !pc.current.remoteDescription) {
            await pc.current.setRemoteDescription(new RTCSessionDescription(data.offer));
            while (queuedCandidates.length > 0) {
              if (pc.current) pc.current.addIceCandidate(queuedCandidates.shift()).catch(console.error);
            }
            const answer = await pc.current.createAnswer();
            await pc.current.setLocalDescription(answer);
            await updateRtdb(rRef(rtdb, callPath), {
              answer: { type: answer.type, sdp: answer.sdp },
              status: 'connected'
            });

            await updateRtdb(rRef(rtdb, `incoming_calls/${data.receiverId}/${callId}`), { status: 'connected' });
          }
        });
      } else {
        setCallStatus('Ringing...');
        const offer = await pc.current.createOffer();
        await pc.current.setLocalDescription(offer);
        await updateRtdb(rRef(rtdb, callPath), {
          offer: { type: offer.type, sdp: offer.sdp },
          status: 'ringing'
        });

        onChildAdded(rRef(rtdb, answerCandidatesPath), (snapshot) => {
          if (pc.current) {
            const candidate = new RTCIceCandidate(snapshot.val());
            if (pc.current.remoteDescription) pc.current.addIceCandidate(candidate).catch(console.error);
          }
        });

        onRtdbValue(rRef(rtdb, callPath), async (snapshot) => {
          const data = snapshot.val();
          if (!data || !pc.current) return;
          if (data.status === 'ended' || data.status === 'rejected') return handleEndCall(false);

          if (data.answer && !pc.current.remoteDescription) {
            await pc.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          }
        });
      }

    } catch (err) {
      console.error(err);
      setError(err.message);
      setCallStatus('Error');
    }
  };

  useEffect(() => {
    let interval;
    if (callStatus === 'Connected') {
      interval = setInterval(() => setCallDuration(d => d + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  return (
    <div className="flex-center" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)' }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass" style={{ width: isMobile ? '100vw' : '90vw', height: isMobile ? '100dvh' : '90vh', maxWidth: '1200px', borderRadius: isMobile ? '0' : '32px', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

        {!mediaStarted ? (
          <div className="flex-center" style={{ flex: 1, flexDirection: 'column', gap: '2rem', padding: '2rem', textAlign: 'center' }}>
            <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 0 50px var(--primary-glow)' }}>
              <PhoneCall size={60} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{isReceiving ? 'Incoming Call' : 'Start Video Call'}</h2>
              <p style={{ color: 'var(--text-dim)', maxWidth: '400px' }}>To join the call, please grant access to your camera and microphone.</p>
            </div>
            <button onClick={handleStartMedia} className="btn-primary" style={{ padding: '16px 40px', borderRadius: 16, fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Video size={24} />
              Start Camera & Mic
            </button>
            <button onClick={() => onClose()} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>Cancel</button>
          </div>
        ) : (
          <>
            {/* Header Overlay */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: isMobile ? '1.5rem' : '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 16 }}>
                <div style={{ width: isMobile ? 40 : 50, height: isMobile ? 40 : 50, borderRadius: 12, background: 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: isMobile ? '1rem' : '1.2rem', overflow: 'hidden' }}>
                  {caller?.photoURL ? <img src={caller.photoURL} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : caller?.name?.[0]}
                </div>
                <div>
                  <h2 style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', marginBottom: 2 }}>{caller?.name}</h2>
                  <div style={{ color: callStatus === 'Error' ? 'var(--error)' : (callStatus === 'Connected' ? 'var(--success)' : 'var(--text-dim)'), fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                    {callStatus === 'Connected' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite' }} />}
                    {callStatus === 'Error' ? `Error: ${error}` : (callStatus === 'Connected' ? formatTime(callDuration) : callStatus)}
                  </div>
                </div>
              </div>
            </div>

            {/* Video Stage */}
            <div style={{ flex: 1, position: 'relative', background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {remoteStream ? (
                <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div className="flex-center" style={{ flexDirection: 'column', gap: '2rem' }}>
                  <div style={{ width: 150, height: 150, borderRadius: '50%', background: 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', animation: 'pulse 2s infinite', boxShadow: '0 0 50px var(--primary-glow)' }}>
                    {caller?.photoURL ? <img src={caller.photoURL} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : <User size={80} color="white" />}
                  </div>
                  {callStatus === 'Error' ? (
                    <div style={{ textAlign: 'center', padding: '0 2rem' }}>
                      <p style={{ color: 'var(--error)', fontWeight: 600, marginBottom: '1rem' }}>{error}</p>
                      <button onClick={() => window.location.reload()} className="btn-primary" style={{ padding: '10px 24px', borderRadius: 12 }}>Retry</button>
                    </div>
                  ) : (
                    <div className="flex-center" style={{ gap: 10 }}>
                      <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
                      <p style={{ color: 'var(--text-dim)' }}>Waiting for connection...</p>
                    </div>
                  )}
                </div>
              )}

              {/* Local Video Preview */}
              <div className="glass-card" style={{ position: 'absolute', top: isMobile ? '1rem' : '2rem', right: isMobile ? '1rem' : '2rem', width: isMobile ? '100px' : '250px', height: isMobile ? '150px' : '350px', borderRadius: isMobile ? '16px' : '24px', overflow: 'hidden', zIndex: 20, border: '2px solid rgba(255,255,255,0.1)' }}>
                {isVideoOff ? (
                  <div style={{ width: '100%', height: '100%', background: '#1e293b', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <VideoOff size={isMobile ? 24 : 40} color="var(--text-dim)" />
                  </div>
                ) : (
                  <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                )}
              </div>
            </div>

            {/* Controls */}
            <div style={{ padding: isMobile ? '1.5rem' : '2.5rem', display: 'flex', justifyContent: 'center', gap: isMobile ? '1.5rem' : '2rem', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30 }}>
              <button onClick={toggleMute} className={`glass-card ${isMuted ? 'active' : ''}`} style={{ width: 60, height: 60, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', border: 'none', background: isMuted ? 'var(--error)' : 'rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.3s' }}>
                {isMuted ? <MicOff size={24} color="white" /> : <Mic size={24} color="white" />}
              </button>

              <button onClick={() => handleEndCall()} className="glass-card" style={{ width: 70, height: 70, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', border: 'none', background: 'var(--error)', cursor: 'pointer', boxShadow: '0 10px 30px rgba(239, 68, 68, 0.4)', transition: 'transform 0.2s' }}>
                <PhoneMissed size={32} color="white" />
              </button>

              <button onClick={toggleVideo} className={`glass-card ${isVideoOff ? 'active' : ''}`} style={{ width: 60, height: 60, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', border: 'none', background: isVideoOff ? 'var(--error)' : 'rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.3s' }}>
                {isVideoOff ? <VideoOff size={24} color="white" /> : <Video size={24} color="white" />}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default VideoCallModal;
