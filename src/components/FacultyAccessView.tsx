import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Lock, Send, ShieldAlert, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchRestrictedBusDetail } from '../services/busService';
import { submitFacultyRequest } from '../services/requestService';
import {
  FIELD_LIMITS,
  type BusRestrictedDetail,
  type BusSchedule,
} from '../types/campus';

interface FacultyAccessViewProps {
  buses: BusSchedule[];
}

export function FacultyAccessView({ buses }: FacultyAccessViewProps) {
  const { firebaseUser, profile, myFacultyRequest } = useAuth();

  const [department, setDepartment] = useState(
    myFacultyRequest?.department || profile?.department || ''
  );
  const [employeeId, setEmployeeId] = useState(
    myFacultyRequest?.employeeId || profile?.identifier || ''
  );
  const [reason, setReason] = useState(myFacultyRequest?.reason || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [detailsMap, setDetailsMap] = useState<Record<string, BusRestrictedDetail | null>>({});
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const status = myFacultyRequest?.status;
  const isApproved = status === 'approved';
  const isPending = status === 'pending';
  const isRejected = status === 'rejected';

  useEffect(() => {
    if (myFacultyRequest) {
      setDepartment(myFacultyRequest.department);
      setEmployeeId(myFacultyRequest.employeeId);
      setReason(myFacultyRequest.reason);
    }
  }, [myFacultyRequest]);

  useEffect(() => {
    if (!isApproved || buses.length === 0) {
      setDetailsMap({});
      return;
    }

    let active = true;
    setLoadingDetails(true);
    setDetailsError(null);

    Promise.all(
      buses.map(async (bus) => {
        const detail = await fetchRestrictedBusDetail(bus.id);
        return [bus.id, detail] as const;
      })
    )
      .then((entries) => {
        if (!active) return;
        const map: Record<string, BusRestrictedDetail | null> = {};
        for (const [id, detail] of entries) {
          map[id] = detail;
        }
        setDetailsMap(map);
        setLoadingDetails(false);
      })
      .catch((err) => {
        if (!active) return;
        setDetailsError(err instanceof Error ? err.message : 'Unable to fetch restricted details.');
        setLoadingDetails(false);
      });

    return () => {
      active = false;
    };
  }, [isApproved, buses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !profile) return;
    setError(null);
    setSuccessMessage(null);

    if (reason.trim().length < FIELD_LIMITS.REASON_MIN) {
      setError(`Please provide a reason of at least ${FIELD_LIMITS.REASON_MIN} characters.`);
      return;
    }

    setSubmitting(true);
    try {
      await submitFacultyRequest({
        facultyUid: firebaseUser.uid,
        facultyName: profile.displayName,
        facultyEmail: profile.email,
        department,
        employeeId: employeeId || 'FAC-STAFF',
        reason,
        isResubmit: Boolean(myFacultyRequest && isRejected),
      });
      setSuccessMessage('Access request submitted for HOD / Director review.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit access request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-bold text-slate-900">
          Faculty Detailed Bus Access
        </h2>
        <p className="text-sm text-slate-600">
          Driver contacts, vehicle registration, permits, and seating capacity are restricted and
          unlocked only after HOD / Director approval.
        </p>
      </div>

      {/* Status Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-slate-500">Current Request Status</p>
            <div className="flex items-center gap-2">
              {!myFacultyRequest && (
                <>
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span className="font-display text-lg font-bold text-slate-900">
                    Not Requested
                  </span>
                </>
              )}
              {isPending && (
                <>
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span className="font-display text-lg font-bold text-amber-800">
                    Pending HOD / Director Review
                  </span>
                </>
              )}
              {isApproved && (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span className="font-display text-lg font-bold text-emerald-800">Approved</span>
                </>
              )}
              {isRejected && (
                <>
                  <XCircle className="w-4 h-4 text-red-700" />
                  <span className="font-display text-lg font-bold text-red-800">Rejected</span>
                </>
              )}
            </div>
          </div>

          {myFacultyRequest?.reviewerName && (
            <div className="text-xs text-slate-500 sm:text-right">
              <p>Reviewed by: {myFacultyRequest.reviewerName}</p>
              {myFacultyRequest.reviewNote && (
                <p className="text-slate-700 mt-0.5">Note: {myFacultyRequest.reviewNote}</p>
              )}
            </div>
          )}
        </div>

        {/* Request Form (shown if no request yet or if rejected for resubmission) */}
        {(!myFacultyRequest || isRejected) && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRejected && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                Your previous request was rejected. You may update your justification and resubmit
                for review.
              </p>
            )}

            {error && (
              <div
                role="alert"
                className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg p-3"
              >
                {error}
              </div>
            )}

            {successMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg p-3">
                {successMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department *
                </label>
                <input
                  type="text"
                  required
                  maxLength={FIELD_LIMITS.DEPARTMENT_MAX}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g., Information Technology"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Faculty / Employee ID *
                </label>
                <input
                  type="text"
                  required
                  maxLength={FIELD_LIMITS.IDENTIFIER_MAX}
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g., FAC-108"
                  className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Purpose / Justification *
              </label>
              <textarea
                rows={3}
                required
                minLength={FIELD_LIMITS.REASON_MIN}
                maxLength={FIELD_LIMITS.REASON_MAX}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why you need access to driver contact numbers, vehicle registration, and permit details..."
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="min-h-[42px] px-5 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-sm font-semibold rounded-lg inline-flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>
                {submitting
                  ? 'Submitting...'
                  : isRejected
                    ? 'Resubmit Request'
                    : 'Submit Access Request'}
              </span>
            </button>
          </form>
        )}

        {isPending && myFacultyRequest && (
          <div className="text-sm text-slate-700 space-y-2">
            <p>
              Your request is awaiting review by an HOD or Director. Restricted bus information
              remains locked until approval.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs space-y-1">
              <p className="font-semibold text-slate-800">
                Submitted Reason ({myFacultyRequest.department} · {myFacultyRequest.employeeId})
              </p>
              <p className="text-slate-600">{myFacultyRequest.reason}</p>
            </div>
          </div>
        )}
      </div>

      {/* Approved Restricted Fleet Records */}
      {isApproved && (
        <div className="space-y-4">
          <h3 className="font-display text-lg font-bold text-slate-900">
            Restricted Fleet & Crew Directory
          </h3>

          {detailsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2.5 text-xs text-red-800">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{detailsError}</span>
            </div>
          )}

          {loadingDetails ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-sm text-slate-500">
              Loading approved restricted bus records...
            </div>
          ) : buses.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-sm text-slate-500">
              No buses are currently registered in the fleet.
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-4">Bus No.</th>
                      <th className="py-3 px-4">Vehicle Reg.</th>
                      <th className="py-3 px-4">Driver & Contact</th>
                      <th className="py-3 px-4">Conductor</th>
                      <th className="py-3 px-4">Capacity</th>
                      <th className="py-3 px-4">Permit / Insurance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {buses.map((bus) => {
                      const d = detailsMap[bus.id];
                      return (
                        <tr key={bus.id} className="hover:bg-slate-50/70 align-top">
                          <td className="py-3.5 px-4 font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                            {bus.busNumber}
                          </td>
                          <td className="py-3.5 px-4 font-mono tabular-nums text-slate-800 whitespace-nowrap">
                            {d?.vehicleRegistration || '—'}
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-medium text-slate-900">{d?.driverName || '—'}</p>
                            <p className="text-xs font-mono tabular-nums text-slate-500">
                              {d?.driverContact || '—'}
                            </p>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="text-slate-800">{d?.conductorName || '—'}</p>
                            <p className="text-xs font-mono tabular-nums text-slate-500">
                              {d?.conductorContact || ''}
                            </p>
                          </td>
                          <td className="py-3.5 px-4 font-mono tabular-nums text-slate-800 whitespace-nowrap">
                            {d ? `${d.seatingCapacity} seats` : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-600">
                            <p className="font-mono tabular-nums">{d?.permitNumber || '—'}</p>
                            <p className="font-mono tabular-nums text-slate-500">
                              {d?.insuranceExpiry ? `Exp: ${d.insuranceExpiry}` : ''}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
