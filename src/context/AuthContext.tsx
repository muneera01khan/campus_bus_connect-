import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import {
  checkIsAdminRecord,
  createUserProfile,
  getPreassignedRole,
  subscribeUserProfile,
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [preassigned, setPreassigned] = useState<RoleAssignment | null>(null);
  const [isAdminRecord, setIsAdminRecord] = useState(false);
  const [roleLookupReady, setRoleLookupReady] = useState(false);
  const [myFacultyRequest, setMyFacultyRequest] = useState<FacultyAccessRequest | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
      if (!user) {
        setProfile(null);
        setPreassigned(null);
        setIsAdminRecord(false);
        setRoleLookupReady(false);
        setMyFacultyRequest(null);
        setProfileLoading(false);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authReady || !firebaseUser) return;

    setProfileLoading(true);
    setRoleLookupReady(false);
    setAuthError(null);
    let active = true;

    const preassignPromise = firebaseUser.email
      ? getPreassignedRole(firebaseUser.email).catch(() => null)
      : Promise.resolve(null);
    const adminPromise = checkIsAdminRecord(firebaseUser.uid).catch(() => false);

    Promise.all([preassignPromise, adminPromise]).then(([assignment, adminExists]) => {
      if (!active) return;
      setPreassigned(assignment);
      setIsAdminRecord(adminExists);
      setRoleLookupReady(true);
    });

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
    department: string;
    identifier: string;
  }) => {
    if (!firebaseUser?.email) {
      throw new Error('Verified Google email is required to register.');
    }

    // Roles cannot be self-elevated: new users default to 'student' unless
    // explicitly pre-assigned in /role_assignments or /admins in Firestore.
    const verifiedRole: UserRole = preassigned?.role
      ? preassigned.role
      : isAdminRecord
        ? 'hod'
        : 'student';

    await createUserProfile({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: params.displayName,
      role: verifiedRole,
      department: params.department,
      identifier: params.identifier,
    });
  };

  const effectiveProfile: UserProfile | null =
    profile && isAdminRecord && profile.role !== 'hod'
      ? { ...profile, role: 'hod' }
      : profile;

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        authReady,
        profile: effectiveProfile,
        profileLoading: profileLoading || (Boolean(firebaseUser) && !roleLookupReady),
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
