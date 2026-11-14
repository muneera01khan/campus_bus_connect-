/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
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
  const [activeTab, setActiveTab] = useState<NavTab>('schedules');
  const [buses, setBuses] = useState<BusSchedule[]>([]);
  const [busesLoading, setBusesLoading] = useState(true);
  const [busesError, setBusesError] = useState<string | null>(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  const [busModalOpen, setBusModalOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<BusSchedule | null>(null);

  // Reset invalid tab if role changes
  useEffect(() => {
    if (!profile) return;
    const r = profile.role;
    if (activeTab === 'faculty_access' && r !== 'faculty') setActiveTab('schedules');
    if (activeTab === 'hod_requests' && r !== 'hod') setActiveTab('schedules');
    if (activeTab === 'role_directory' && r !== 'hod') setActiveTab('schedules');
    if (activeTab === 'shift_manager' && r !== 'tdc' && r !== 'hod') setActiveTab('schedules');
  }, [profile, activeTab]);

  // Subscribe to bus schedules once authenticated with a profile
  useEffect(() => {
    if (!authReady || !firebaseUser || !profile) {
      setBuses([]);
      setBusesLoading(false);
      return;
    }

    setBusesLoading(true);
    setBusesError(null);
    const unsub = subscribeBusSchedules(
      (items) => {
        setBuses(items);
        setBusesLoading(false);
      },
      (err) => {
        setBusesError(err.message);
        setBusesLoading(false);
      }
    );
    return () => unsub();
  }, [authReady, firebaseUser, profile]);

  // Subscribe to pending faculty requests count for HOD/Director sidebar
  useEffect(() => {
    if (!authReady || !firebaseUser || profile?.role !== 'hod') {
      setPendingRequestsCount(0);
      return;
    }

    const unsub = subscribeAllFacultyRequests(
      (requests) => {
        setPendingRequestsCount(requests.filter((r) => r.status === 'pending').length);
      },
      () => {
        setPendingRequestsCount(0);
      }
    );
    return () => unsub();
  }, [authReady, firebaseUser, profile?.role]);

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
      pendingRequestsCount={pendingRequestsCount}
    >
      {activeTab === 'schedules' && (
        <BusDirectory
          buses={buses}
          loading={busesLoading}
          error={busesError}
          onEditBus={openEditBus}
          onOpenAddBus={openAddBus}
          onOpenFacultyAccess={() => setActiveTab('faculty_access')}
        />
      )}

      {activeTab === 'faculty_access' && profile.role === 'faculty' && (
        <FacultyAccessView buses={buses} />
      )}

      {activeTab === 'hod_requests' && profile.role === 'hod' && <HodRequestsView />}

      {activeTab === 'shift_manager' &&
        (profile.role === 'tdc' || profile.role === 'hod') && (
          <ShiftManagerView buses={buses} />
        )}

      {activeTab === 'role_directory' && profile.role === 'hod' && <RoleDirectoryView />}

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
      <PortalRouter />
    </AuthProvider>
  );
}
