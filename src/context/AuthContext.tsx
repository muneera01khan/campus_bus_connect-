import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth, FIREBASE_PROJECT_ID, googleProvider } from '../lib/firebase';
import {
  checkIsAdminRecord,
  createUserProfile,
  getPreassignedRole,
  subscribeUserProfile,
  syncUserOnLogin,
} from '../services/userService';
import { subscribeMyFacultyRequest } from '../services/requestService';
import type {
  FacultyAccessRequest,
  RoleAssignment,
  UserProfile,
  UserRole,
} from '../types/campus';

interface AuthContextValue {
  firebaseUser: User | null;
  authReady: boolean;
  profile: UserProfile | null;
  profileLoading: boolean;
  preassigned: RoleAssignment | null;
  isAdminRecord: boolean;
  myFacultyRequest: FacultyAccessRequest | null;
  authError: string | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: (params: {
    displayName: string;
    department: string;
    identifier: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function formatFirebaseAuthError(err: unknown): string {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code?: unknown }).code ?? '')
      : '';
  const message = err instanceof Error ? err.message : 'Unable to sign in with Google.';

  switch (code) {
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Please allow popups for this site and click Continue with Google again.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before sign-in completed. Please try again and choose an account.';
    case 'auth/cancelled-popup-request':
      return 'A previous sign-in popup was already open and was cancelled. Please click Continue with Google once.';
    case 'auth/unauthorized-domain':
      return `Domain "${window.location.hostname}" is not authorized for Firebase Authentication in project "${FIREBASE_PROJECT_ID}". Add it under Firebase Console → Authentication → Settings → Authorized domains.`;
    case 'auth/operation-not-allowed':
      return `Google Sign-In provider is disabled in Firebase Console for project "${FIREBASE_PROJECT_ID}". Enable Google under Authentication → Sign-in method.`;
    case 'auth/network-request-failed':
      return 'Network error while connecting to Google / Firebase Authentication. Please check your internet connection and retry.';
    case 'auth/invalid-api-key':
      return `Invalid Firebase API key configured for project "${FIREBASE_PROJECT_ID}".`;
    default:
      return code ? `${code}: ${message}` : message;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [preassigned, setPreassigned] = useState<RoleAssignment | null>(null);
  const [isAdminRecord, setIsAdminRecord] = useState(false);
  const [syncReady, setSyncReady] = useState(false);
  const [myFacultyRequest, setMyFacultyRequest] = useState<FacultyAccessRequest | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(
      auth,
      (user) => {
        setFirebaseUser(user);
        setAuthReady(true);
        if (!user) {
          setProfile(null);
          setPreassigned(null);
          setIsAdminRecord(false);
          setSyncReady(false);
          setMyFacultyRequest(null);
          setProfileLoading(false);
        }
      },
      (err) => {
        console.error('Firebase Auth state error:', err);
        setAuthError(formatFirebaseAuthError(err));
        setAuthReady(true);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authReady || !firebaseUser) return;

    setProfileLoading(true);
    setSyncReady(false);
    setAuthError(null);
    let active = true;
    let unsubProfile: (() => void) | undefined;

    const initializeUserSession = async () => {
      try {
        const [assignment, adminExists] = await Promise.all([
          firebaseUser.email
            ? getPreassignedRole(firebaseUser.email).catch(() => null)
            : Promise.resolve(null),
          checkIsAdminRecord(firebaseUser.uid).catch(() => false),
        ]);

        if (!active) return;
        setPreassigned(assignment);
        setIsAdminRecord(adminExists);

        await syncUserOnLogin({
          user: firebaseUser,
          preassigned: assignment,
          isAdminRecord: adminExists,
        });

        if (!active) return;
        setSyncReady(true);

        unsubProfile = subscribeUserProfile(
          firebaseUser.uid,
          (loadedProfile) => {
            if (!active) return;
            setProfile(loadedProfile);
            setProfileLoading(false);
          },
          (err) => {
            if (!active) return;
            setAuthError(err.message);
            setProfileLoading(false);
          }
        );
      } catch (err) {
        if (!active) return;
        setAuthError(err instanceof Error ? err.message : 'Unable to sync user profile.');
        setSyncReady(true);
        setProfileLoading(false);
      }
    };

    void initializeUserSession();

    return () => {
      active = false;
      if (unsubProfile) unsubProfile();
    };
  }, [authReady, firebaseUser]);

  useEffect(() => {
    if (!authReady || !firebaseUser || profile?.role !== 'faculty') {
      setMyFacultyRequest(null);
      return;
    }

    const unsubRequest = subscribeMyFacultyRequest(
      firebaseUser.uid,
      (req) => setMyFacultyRequest(req),
      (err) => setAuthError(err.message)
    );

    return () => unsubRequest();
  }, [authReady, firebaseUser, profile?.role]);

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      if (!credential?.user) {
        setAuthError('Google sign-in did not return an authenticated user account.');
      }
    } catch (err) {
      console.error('Google Sign-In failed:', err);
      setAuthError(formatFirebaseAuthError(err));
    }
  };

  const logout = async () => {
    setAuthError(null);
    await signOut(auth);
  };

  const completeOnboarding = async (params: {
    displayName: string;
    department: string;
    identifier: string;
  }) => {
    if (!firebaseUser?.email) {
      throw new Error('Verified Google email is required to register.');
    }

    const verifiedRole: UserRole = preassigned?.role
      ? preassigned.role
      : isAdminRecord
        ? 'hod'
        : 'student';

    await createUserProfile({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: params.displayName,
      provider: firebaseUser.providerData[0]?.providerId || 'google.com',
      role: verifiedRole,
      department: params.department,
      identifier: params.identifier,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        authReady,
        profile,
        profileLoading: profileLoading || (Boolean(firebaseUser) && !syncReady),
        preassigned,
        isAdminRecord,
        myFacultyRequest,
        authError,
        loginWithGoogle,
        logout,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
