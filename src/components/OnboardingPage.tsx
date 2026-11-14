import React, { useEffect, useState } from 'react';
import { LogOut, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FIELD_LIMITS, ROLE_LABELS, type UserRole } from '../types/campus';

export function OnboardingPage() {
  const { firebaseUser, preassigned, isBootstrappedDirector, completeOnboarding, logout } =
    useAuth();

  const lockedRole: UserRole | null = isBootstrappedDirector
    ? 'hod'
    : preassigned
      ? preassigned.role
      : null;

  const [displayName, setDisplayName] = useState(firebaseUser?.displayName ?? '');
  const [role, setRole] = useState<UserRole>(lockedRole ?? 'student');
  const [department, setDepartment] = useState(preassigned?.department ?? '');
  const [identifier, setIdentifier] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lockedRole) {
      setRole(lockedRole);
    }
    if (preassigned?.department) {
      setDepartment(preassigned.department);
    }
  }, [lockedRole, preassigned?.department]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!displayName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!department.trim()) {
      setError('Please enter your department or office.');
      return;
    }

    setSubmitting(true);
    try {
      await completeOnboarding({
        displayName,
        role: lockedRole ?? role,
        department,
        identifier,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <span className="font-display text-lg font-bold text-slate-900 whitespace-nowrap">
            CAMPUS BUS CONNECT
          </span>
          <button
            type="button"
            onClick={logout}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-lg bg-white border border-slate-200 rounded-xl p-8 space-y-6"
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-blue-700 text-xs font-semibold">
              <UserCheck className="w-4 h-4" />
              <span>Account Registration</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-900">
              Complete your campus profile
            </h1>
            <p className="text-sm text-slate-600">
              Signed in as <span className="font-medium text-slate-900">{firebaseUser?.email}</span>
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg p-3"
            >
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                maxLength={FIELD_LIMITS.DISPLAY_NAME_MAX}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g., Aarav Sharma"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Portal Role
              </label>
              {lockedRole ? (
                <div className="px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium flex items-center justify-between">
                  <span>{ROLE_LABELS[lockedRole]}</span>
                  <span className="text-xs text-blue-700 font-normal">
                    {isBootstrappedDirector ? 'Director Account' : 'Pre-assigned by HOD'}
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {(['student', 'faculty'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setRole(option)}
                      className={`px-4 py-2.5 text-sm font-medium rounded-lg border text-left transition-colors cursor-pointer ${
                        role === option
                          ? 'bg-blue-50 border-blue-700 text-blue-900'
                          : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {ROLE_LABELS[option]}
                    </button>
                  ))}
                </div>
              )}
              {!lockedRole && (
                <p className="text-xs text-slate-500 mt-1.5">
                  TDC and HOD / Director roles are granted by institutional role assignment.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Department / Office
                </label>
                <input
                  type="text"
                  required
                  maxLength={FIELD_LIMITS.DEPARTMENT_MAX}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g., Computer Science"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {role === 'student' ? 'Roll Number' : 'Employee / Staff ID'}
                </label>
                <input
                  type="text"
                  maxLength={FIELD_LIMITS.IDENTIFIER_MAX}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={role === 'student' ? 'e.g., 0827CS221045' : 'e.g., FAC-204'}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[44px] px-4 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            {submitting ? 'Saving profile...' : 'Save & Open Dashboard'}
          </button>
        </form>
      </main>
    </div>
  );
}
