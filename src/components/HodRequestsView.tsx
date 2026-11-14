import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock, ShieldCheck, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDemo } from '../context/DemoContext';
import { reviewFacultyRequest, subscribeAllFacultyRequests } from '../services/requestService';
import {
  FIELD_LIMITS,
  type FacultyAccessRequest,
  type FacultyRequestStatus,
} from '../types/campus';

export function HodRequestsView() {
  const { firebaseUser, profile } = useAuth();
  const { isDemoMode, demoProfile, demoRequests, reviewDemoFacultyRequest } = useDemo();

  const [liveRequests, setLiveRequests] = useState<FacultyAccessRequest[]>([]);
  const [loading, setLoading] = useState(!isDemoMode);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | FacultyRequestStatus>('all');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyUid, setBusyUid] = useState<string | null>(null);

  useEffect(() => {
    if (isDemoMode) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeAllFacultyRequests(
      (items) => {
        setLiveRequests(items);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [isDemoMode]);

  const requests = isDemoMode ? demoRequests : liveRequests;

  const filtered = useMemo(() => {
    if (filter === 'all') return requests;
    return requests.filter((r) => r.status === filter);
  }, [requests, filter]);

  const handleDecision = async (facultyUid: string, decision: 'approved' | 'rejected') => {
    setBusyUid(facultyUid);
    setError(null);
    try {
      if (isDemoMode) {
        reviewDemoFacultyRequest({
          facultyUid,
          decision,
          reviewerUid: demoProfile.uid,
          reviewerName: demoProfile.displayName,
          reviewNote: notes[facultyUid] ?? '',
        });
      } else if (firebaseUser && profile) {
        await reviewFacultyRequest({
          facultyUid,
          decision,
          reviewerUid: firebaseUser.uid,
          reviewerName: profile.displayName,
          reviewNote: notes[facultyUid] ?? '',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update request status.');
    } finally {
      setBusyUid(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-display text-2xl font-bold text-slate-900">
            Faculty Access Requests
          </h2>
          <p className="text-sm text-slate-600">
            Approve or reject faculty requests to access restricted bus vehicle and driver records.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors cursor-pointer ${
                filter === tab
                  ? 'bg-white text-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg p-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-sm text-slate-500">
          Loading faculty requests...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-2">
          <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="font-display text-base font-semibold text-slate-900">
            No {filter === 'all' ? '' : filter} requests found
          </p>
          <p className="text-sm text-slate-500">
            Requests submitted by faculty members will appear here for approval.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <div
              key={req.facultyUid}
              className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base font-bold text-slate-900">
                      {req.facultyName}
                    </h3>
                    <span className="text-xs text-slate-500">·</span>
                    <span className="text-xs font-mono text-slate-600">{req.employeeId}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {req.facultyEmail} · {req.department}
                  </p>
                </div>

                <RequestStatusBadge status={req.status} />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-sm text-slate-700">
                {req.reason}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                <input
                  type="text"
                  maxLength={FIELD_LIMITS.REVIEW_NOTE_MAX}
                  value={notes[req.facultyUid] ?? req.reviewNote ?? ''}
                  onChange={(e) =>
                    setNotes((prev) => ({ ...prev, [req.facultyUid]: e.target.value }))
                  }
                  placeholder="Optional review note..."
                  className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                />

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={busyUid === req.facultyUid || req.status === 'approved'}
                    onClick={() => handleDecision(req.facultyUid, 'approved')}
                    className="min-h-[38px] px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-45 rounded-lg transition-colors cursor-pointer"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busyUid === req.facultyUid || req.status === 'rejected'}
                    onClick={() => handleDecision(req.facultyUid, 'rejected')}
                    className="min-h-[38px] px-4 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 disabled:opacity-45 rounded-lg transition-colors cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RequestStatusBadge({ status }: { status: FacultyRequestStatus }) {
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span>Approved</span>
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700">
        <XCircle className="w-4 h-4 shrink-0" />
        <span>Rejected</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
      <Clock className="w-4 h-4 shrink-0" />
      <span>Pending</span>
    </span>
  );
}
