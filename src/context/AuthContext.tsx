"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import api from "../services/api";

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  subscriptionPlan?: string | null;
  subscriptionDate?: string | null;
  subscriptionExpiry?: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  token: string | null;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  updateUserProfile: (name: string, photoURL: string | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(null);

  // Sync user profile from Firestore or create it if not exists
  const syncProfile = async (firebaseUser: User) => {
    try {
      const docRef = doc(db, "users", firebaseUser.uid);
      const docSnap = await getDoc(docRef);

      const profileData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || "User",
        photoURL: firebaseUser.photoURL || null,
        createdAt: new Date().toISOString(),
      };

      if (!docSnap.exists()) {
        // Save initial user profile in Firestore
        await setDoc(docRef, profileData);
        setProfile(profileData);
      } else {
        const existingData = docSnap.data();
        setProfile({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: existingData.displayName || firebaseUser.displayName || "User",
          photoURL: existingData.photoURL || firebaseUser.photoURL || null,
          createdAt: existingData.createdAt || new Date().toISOString(),
          subscriptionPlan: existingData.subscriptionPlan || null,
          subscriptionDate: existingData.subscriptionDate || null,
          subscriptionExpiry: existingData.subscriptionExpiry || null,
        });
      }
    } catch (error) {
      console.error("Error syncing user profile from Firestore:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        
        // Get JWT token from Firebase to send in API requests
        const idToken = await currentUser.getIdToken(true);
        setToken(idToken);

        // Sync local Firestore user details
        await syncProfile(currentUser);

        // Notify backend about verification/sync (Optional, but nice backend integration)
        try {
          await api.post(
            "/user/verify",
            {},
            {
              headers: {
                Authorization: `Bearer ${idToken}`,
              },
            }
          );
        } catch (err) {
          console.error("Failed to verify token with backend:", err);
        }
      } else {
        setUser(null);
        setProfile(null);
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update basic display name in Firebase Auth
      await updateProfile(userCredential.user, { displayName: name });
      
      // Save user to Firestore database
      const profileData = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: name,
        photoURL: null,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "users", userCredential.user.uid), profileData);
      
      setUser(userCredential.user);
      setProfile(profileData);

      // Verify session on backend
      const idToken = await userCredential.user.getIdToken();
      setToken(idToken);
      await api.post("/user/verify", {}, { headers: { Authorization: `Bearer ${idToken}` } });

    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      const idToken = await userCredential.user.getIdToken();
      setToken(idToken);
      await syncProfile(userCredential.user);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      setUser(userCredential.user);
      const idToken = await userCredential.user.getIdToken();
      setToken(idToken);
      await syncProfile(userCredential.user);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  };

  const signOutUser = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setProfile(null);
      setToken(null);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const updateUserProfile = async (name: string, photoURL: string | null) => {
    if (!user) throw new Error("No authenticated user");
    try {
      // Update Firebase Auth details
      await updateProfile(user, {
        displayName: name,
        photoURL: photoURL,
      });

      // Update Firestore document details
      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, {
        displayName: name,
        photoURL: photoURL,
      });

      // Update local context states
      setProfile((prev) => (prev ? { ...prev, displayName: name, photoURL: photoURL } : null));
    } catch (error) {
      console.error("Error updating profile in Context:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        token,
        signUpWithEmail,
        signInWithEmail,
        signInWithGoogle,
        resetPassword,
        signOutUser,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
