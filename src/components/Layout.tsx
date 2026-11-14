import React, { useState } from 'react';
import {
  Bus,
  Clock,
  FileCheck2,
  FlaskConical,
  LogOut,
  Menu,
  Plus,
  RotateCcw,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDemo } from '../context/DemoContext';
import { ROLE_LABELS, type UserRole } from '../types/campus';

export type NavTab =
  | 'schedules'
  | 'faculty_access'
  | 'hod_requests'
  | 'shift_manager'
  | 'role_directory';

interface LayoutProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAddBus?: () => void;
  pendingRequestsCount?: number;
  children: React.ReactNode;
}

export function Layout({
  activeTab,
  onSelectTab,
  onOpenAddBus,
  pendingRequestsCount = 0,
  children,
}: LayoutProps) {
  const { firebaseUser, profile, logout } = useAuth();
  const {
    isDemoMode,
    demoRole,
    demoProfile,
    enterDemoMode,
    exitDemoMode,
    setDemoRole,
    resetDemoData,
  } = useDemo();

  const [mobileOpen, setMobileOpen] = useState(false);

  const activeProfile = isDemoMode ? demoProfile : profile;
  if (!activeProfile) return null;

  const role = activeProfile.role;

  const allNavItems: { id: NavTab; label: string; icon: React.ReactNode; visible: boolean }[] = [
    {
      id: 'schedules',
      label: 'Bus Schedules',
      icon: <Bus className="w-4 h-4 shrink-0" />,
      visible: true,
    },
    {
      id: 'faculty_access',
      label: 'Detailed Access',
      icon: <FileCheck2 className="w-4 h-4 shrink-0" />,
      visible: role === 'faculty',
    },
    {
      id: 'hod_requests',
      label:
        pendingRequestsCount > 0
          ? `Faculty Requests (${pendingRequestsCount})`
          : 'Faculty Requests',
      icon: <ShieldCheck className="w-4 h-4 shrink-0" />,
      visible: role === 'hod',
    },
    {
      id: 'shift_manager',
      label: 'Shift Manager',
      icon: <Clock className="w-4 h-4 shrink-0" />,
      visible: role === 'tdc' || role === 'hod',
    },
    {
      id: 'role_directory',
      label: 'User Management',
      icon: <Users className="w-4 h-4 shrink-0" />,
      visible: role === 'hod',
    },
  ];
  const navItems = allNavItems.filter((item) => item.visible);

  const activeLabel = navItems.find((i) => i.id === activeTab)?.label ?? 'Dashboard';

  const handleDemoRoleSwitch = (nextRole: UserRole) => {
    setDemoRole(nextRole);
    if (nextRole === 'faculty') {
      onSelectTab('faculty_access');
    } else if (nextRole === 'hod') {
      onSelectTab('hod_requests');
    } else {
      onSelectTab('schedules');
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <span className="font-display text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
          CAMPUS BUS CONNECT
        </span>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-md cursor-pointer"
          aria-label="Close navigation menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectTab(item.id);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                active
                  ? 'bg-blue-50 text-blue-800'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 space-y-3">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {activeProfile.displayName}
          </p>
          <p className="text-xs text-slate-500 truncate">{activeProfile.email}</p>
          <p className="text-xs font-medium text-blue-700 pt-0.5">
            {ROLE_LABELS[activeProfile.role]}
            {activeProfile.department ? ` · ${activeProfile.department}` : ''}
          </p>
        </div>

        {!isDemoMode ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                enterDemoMode(activeProfile.role);
                setMobileOpen(false);
              }}
              className="w-full min-h-[38px] px-3 py-2 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <FlaskConical className="w-3.5 h-3.5 shrink-0" />
              <span>Open Demo Mode</span>
            </button>
            <button
              type="button"
              onClick={logout}
              className="w-full min-h-[40px] px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={exitDemoMode}
            className="w-full min-h-[40px] px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span>{firebaseUser ? 'Return to Live Firebase' : 'Exit Demo Mode'}</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-64 max-w-[80vw] h-full z-10">{sidebarContent}</div>
        </div>
      )}

      {/* Main Viewport */}
      <div className="flex-1 min-w-0 flex flex-col">
        {isDemoMode && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-8 py-2.5">
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 text-xs text-amber-950">
                <span className="inline-flex items-center gap-1.5 font-mono font-semibold px-2 py-0.5 bg-amber-200/80 text-amber-950 rounded">
                  <FlaskConical className="w-3.5 h-3.5 shrink-0" />
                  <span>DEMO MODE</span>
                </span>
                <span className="text-amber-900">
                  Isolated sample records · Real Firebase data is never modified.
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 p-0.5 bg-amber-100 border border-amber-200 rounded-lg">
                  {(
                    [
                      { id: 'student', label: 'Student' },
                      { id: 'faculty', label: 'Faculty' },
                      { id: 'hod', label: 'HOD / Director' },
                      { id: 'tdc', label: 'TDC' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleDemoRoleSwitch(opt.id)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        demoRole === opt.id
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-amber-900 hover:text-slate-900'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={resetDemoData}
                  className="px-2.5 py-1 text-xs font-medium text-amber-900 bg-white hover:bg-amber-100 border border-amber-300 rounded-md inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 shrink-0" />
                  <span>Reset</span>
                </button>

                <button
                  type="button"
                  onClick={exitDemoMode}
                  className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {firebaseUser ? 'Live Mode' : 'Exit Demo'}
                </button>
              </div>
            </div>
          </div>
        )}

        <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
          <div className="px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 text-sm min-w-0">
                <span className="text-slate-500 hidden sm:inline whitespace-nowrap">
                  Campus Bus Connect
                </span>
                <span className="text-slate-300 hidden sm:inline">/</span>
                <h1 className="font-display font-semibold text-slate-900 truncate">
                  {activeLabel}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {(role === 'tdc' || role === 'hod') && onOpenAddBus && (
                <button
                  type="button"
                  onClick={onOpenAddBus}
                  className="min-h-[40px] px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>Add Bus</span>
                </button>
              )}

              {role === 'faculty' && activeTab !== 'faculty_access' && (
                <button
                  type="button"
                  onClick={() => onSelectTab('faculty_access')}
                  className="min-h-[40px] px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Detailed Access
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
