import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Radio, Users, Check, Loader2, ArrowRight, Home, ShieldCheck } from 'lucide-react';

const Join = () => {
  const { type, id } = useParams();
  const { user, userData } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [item, setItem] = useState(null);
  const [error, setError] = useState(null);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, type, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setItem({ id: docSnap.id, ...data });
          if (user && data.members?.includes(user.uid)) {
            setIsMember(true);
          }
        } else {
          setError('Channel or Group not found.');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load community details.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type, id, user]);

  const handleJoin = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/join/${type}/${id}` } });
      return;
    }

    try {
      setJoining(true);
      await updateDoc(doc(db, type, id), {
        members: arrayUnion(user.uid)
      });
      setIsMember(true);

      setTimeout(() => {
        navigate('/', { state: { selectedChatId: id, selectedType: type } });
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Failed to join: ' + err.message);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)', color: 'white', padding: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Oops!</h1>
        <p style={{ opacity: 0.7, marginBottom: '2rem' }}>{error}</p>
        <Link to="/" className="btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Home size={20} /> Back Home
        </Link>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-dark)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      backgroundImage: 'radial-gradient(circle at top right, rgba(0, 163, 255, 0.05), transparent), radial-gradient(circle at bottom left, rgba(0, 255, 122, 0.05), transparent)'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: 500,
          padding: '3rem 2rem',
          textAlign: 'center',
          borderRadius: 32,
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{
          width: 120,
          height: 120,
          borderRadius: 40,
          background: 'var(--primary)',
          margin: '0 auto 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          position: 'relative'
        }}>
          {item.logo ? (
            <img src={item.logo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Logo" />
          ) : (
            type === 'channels' ? <Radio size={60} color="white" /> : <Users size={60} color="white" />
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <h1 style={{ fontSize: '2rem', margin: 0, fontWeight: 800 }}>{item.name}</h1>
          {item.isVerified && <ShieldCheck size={24} color="var(--primary)" />}
        </div>

        <p style={{
          fontSize: '1.1rem',
          opacity: 0.6,
          marginBottom: '2.5rem',
          lineHeight: 1.6,
          maxWidth: '80%',
          margin: '0 auto 2.5rem'
        }}>
          {item.description || `Join this ${type === 'channels' ? 'channel' : 'group'} on PulseApp to stay updated.`}
        </p>

        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 20,
          padding: '1rem',
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{item.members?.length || 0}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: 1 }}>{type === 'channels' ? 'Followers' : 'Members'}</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{type === 'channels' ? 'Public' : 'Private'}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: 1 }}>Status</div>
          </div>
        </div>

        {isMember ? (
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
            style={{
              width: '100%',
              height: 60,
              borderRadius: 20,
              fontSize: '1.1rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              background: 'var(--success)'
            }}
          >
            <Check size={24} /> Already a member
          </button>
        ) : (
          <button
            onClick={handleJoin}
            disabled={joining}
            className="btn-primary"
            style={{
              width: '100%',
              height: 60,
              borderRadius: 20,
              fontSize: '1.1rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {joining ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                Join {type === 'channels' ? 'Channel' : 'Group'} <ArrowRight size={22} />
              </>
            )}
          </button>
        )}

        <div style={{ marginTop: '2rem' }}>
          <Link to="/" style={{ color: 'var(--text-dim)', fontSize: '0.9rem', textDecoration: 'none' }}>
            Maybe later
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Join;
