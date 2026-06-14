import { useEffect } from 'react';
import { rtdb, auth } from '../services/firebase';
import { ref, onValue, onDisconnect, set, serverTimestamp } from 'firebase/database';

export const usePresence = () => {
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userStatusRef = ref(rtdb, `/status/${user.uid}`);
    const connectedRef = ref(rtdb, '.info/connected');

    const unsubscribe = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {


        onDisconnect(userStatusRef).set({
          state: 'offline',
          last_changed: serverTimestamp(),
        }).then(() => {

          set(userStatusRef, {
            state: 'online',
            last_changed: serverTimestamp(),
            name: user.displayName,
            photoURL: user.photoURL
          });
        });
      }
    });

    return () => {
      unsubscribe();

      set(userStatusRef, {
        state: 'offline',
        last_changed: serverTimestamp(),
      });
    };
  }, []);
};
