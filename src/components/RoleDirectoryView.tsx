import React, { useEffect, useState } from 'react';
import { Trash2, UserPlus, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDemo } from '../context/DemoContext';
import {
  deleteRoleAssignment,
  saveRoleAssignment,
  subscribeAllUsers,
  subscribeRoleAssignments,
  updateUserRole,
} from '../services/userService';
import {
  FIELD_LIMITS,
  ROLE_LABELS,
  type RoleAssignment,
  type UserProfile,
  type UserRole,
} from '../types/campus';

export function RoleDirectoryView() {
  const { firebaseUser } = useAuth();
  const { isDemoMode, demoUsers } = useDemo();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [assignments, setAssignments] = useState<RoleAssignment[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('tdc');
  const [department, setDepartment] = useState('Transport Office');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isDemoMode) return;
    const unsubUsers = subscribeAllUsers(setUsers, (err) => setError(err.message));
    const unsubAssign = subscribeRoleAssignments(setAssignments, (err) => setError(err.message));
    return () => {
      unsubUsers();
      unsubAssign();
    };
  }, [isDemoMode]);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemoMode || !firebaseUser) return;
    setError(null);
    if (!email.trim() || !email.includes('@')) {
      setError('Enter a valid institutional or Google email address.');
      return;
    }

    setSaving(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      await saveRoleAssignment({
        email: normalizedEmail,
        role,
        department,
        assignedBy: firebaseUser.uid,
      });
      const existingUser = users.find((u) => u.email.toLowerCase() === normalizedEmail);
      if (existingUser && existingUser.role !== role) {
        await updateUserRole(existingUser.uid, role);
      }
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save role assignment.');
    } finally {
      setSaving(false);
    }
  };

  const handleUserRoleChange = async (uid: string, nextRole: UserRole) => {
    if (isDemoMode) return;
    setError(null);
    try {
      await updateUserRole(uid, nextRole);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update user role.');
    }
  };

  if (isDemoMode) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="font-display text-2xl font-bold text-slate-900">
            Institutional Role Directory (Demo)
          </h2>
          <p className="text-sm text-slate-600">
            Use the role switcher in the Demo Mode bar above to test Student, Faculty, HOD /
            Director, and TDC permissions. Live Firebase role assignments are edited in Live Mode.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-600" />
            <h3 className="font-display text-base font-bold text-slate-900">
              Demo Accounts ({demoUsers.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Department / ID</th>
                  <th className="py-3 px-4">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {demoUsers.map((u) => (
                  <tr key={u.uid}>
                    <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                      {u.displayName}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{u.email}</td>
                    <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                      {u.department} · {u.identifier}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-blue-700 whitespace-nowrap">
                      {ROLE_LABELS[u.role]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-bold text-slate-900">
          Institutional Role Management
        </h2>
        <p className="text-sm text-slate-600">
          Pre-assign TDC, HOD / Director, Faculty, or Student roles by email or update registered
          user permissions.
        </p>
      </div>

      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Pre-assign Role Form */}
      <form
        onSubmit={handleAssignSubmit}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <UserPlus className="w-4 h-4 text-blue-700" />
          <span>Pre-assign Role by Email</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Google / College Email *
            </label>
            <input
              type="email"
              required
              maxLength={FIELD_LIMITS.EMAIL_MAX}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="coordinator@college.edu"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Role *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
            >
              <option value="tdc">TDC</option>
              <option value="hod">HOD / Director</option>
              <option value="faculty">Faculty</option>
              <option value="student">Student</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
            <input
              type="text"
              maxLength={FIELD_LIMITS.DEPARTMENT_MAX}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Transport Office"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="min-h-[40px] px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg cursor-pointer"
        >
          {saving ? 'Saving...' : 'Save Pre-assignment'}
        </button>

        {assignments.length > 0 && (
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <p className="text-xs font-semibold text-slate-600">Active Email Pre-assignments</p>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
              {assignments.map((a) => (
                <div
                  key={a.id}
                  className="px-4 py-2.5 flex items-center justify-between gap-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{a.email}</p>
                    <p className="text-xs text-slate-500">
                      {ROLE_LABELS[a.role]}
                      {a.department ? ` · ${a.department}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteRoleAssignment(a.id)}
                    className="p-1.5 text-slate-400 hover:text-red-700 rounded cursor-pointer"
                    aria-label={`Remove ${a.email}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </form>

      {/* Registered Users Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-600" />
          <h3 className="font-display text-base font-bold text-slate-900">
            Registered Portal Users ({users.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Department / ID</th>
                <th className="py-3 px-4">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {users.map((u) => (
                <tr key={u.uid} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                    {u.displayName}
                  </td>
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{u.email}</td>
                  <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                    {u.department || '—'}
                    {u.identifier ? ` · ${u.identifier}` : ''}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <select
                      value={u.role}
                      onChange={(e) => handleUserRoleChange(u.uid, e.target.value as UserRole)}
                      className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-700"
                    >
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                      <option value="tdc">TDC</option>
                      <option value="hod">HOD / Director</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
