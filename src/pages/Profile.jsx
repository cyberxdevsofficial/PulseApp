import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { User, Mail, Phone, Camera, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { uploadToGithub } from '../services/githubStorage';

const Profile = () => {
  const { userData, setUserData } = useAuth();
  const [formData, setFormData] = useState({
    fullName: userData?.fullName || '',
    mobileNo: userData?.mobileNo || '',
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = React.useRef();

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", userData.uid), {
        fullName: formData.fullName,
        mobileNo: formData.mobileNo
      });
      setUserData({ ...userData, ...formData });
      alert("Profile updated successfully!");
    } catch (err) {
      alert("Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadToGithub(file);
      await updateDoc(doc(db, "users", userData.uid), {
        photoURL: url
      });
      setUserData({ ...userData, photoURL: url });
      alert("Profile photo updated!");
    } catch (err) {
      console.error(err);
      alert("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1rem' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '1.5rem' }}>
          <ArrowLeft size={18} /> Back
        </button>

        <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Profile Settings</h1>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '3rem', fontWeight: 'bold', overflow: 'hidden' }}>
              {userData?.photoURL ? (
                <img src={userData.photoURL} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                userData?.fullName?.[0]
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              hidden 
              accept="image/*" 
              onChange={handlePhotoUpload} 
            />
            <button 
              onClick={() => fileInputRef.current.click()}
              disabled={uploading}
              className="btn-primary" 
              style={{ position: 'absolute', bottom: '0', right: '0', padding: '8px', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            </button>
          </div>
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              {userData?.fullName} {userData?.isVerified && <img src="/src/icon/verified.png" style={{ width: 20, height: 20 }} alt="verified" />}
            </h2>
            <p style={{ color: 'var(--text-dim)' }}>@{userData?.username}</p>
          </div>
        </div>

        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ fontSize: '0.9rem', color: 'gray', display: 'block', marginBottom: '5px' }}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <User style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'gray', width: '18px' }} />
              <input 
                type="text" 
                className="input-glass" 
                style={{ width: '100%', paddingLeft: '40px' }} 
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.9rem', color: 'gray', display: 'block', marginBottom: '5px' }}>Email (Hidden in app)</label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'gray', width: '18px' }} />
              <input 
                type="email" 
                className="input-glass" 
                style={{ width: '100%', paddingLeft: '40px', opacity: 0.6 }} 
                value={userData?.email} 
                disabled 
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.9rem', color: 'gray', display: 'block', marginBottom: '5px' }}>Mobile Number (Hidden in app)</label>
            <div style={{ position: 'relative' }}>
              <Phone style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'gray', width: '18px' }} />
              <input 
                type="tel" 
                className="input-glass" 
                style={{ width: '100%', paddingLeft: '40px' }} 
                value={formData.mobileNo}
                onChange={(e) => setFormData({ ...formData, mobileNo: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
