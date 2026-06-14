import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { Camera, Mail, Phone, User, Lock, Loader2, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Signup = () => {
  const [formData, setFormData] = useState({
    email: '',
    mobileNo: '',
    fullName: '',
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const navigate = useNavigate();

  const checkUsername = async (username) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    const q = query(collection(db, "users"), where("username", "==", username.toLowerCase()));
    const querySnapshot = await getDocs(q);
    setUsernameAvailable(querySnapshot.empty);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'username') {
      checkUsername(value);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (usernameAvailable === false) {
      setError('This username is already taken.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await sendEmailVerification(user);

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: formData.email,
        mobileNo: formData.mobileNo,
        fullName: formData.fullName,
        username: formData.username.toLowerCase(),
        photoURL: '',
        roles: ['user'],
        isVerified: false,
        isBanned: false,
        oldUsernames: [],
        createdAt: new Date().toISOString()
      });

      alert('Account created! Please verify your email before logging in.');
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center" style={{ width: '100vw', minHeight: '100vh', padding: '2rem' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass" 
        style={{ width: '100%', maxWidth: '500px', padding: '3rem', borderRadius: '32px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Create <span className="gradient-text">Account</span></h1>
          <p style={{ color: 'var(--text-dim)' }}>Join the Sannasa community today</p>
        </div>
        
        {error && (
          <div style={{ color: 'var(--error)', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ position: 'relative' }}>
            <User style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', width: '20px' }} />
            <input 
              type="text" 
              name="fullName" 
              placeholder="Full Name" 
              className="input-modern" 
              style={{ paddingLeft: '48px' }} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div style={{ position: 'relative' }}>
            <User style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', width: '20px' }} />
            <input 
              type="text" 
              name="username" 
              placeholder="Username" 
              className="input-modern" 
              style={{ paddingLeft: '48px', borderColor: usernameAvailable === false ? 'var(--error)' : usernameAvailable === true ? 'var(--success)' : '' }} 
              onChange={handleChange} 
              required 
            />
            <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}>
              {usernameAvailable === true && <Check size={18} className="text-green-500" />}
              {usernameAvailable === false && <AlertCircle size={18} className="text-red-500" />}
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <Mail style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', width: '20px' }} />
            <input 
              type="email" 
              name="email" 
              placeholder="Email Address" 
              className="input-modern" 
              style={{ paddingLeft: '48px' }} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Phone style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', width: '20px' }} />
            <input 
              type="tel" 
              name="mobileNo" 
              placeholder="Mobile Number" 
              className="input-modern" 
              style={{ paddingLeft: '48px' }} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', width: '20px' }} />
            <input 
              type="password" 
              name="password" 
              placeholder="Create Password" 
              className="input-modern" 
              style={{ paddingLeft: '48px' }} 
              onChange={handleChange} 
              required 
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading || usernameAvailable === false} style={{ marginTop: '1rem', height: '54px' }}>
            {loading ? <Loader2 className="animate-spin" /> : <>Create Account <ArrowRight size={20} /></>}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
          By signing up, you agree to our <span style={{ color: 'var(--primary)' }}>Terms & Privacy</span>.
        </p>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-dim)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Signup;
