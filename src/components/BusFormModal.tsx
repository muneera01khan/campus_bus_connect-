import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDemo } from '../context/DemoContext';
import { fetchRestrictedBusDetail, saveBusRecord } from '../services/busService';
import {
  FIELD_LIMITS,
  type BusSchedule,
  type BusStatus,
} from '../types/campus';

interface BusFormModalProps {
  existingBus?: BusSchedule | null;
  onClose: () => void;
}

export function BusFormModal({ existingBus, onClose }: BusFormModalProps) {
  const { firebaseUser } = useAuth();
  const { isDemoMode, demoProfile, demoBusDetails, saveDemoBus } = useDemo();
  const isEditing = Boolean(existingBus);

  const [busNumber, setBusNumber] = useState(existingBus?.busNumber ?? '');
  const [routeName, setRouteName] = useState(existingBus?.routeName ?? '');
  const [firstShiftEntry, setFirstShiftEntry] = useState(
    existingBus?.firstShiftEntry ?? '08:00 AM'
  );
  const [firstShiftExit, setFirstShiftExit] = useState(
    existingBus?.firstShiftExit ?? '02:40 PM'
  );
  const [secondShiftEntry, setSecondShiftEntry] = useState(
    existingBus?.secondShiftEntry ?? '10:30 AM'
  );
  const [secondShiftExit, setSecondShiftExit] = useState(
    existingBus?.secondShiftExit ?? '05:35 PM'
  );
  const [status, setStatus] = useState<BusStatus>(existingBus?.status ?? 'active');

  // Restricted fields
  const [driverName, setDriverName] = useState('');
  const [driverContact, setDriverContact] = useState('');
  const [conductorName, setConductorName] = useState('');
  const [conductorContact, setConductorContact] = useState('');
  const [vehicleRegistration, setVehicleRegistration] = useState('');
  const [seatingCapacity, setSeatingCapacity] = useState('45');
  const [permitNumber, setPermitNumber] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [operationalNotes, setOperationalNotes] = useState('');

  const [loadingDetails, setLoadingDetails] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!existingBus) return;
    let active = true;
    setLoadingDetails(true);

    if (isDemoMode || existingBus.isDemo) {
      const detail = demoBusDetails[existingBus.id];
      if (detail) {
        setDriverName(detail.driverName);
        setDriverContact(detail.driverContact);
        setConductorName(detail.conductorName);
        setConductorContact(detail.conductorContact);
        setVehicleRegistration(detail.vehicleRegistration);
        setSeatingCapacity(String(detail.seatingCapacity));
        setPermitNumber(detail.permitNumber);
        setInsuranceExpiry(detail.insuranceExpiry);
        setEmergencyContact(detail.emergencyContact);
        setOperationalNotes(detail.operationalNotes);
      }
      setLoadingDetails(false);
      return;
    }

    fetchRestrictedBusDetail(existingBus.id)
      .then((detail) => {
        if (!active) return;
        if (detail) {
          setDriverName(detail.driverName);
          setDriverContact(detail.driverContact);
          setConductorName(detail.conductorName);
          setConductorContact(detail.conductorContact);
          setVehicleRegistration(detail.vehicleRegistration);
          setSeatingCapacity(String(detail.seatingCapacity));
          setPermitNumber(detail.permitNumber);
          setInsuranceExpiry(detail.insuranceExpiry);
          setEmergencyContact(detail.emergencyContact);
          setOperationalNotes(detail.operationalNotes);
        }
        setLoadingDetails(false);
      })
      .catch(() => {
        if (active) setLoadingDetails(false);
      });

    return () => {
      active = false;
    };
  }, [existingBus, isDemoMode, demoBusDetails]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const actorUid = isDemoMode ? demoProfile.uid : firebaseUser?.uid;
    if (!actorUid) return;
    setError(null);

    if (!busNumber.trim() || !routeName.trim()) {
      setError('Bus number and route are required.');
      return;
    }
    if (
      !firstShiftEntry.trim() ||
      !firstShiftExit.trim() ||
      !secondShiftEntry.trim() ||
      !secondShiftExit.trim()
    ) {
      setError('First Shift and Second Shift entry and exit timings are required.');
      return;
    }
    if (!driverName.trim() || !driverContact.trim() || !vehicleRegistration.trim()) {
      setError('Driver name, driver contact, and vehicle registration are required.');
      return;
    }

    const schedulePayload = {
      busNumber,
      routeName,
      firstShiftEntry,
      firstShiftExit,
      secondShiftEntry,
      secondShiftExit,
      status,
    };

    const detailPayload = {
      driverName,
      driverContact,
      conductorName,
      conductorContact,
      vehicleRegistration,
      seatingCapacity: Number.parseInt(seatingCapacity, 10) || 40,
      permitNumber,
      insuranceExpiry,
      emergencyContact,
      operationalNotes,
    };

    setSaving(true);
    try {
      if (isDemoMode) {
        saveDemoBus({
          busId: existingBus?.id,
          updatedBy: actorUid,
          schedule: schedulePayload,
          detail: detailPayload,
        });
      } else {
        await saveBusRecord({
          busId: existingBus?.id,
          updatedBy: actorUid,
          schedule: schedulePayload,
          detail: detailPayload,
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save bus record.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bus-form-title"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <h2 id="bus-form-title" className="font-display text-lg font-bold text-slate-900">
            {isEditing ? `Edit ${existingBus?.busNumber}` : 'Add New Campus Bus'}
          </h2>
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
          {error && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg p-3"
            >
              {error}
            </div>
          )}

          {/* Section 1: Public Schedule */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-200">
              1. Bus Route & Two-Shift Schedule (Visible to Students & Staff)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bus Number *
                </label>
                <input
                  type="text"
                  required
                  maxLength={FIELD_LIMITS.BUS_NUMBER_MAX}
                  value={busNumber}
                  onChange={(e) => setBusNumber(e.target.value)}
                  placeholder="G-01"
                  className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bus Route *
                </label>
                <input
                  type="text"
                  required
                  maxLength={FIELD_LIMITS.ROUTE_NAME_MAX}
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  placeholder="Indore to Campus"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bus Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as BusStatus)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                >
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                <p className="text-sm font-semibold text-slate-900">First Shift</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">
                      College Entry Time *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={FIELD_LIMITS.TIME_MAX}
                      value={firstShiftEntry}
                      onChange={(e) => setFirstShiftEntry(e.target.value)}
                      placeholder="08:00 AM"
                      className="w-full px-2.5 py-1.5 text-sm font-mono bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">
                      College Exit Time *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={FIELD_LIMITS.TIME_MAX}
                      value={firstShiftExit}
                      onChange={(e) => setFirstShiftExit(e.target.value)}
                      placeholder="02:40 PM"
                      className="w-full px-2.5 py-1.5 text-sm font-mono bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-700"
                    />
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                <p className="text-sm font-semibold text-slate-900">Second Shift</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">
                      College Entry Time *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={FIELD_LIMITS.TIME_MAX}
                      value={secondShiftEntry}
                      onChange={(e) => setSecondShiftEntry(e.target.value)}
                      placeholder="10:30 AM"
                      className="w-full px-2.5 py-1.5 text-sm font-mono bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">
                      College Exit Time *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={FIELD_LIMITS.TIME_MAX}
                      value={secondShiftExit}
                      onChange={(e) => setSecondShiftExit(e.target.value)}
                      placeholder="05:35 PM"
                      className="w-full px-2.5 py-1.5 text-sm font-mono bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-700"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Restricted Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-200">
              2. Restricted Vehicle & Crew Details (HOD, TDC & Approved Faculty Only)
            </h3>

            {loadingDetails ? (
              <p className="text-xs text-slate-500">Loading restricted details...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Driver Name *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={FIELD_LIMITS.DRIVER_NAME_MAX}
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Rajesh Verma"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Driver Contact *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={FIELD_LIMITS.CONTACT_MAX}
                    value={driverContact}
                    onChange={(e) => setDriverContact(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Conductor Name
                  </label>
                  <input
                    type="text"
                    maxLength={FIELD_LIMITS.DRIVER_NAME_MAX}
                    value={conductorName}
                    onChange={(e) => setConductorName(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Conductor Contact
                  </label>
                  <input
                    type="text"
                    maxLength={FIELD_LIMITS.CONTACT_MAX}
                    value={conductorContact}
                    onChange={(e) => setConductorContact(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vehicle Registration *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={FIELD_LIMITS.REGISTRATION_MAX}
                    value={vehicleRegistration}
                    onChange={(e) => setVehicleRegistration(e.target.value)}
                    placeholder="MP-09-FA-4821"
                    className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Seating Capacity *
                  </label>
                  <input
                    type="number"
                    required
                    min={FIELD_LIMITS.CAPACITY_MIN}
                    max={FIELD_LIMITS.CAPACITY_MAX}
                    value={seatingCapacity}
                    onChange={(e) => setSeatingCapacity(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Permit Number
                  </label>
                  <input
                    type="text"
                    maxLength={FIELD_LIMITS.PERMIT_MAX}
                    value={permitNumber}
                    onChange={(e) => setPermitNumber(e.target.value)}
                    placeholder="PRM-2026-091"
                    className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Insurance Valid Till
                  </label>
                  <input
                    type="text"
                    maxLength={FIELD_LIMITS.INSURANCE_MAX}
                    value={insuranceExpiry}
                    onChange={(e) => setInsuranceExpiry(e.target.value)}
                    placeholder="2027-03-31"
                    className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Emergency Contact
                  </label>
                  <input
                    type="text"
                    maxLength={FIELD_LIMITS.EMERGENCY_MAX}
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="Transport Desk: +91 731 4730000"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Operational Notes
                  </label>
                  <textarea
                    rows={2}
                    maxLength={FIELD_LIMITS.NOTES_MAX}
                    value={operationalNotes}
                    onChange={(e) => setOperationalNotes(e.target.value)}
                    placeholder="Parking bay, maintenance remarks, or special shift instructions"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || loadingDetails}
            className="min-h-[40px] px-5 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg cursor-pointer"
          >
            {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Bus'}
          </button>
        </div>
      </form>
    </div>
  );
}
