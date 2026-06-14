import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubUser = null;
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (unsubUser) unsubUser();

      if (firebaseUser) {

        setDoc(doc(db, 'users', firebaseUser.uid), {
          isOnline: true,
          lastSeen: serverTimestamp()
        }, { merge: true }).catch(e => console.error("Presence update error:", e));

        unsubUser = onSnapshot(doc(db, 'users', firebaseUser.uid), (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setUserData({
              uid: firebaseUser.uid,
              ...data,
              blockedUsers: data.blockedUsers || [],
              pinnedChats: data.pinnedChats || []
            });
          } else {
            setUserData({
              uid: firebaseUser.uid,
              fullName: firebaseUser.displayName || 'New User',
              blockedUsers: [],
              pinnedChats: []
            });
          }
          setLoading(false);
        }, (error) => {
          console.error("AuthContext user snapshot error:", error);
          setUserData({
            fullName: firebaseUser.displayName || 'Guest User',
            blockedUsers: [],
            pinnedChats: []
          });
          setLoading(false);
        });
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    const handlePresence = () => {
      if (auth.currentUser) {
        setDoc(doc(db, 'users', auth.currentUser.uid), {
          isOnline: false,
          lastSeen: serverTimestamp()
        }, { merge: true }).catch(e => { });
      }
    };

    window.addEventListener('beforeunload', handlePresence);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') handlePresence();
      else if (document.visibilityState === 'visible' && auth.currentUser) {
        setDoc(doc(db, 'users', auth.currentUser.uid), {
          isOnline: true,
          lastSeen: serverTimestamp()
        }, { merge: true }).catch(e => { });
      }
    });

    return () => {
      unsubAuth();
      if (unsubUser) unsubUser();
      handlePresence();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, setUserData }}>
      {children}
    </AuthContext.Provider>
  );
};
