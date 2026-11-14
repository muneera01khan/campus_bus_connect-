import { Bus, Clock, FileCheck2, FlaskConical, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDemo } from '../context/DemoContext';

export function LoginPage() {
  const { loginWithGoogle, authError } = useAuth();
  const { enterDemoMode } = useDemo();
  const [signingIn, setSigningIn] = useState(false);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await loginWithGoogle();
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <header className="w-full border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            CAMPUS BUS CONNECT
          </span>
          <span className="text-sm text-slate-500 hidden sm:inline whitespace-nowrap shrink-0">
            College Transport Portal
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <section className="lg:col-span-7 flex flex-col justify-center space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-medium text-blue-700 tracking-wide">
                Institutional Transit Directory
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight [text-wrap:balance]">
                Campus bus schedules, shifts, and transport permissions in one portal.
              </h1>
              <p className="text-base text-slate-600 leading-relaxed max-w-xl">
                Sign in with your verified Google account to view daily bus routes and shift
                timings, submit faculty access requests, or manage college fleet schedules.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Bus className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>Students</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Read-only access to bus numbers, routes, First Shift and Second Shift college
                  entry/exit timings, and bus status.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <FileCheck2 className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>Faculty</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Request access to restricted vehicle & driver records, track approval status, and
                  view details once approved.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>HOD / Director</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Review and approve or reject faculty requests, assign roles, and oversee bus
                  records.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Clock className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>TDC</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Add buses, update routes, and manage First Shift and Second Shift college entry
                  and exit timings.
                </p>
              </div>
            </div>
          </section>

          <section className="lg:col-span-5 flex items-center">
            <div className="w-full bg-white border border-slate-200 rounded-xl p-8 space-y-5">
              <div className="space-y-2">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  Sign in to continue
                </h2>
                <p className="text-sm text-slate-600">
                  Authentication is secured via Firebase Authentication and Firestore Security
                  Rules.
                </p>
              </div>

              {authError && (
                <div
                  role="alert"
                  className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg p-3 leading-relaxed break-words"
                >
                  {authError}
                </div>
              )}

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={signingIn}
                  className="w-full min-h-[44px] px-4 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81Z"
                    />
                  </svg>
                  <span className="whitespace-nowrap">
                    {signingIn ? 'Signing in...' : 'Continue with Google'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => enterDemoMode('student')}
                  className="w-full min-h-[44px] px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FlaskConical className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">Try Hackathon Demo Mode</span>
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                <p>
                  Every Google sign-in registers your account in Firestore with the default Student
                  role unless assigned another role by an administrator.
                </p>
                <p>Demo Mode uses isolated sample data and never alters Firebase records.</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>CAMPUS BUS CONNECT</span>
          <span>Role-Based Transport Information Portal</span>
        </div>
      </footer>
    </div>
  );
}
