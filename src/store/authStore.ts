// src/store/authStore.ts

import { create } from 'zustand';
import {
  type User,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { saveUserProfile } from '../lib/firestore';

interface AuthState {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  init: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  signInWithGoogle: async () => {
    await signInWithRedirect(auth, googleProvider);
  },

  signOut: async () => {
    await firebaseSignOut(auth);
  },

  // Call once in App.tsx — returns unsubscribe fn
  init: () => {
    // Handle redirect result after returning from Google login page
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        saveUserProfile(
          result.user.uid,
          result.user.displayName ?? '',
          result.user.photoURL ?? ''
        ).catch(console.error);
      }
    }).catch(console.error);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      set({ user, loading: false });
      if (user) {
        saveUserProfile(user.uid, user.displayName ?? '', user.photoURL ?? '')
          .catch(console.error);
      }
    });
    return unsubscribe;
  },
}));
