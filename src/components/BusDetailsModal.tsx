import { useEffect, useState } from 'react';
import { Lock, Phone, ShieldAlert, Truck, X } from 'lucide-react';
import { fetchRestrictedBusDetail } from '../services/busService';
import type { BusRestrictedDetail, BusSchedule } from '../types/campus';

interface BusDetailsModalProps {
  bus: BusSchedule;
  onClose: () => void;
}

export function BusDetailsModal({ bus, onClose }: BusDetailsModalProps) {
  const [detail, setDetail] = useState<BusRestrictedDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetchRestrictedBusDetail(bus.id)
      .then((data) => {
        if (active) {
          setDetail(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Access denied or unable to load restricted bus details.'
          );
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [bus.id]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bus-detail-title"
    >
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-blue-700">Restricted Fleet Record</p>
            <h2
              id="bus-detail-title"
              className="font-display text-lg font-bold text-slate-900 truncate"
            >
              <span className="font-mono tabular-nums">{bus.busNumber}</span> — {bus.routeName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Route & Timing Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-5 border-b border-slate-200 text-sm">
            <div>
              <p className="text-xs font-medium text-slate-500">Morning Shift</p>
              <p className="font-mono tabular-nums text-slate-900 font-medium mt-0.5">
                {bus.morningShiftActive
                  ? `${bus.morningPickupTime || '—'} → Campus ${bus.morningCampusArrival || '—'}`
                  : 'Not Operating'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Afternoon Shift</p>
              <p className="font-mono tabular-nums text-slate-900 font-medium mt-0.5">
                {bus.afternoonShiftActive
                  ? `Campus ${bus.afternoonCampusDeparture || '—'} → ${bus.afternoonDropTime || '—'}`
                  : 'Not Operating'}
              </p>
            </div>
            {bus.routeStops.length > 0 && (
              <div className="sm:col-span-2">
                <p className="text-xs font-medium text-slate-500">Route Stops</p>
                <p className="text-sm text-slate-800 mt-0.5">{bus.routeStops.join(' · ')}</p>
              </div>
            )}
          </div>

          {/* Restricted Details */}
          {loading && (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-16 bg-slate-100 rounded" />
              <div className="h-16 bg-slate-100 rounded" />
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs text-red-800">
                <p className="font-semibold">Access Restricted by Firestore Security Rules</p>
                <p className="break-all">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && !detail && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-600 flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-slate-500 shrink-0" />
              <span>No restricted vehicle or driver details have been added for this bus yet.</span>
            </div>
          )}

          {!loading && !error && detail && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-medium text-slate-500">Driver Name</p>
                  <p className="font-medium text-slate-900 mt-0.5">{detail.driverName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Driver Contact</p>
                  <p className="font-mono tabular-nums text-slate-900 mt-0.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{detail.driverContact}</span>
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500">Conductor / Attendant</p>
                  <p className="font-medium text-slate-900 mt-0.5">
                    {detail.conductorName || 'Not assigned'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Conductor Contact</p>
                  <p className="font-mono tabular-nums text-slate-900 mt-0.5">
                    {detail.conductorContact || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500">Vehicle Registration</p>
                  <p className="font-mono tabular-nums font-medium text-slate-900 mt-0.5 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-slate-400" />
                    <span>{detail.vehicleRegistration}</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Seating Capacity</p>
                  <p className="font-mono tabular-nums text-slate-900 mt-0.5">
                    {detail.seatingCapacity} seats
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500">Permit Number</p>
                  <p className="font-mono tabular-nums text-slate-900 mt-0.5">
                    {detail.permitNumber || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Insurance Valid Till</p>
                  <p className="font-mono tabular-nums text-slate-900 mt-0.5">
                    {detail.insuranceExpiry || '—'}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-slate-500">Emergency Transport Contact</p>
                  <p className="font-mono tabular-nums text-slate-900 mt-0.5">
                    {detail.emergencyContact || '—'}
                  </p>
                </div>

                {detail.operationalNotes && (
                  <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                    <p className="text-xs font-medium text-slate-500">Operational Notes</p>
                    <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                      {detail.operationalNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
