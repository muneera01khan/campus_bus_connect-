/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DemoProvider, useDemo } from './context/DemoContext';
import { BusDirectory } from './components/BusDirectory';
import { BusFormModal } from './components/BusFormModal';
import { FacultyAccessView } from './components/FacultyAccessView';
import { HodRequestsView } from './components/HodRequestsView';
import { Layout, type NavTab } from './components/Layout';
import { LoginPage } from './components/LoginPage';
import { OnboardingPage } from './components/OnboardingPage';
import { RoleDirectoryView } from './components/RoleDirectoryView';
import { ShiftManagerView } from './components/ShiftManagerView';
import { subscribeBusSchedules } from './services/busService';
import { subscribeAllFacultyRequests } from './services/requestService';
import type { BusSchedule } from './types/campus';

function PortalRouter() {
  const { firebaseUser, authReady, profile, profileLoading } = useAuth();
  const { isDemoMode, demoProfile, demoBuses, demoRequests } = useDemo();

  const [activeTab, setActiveTab] = useState<NavTab>('schedules');
  const [liveBuses, setLiveBuses] = useState<BusSchedule[]>([]);
  const [liveBusesLoading, setLiveBusesLoading] = useState(true);
  const [liveBusesError, setLiveBusesError] = useState<string | null>(null);
  const [livePendingRequestsCount, setLivePendingRequestsCount] = useState(0);

  const [busModalOpen, setBusModalOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<BusSchedule | null>(null);

  const activeProfile = isDemoMode ? demoProfile : profile;

  // Reset invalid tab if role changes
  useEffect(() => {
    if (!activeProfile) return;
    const r = activeProfile.role;
    if (activeTab === 'faculty_access' && r !== 'faculty') setActiveTab('schedules');
    if (activeTab === 'hod_requests' && r !== 'hod') setActiveTab('schedules');
    if (activeTab === 'role_directory' && r !== 'hod') setActiveTab('schedules');
    if (activeTab === 'shift_manager' && r !== 'tdc' && r !== 'hod') setActiveTab('schedules');
  }, [activeProfile, activeTab]);

  // Subscribe to live Firestore bus schedules only when in Live Mode with an authenticated profile
  useEffect(() => {
    if (isDemoMode || !authReady || !firebaseUser || !profile) {
      setLiveBuses([]);
      setLiveBusesLoading(false);
      return;
    }

    setLiveBusesLoading(true);
    setLiveBusesError(null);
    const unsub = subscribeBusSchedules(
      (items) => {
        setLiveBuses(items);
        setLiveBusesLoading(false);
      },
      (err) => {
        setLiveBusesError(err.message);
        setLiveBusesLoading(false);
      }
    );
    return () => unsub();
  }, [isDemoMode, authReady, firebaseUser, profile]);

  // Subscribe to pending faculty requests count for HOD/Director sidebar in Live Mode
  useEffect(() => {
    if (isDemoMode || !authReady || !firebaseUser || profile?.role !== 'hod') {
      setLivePendingRequestsCount(0);
      return;
    }

    const unsub = subscribeAllFacultyRequests(
      (requests) => {
        setLivePendingRequestsCount(requests.filter((r) => r.status === 'pending').length);
      },
      () => {
        setLivePendingRequestsCount(0);
      }
    );
    return () => unsub();
  }, [isDemoMode, authReady, firebaseUser, profile?.role]);

  if (!isDemoMode) {
    if (!authReady || (firebaseUser && profileLoading)) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white border border-slate-200 rounded-xl px-6 py-5 text-sm text-slate-600">
            Loading CAMPUS BUS CONNECT...
          </div>
        </div>
      );
    }

    if (!firebaseUser) {
      return <LoginPage />;
    }

    if (!profile) {
      return <OnboardingPage />;
    }
  }

  if (!activeProfile) return null;

  const effectiveBuses = isDemoMode ? demoBuses : liveBuses;
  const effectiveLoading = isDemoMode ? false : liveBusesLoading;
  const effectiveError = isDemoMode ? null : liveBusesError;
  const effectivePendingCount = isDemoMode
    ? demoRequests.filter((r) => r.status === 'pending').length
    : livePendingRequestsCount;

  const openAddBus = () => {
    setEditingBus(null);
    setBusModalOpen(true);
  };

  const openEditBus = (bus: BusSchedule) => {
    setEditingBus(bus);
    setBusModalOpen(true);
  };

  return (
    <Layout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      onOpenAddBus={openAddBus}
      pendingRequestsCount={effectivePendingCount}
    >
      {activeTab === 'schedules' && (
        <BusDirectory
          buses={effectiveBuses}
          loading={effectiveLoading}
          error={effectiveError}
          onEditBus={openEditBus}
          onOpenAddBus={openAddBus}
          onOpenFacultyAccess={() => setActiveTab('faculty_access')}
        />
      )}

      {activeTab === 'faculty_access' && activeProfile.role === 'faculty' && (
        <FacultyAccessView buses={effectiveBuses} />
      )}

      {activeTab === 'hod_requests' && activeProfile.role === 'hod' && <HodRequestsView />}

      {activeTab === 'shift_manager' &&
        (activeProfile.role === 'tdc' || activeProfile.role === 'hod') && (
          <ShiftManagerView buses={effectiveBuses} />
        )}

      {activeTab === 'role_directory' && activeProfile.role === 'hod' && <RoleDirectoryView />}

      {busModalOpen && (
        <BusFormModal
          existingBus={editingBus}
          onClose={() => {
            setBusModalOpen(false);
            setEditingBus(null);
          }}
        />
      )}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DemoProvider>
        <PortalRouter />
      </DemoProvider>
    </AuthProvider>
  );
}
