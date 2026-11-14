import React, { useState } from 'react';
import {
  Bus,
  Clock,
  FileCheck2,
  LogOut,
  Menu,
  Plus,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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
  const { profile, logout, isBootstrappedDirector, switchDirectorTestRole } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);

  if (!profile) return null;

  const role = profile.role;

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
      label: 'User Roles',
      icon: <Users className="w-4 h-4 shrink-0" />,
      visible: role === 'hod',
    },
  ];
  const navItems = allNavItems.filter((item) => item.visible);

  const activeLabel = navItems.find((i) => i.id === activeTab)?.label ?? 'Dashboard';

  const handleRoleSwitch = async (nextRole: UserRole) => {
    setSwitchingRole(true);
    try {
      await switchDirectorTestRole(nextRole);
      onSelectTab('schedules');
    } finally {
      setSwitchingRole(false);
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
          <p className="text-sm font-semibold text-slate-900 truncate">{profile.displayName}</p>
          <p className="text-xs text-slate-500 truncate">{profile.email}</p>
          <p className="text-xs font-medium text-blue-700 pt-0.5">
            {ROLE_LABELS[profile.role]}
            {profile.department ? ` · ${profile.department}` : ''}
          </p>
        </div>

        {isBootstrappedDirector && (
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <label
              htmlFor="director-role-switch"
              className="block text-[11px] font-medium text-slate-500"
            >
              Active Role (Director Test Switch)
            </label>
            <select
              id="director-role-switch"
              value={profile.role}
              disabled={switchingRole}
              onChange={(e) => handleRoleSwitch(e.target.value as UserRole)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:border-blue-700"
            >
              <option value="hod">HOD / Director</option>
              <option value="tdc">TDC</option>
              <option value="faculty">Faculty</option>
              <option value="student">Student</option>
            </select>
          </div>
        )}

        <button
          type="button"
          onClick={logout}
          className="w-full min-h-[40px] px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          <span>Sign Out</span>
        </button>
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
