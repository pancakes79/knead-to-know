import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithCredential,
  GoogleAuthProvider,
  updateProfile,
  updatePassword,
  deleteUser,
  sendEmailVerification,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  multiFactor,
  getMultiFactorResolver,
  MultiFactorResolver,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, deleteDoc, collection, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { ref, listAll, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '../config/firebase';

// ─── Types ───

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  mfaResolver: MultiFactorResolver | null;
  isMFAEnrolled: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: (idToken: string, accessToken?: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  clearMFAResolver: () => void;
  disableMFA: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ───

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);
  const [isMFAEnrolled, setIsMFAEnrolled] = useState(false);

  // Listen for auth state changes (also handles token refresh & app restarts)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
        });
        // Check MFA enrollment status
        const enrolledFactors = multiFactor(firebaseUser).enrolledFactors;
        setIsMFAEnrolled(enrolledFactors.length > 0);
        // Ensure user document exists in Firestore
        await ensureUserDocument(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Create or update user document in Firestore on first sign-in
  const ensureUserDocument = async (firebaseUser: FirebaseUser) => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    await setDoc(
      userRef,
      {
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoUrl: firebaseUser.photoURL,
        lastLoginAt: serverTimestamp(),
      },
      { merge: true } // Don't overwrite existing fields like preferences
    );
  };

  // ─── Email/Password Auth ───

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error.code === 'auth/multi-factor-auth-required') {
        const resolver = getMultiFactorResolver(auth, error);
        setMfaResolver(resolver);
        return; // Don't rethrow — UI will show MFA verify screen
      }
      throw error;
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string, displayName: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });
    // Send email verification
    await sendEmailVerification(credential.user);
    // Trigger the onAuthStateChanged with updated profile
    await credential.user.reload();
  }, []);

  // ─── Google Sign-In ───

  const signInWithGoogle = useCallback(async (idToken: string, accessToken?: string) => {
    try {
      const credential = GoogleAuthProvider.credential(idToken, accessToken);
      await signInWithCredential(auth, credential);
    } catch (error: any) {
      if (error.code === 'auth/multi-factor-auth-required') {
        const resolver = getMultiFactorResolver(auth, error);
        setMfaResolver(resolver);
        return;
      }
      throw error;
    }
  }, []);

  // ─── Email Verification ───

  const resendVerificationEmail = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not signed in');
    if (currentUser.emailVerified) throw new Error('Email already verified');
    await sendEmailVerification(currentUser);
  }, []);

  const refreshUser = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    await currentUser.reload();
    setUser({
      uid: currentUser.uid,
      email: currentUser.email,
      displayName: currentUser.displayName,
      photoURL: currentUser.photoURL,
      emailVerified: currentUser.emailVerified,
    });
    const enrolledFactors = multiFactor(currentUser).enrolledFactors;
    setIsMFAEnrolled(enrolledFactors.length > 0);
  }, []);

  // ─── Password Management ───

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) throw new Error('Not signed in with email');
    // Re-authenticate before changing password
    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);
    await updatePassword(currentUser, newPassword);
  }, []);

  // ─── MFA ───

  const clearMFAResolver = useCallback(() => {
    setMfaResolver(null);
  }, []);

  const disableMFA = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not signed in');

    const enrolled = multiFactor(currentUser).enrolledFactors;
    if (enrolled.length === 0) throw new Error('MFA is not enabled');

    await multiFactor(currentUser).unenroll(enrolled[0]);
    setIsMFAEnrolled(false);
  }, []);

  // ─── Sign Out ───

  const signOut = useCallback(async () => {
    setMfaResolver(null);
    await firebaseSignOut(auth);
  }, []);

  // ─── Delete Account (required for app store) ───

  const deleteAccount = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not signed in');

    const uid = currentUser.uid;

    try {
      // 1. Delete all user's bake logs
      const bakesQuery = query(collection(db, 'bakes'), where('ownerId', '==', uid));
      const bakesSnap = await getDocs(bakesQuery);
      const bakeDeletes = bakesSnap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(bakeDeletes);

      // 2. Delete all user's recipes
      const recipesQuery = query(collection(db, 'recipes'), where('ownerId', '==', uid));
      const recipesSnap = await getDocs(recipesQuery);
      const recipeDeletes = recipesSnap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(recipeDeletes);

      // 3. Delete user's photos from Storage
      try {
        const photosRef = ref(storage, `bake-photos/${uid}`);
        const photosList = await listAll(photosRef);
        const photoDeletes = photosList.items.map((item) => deleteObject(item));
        await Promise.all(photoDeletes);
      } catch {
        // No photos folder — that's fine
      }

      // 4. Delete user document
      await deleteDoc(doc(db, 'users', uid));

      // 5. Delete Firebase Auth account (must be last)
      await deleteUser(currentUser);
    } catch (error: any) {
      // If the auth deletion fails due to requiring re-authentication,
      // we still deleted the data — the auth account will be cleaned up
      if (error.code === 'auth/requires-recent-login') {
        throw new Error('For security, please sign out and sign back in, then try deleting again.');
      }
      throw error;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        mfaResolver,
        isMFAEnrolled,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        deleteAccount,
        clearMFAResolver,
        disableMFA,
        resendVerificationEmail,
        refreshUser,
        resetPassword,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ───

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
