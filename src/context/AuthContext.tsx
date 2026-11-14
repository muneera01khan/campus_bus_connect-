import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import {
  BOOTSTRAPPED_DIRECTOR_EMAIL,
  createUserProfile,
  getPreassignedRole,
  subscribeUserProfile,
  updateUserRole,
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
  myFacultyRequest: FacultyAccessRequest | null;
  authError: string | null;
  isBootstrappedDirector: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: (params: {
    displayName: string;
    role: UserRole;
    department: string;
    identifier: string;
  }) => Promise<void>;
  switchDirectorTestRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [preassigned, setPreassigned] = useState<RoleAssignment | null>(null);
  const [myFacultyRequest, setMyFacultyRequest] = useState<FacultyAccessRequest | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const isBootstrappedDirector =
    Boolean(firebaseUser?.emailVerified) &&
    firebaseUser?.email?.toLowerCase() === BOOTSTRAPPED_DIRECTOR_EMAIL;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
      if (!user) {
        setProfile(null);
        setPreassigned(null);
        setMyFacultyRequest(null);
        setProfileLoading(false);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authReady || !firebaseUser) return;

    setProfileLoading(true);
    setAuthError(null);
    let active = true;

    if (firebaseUser.email) {
      getPreassignedRole(firebaseUser.email)
        .then((assignment) => {
          if (active) setPreassigned(assignment);
        })
        .catch(() => {
          if (active) setPreassigned(null);
        });
    }

    const unsubProfile = subscribeUserProfile(
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

    return () => {
      active = false;
      unsubProfile();
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
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to sign in with Google.';
      if (!msg.includes('popup-closed-by-user')) {
        setAuthError(msg);
      }
    }
  };

  const logout = async () => {
    setAuthError(null);
    await signOut(auth);
  };

  const completeOnboarding = async (params: {
    displayName: string;
    role: UserRole;
    department: string;
    identifier: string;
  }) => {
    if (!firebaseUser?.email) {
      throw new Error('Verified Google email is required to register.');
    }
    await createUserProfile({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: params.displayName,
      role: params.role,
      department: params.department,
      identifier: params.identifier,
    });
  };

  const switchDirectorTestRole = async (role: UserRole) => {
    if (!firebaseUser || !isBootstrappedDirector) return;
    await updateUserRole(firebaseUser.uid, role);
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        authReady,
        profile,
        profileLoading,
        preassigned,
        myFacultyRequest,
        authError,
        isBootstrappedDirector,
        loginWithGoogle,
        logout,
        completeOnboarding,
        switchDirectorTestRole,
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
