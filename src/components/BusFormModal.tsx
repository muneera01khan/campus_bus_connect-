import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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
  const isEditing = Boolean(existingBus);

  const [busNumber, setBusNumber] = useState(existingBus?.busNumber ?? '');
  const [routeName, setRouteName] = useState(existingBus?.routeName ?? '');
  const [stopsText, setStopsText] = useState(existingBus?.routeStops.join(', ') ?? '');
  const [morningShiftActive, setMorningShiftActive] = useState(
    existingBus?.morningShiftActive ?? true
  );
  const [morningPickupTime, setMorningPickupTime] = useState(
    existingBus?.morningPickupTime ?? '07:15 AM'
  );
  const [morningCampusArrival, setMorningCampusArrival] = useState(
    existingBus?.morningCampusArrival ?? '08:20 AM'
  );
  const [afternoonShiftActive, setAfternoonShiftActive] = useState(
    existingBus?.afternoonShiftActive ?? true
  );
  const [afternoonCampusDeparture, setAfternoonCampusDeparture] = useState(
    existingBus?.afternoonCampusDeparture ?? '04:30 PM'
  );
  const [afternoonDropTime, setAfternoonDropTime] = useState(
    existingBus?.afternoonDropTime ?? '05:35 PM'
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
  }, [existingBus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setError(null);

    if (!busNumber.trim() || !routeName.trim()) {
      setError('Bus number and route name are required.');
      return;
    }
    if (!driverName.trim() || !driverContact.trim() || !vehicleRegistration.trim()) {
      setError('Driver name, driver contact, and vehicle registration are required.');
      return;
    }

    const parsedStops = stopsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, FIELD_LIMITS.ROUTE_STOPS_MAX_COUNT);

    setSaving(true);
    try {
      await saveBusRecord({
        busId: existingBus?.id,
        updatedBy: firebaseUser.uid,
        schedule: {
          busNumber,
          routeName,
          routeStops: parsedStops,
          morningShiftActive,
          morningPickupTime: morningShiftActive ? morningPickupTime : '',
          morningCampusArrival: morningShiftActive ? morningCampusArrival : '',
          afternoonShiftActive,
          afternoonCampusDeparture: afternoonShiftActive ? afternoonCampusDeparture : '',
          afternoonDropTime: afternoonShiftActive ? afternoonDropTime : '',
          status,
        },
        detail: {
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
        },
      });
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
              1. Route & Shift Schedule (Visible to Students & Staff)
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
                  placeholder="BUS-101"
                  className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Route Name *
                </label>
                <input
                  type="text"
                  required
                  maxLength={FIELD_LIMITS.ROUTE_NAME_MAX}
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  placeholder="Vijay Nagar Square — Campus Main Gate"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Route Stops (comma-separated, max 15)
                </label>
                <input
                  type="text"
                  value={stopsText}
                  onChange={(e) => setStopsText(e.target.value)}
                  placeholder="Vijay Nagar, LIG Square, Palasia, Campus Gate"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Schedule Status
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
                <label className="flex items-center justify-between text-sm font-semibold text-slate-900 cursor-pointer">
                  <span>Morning Shift</span>
                  <input
                    type="checkbox"
                    checked={morningShiftActive}
                    onChange={(e) => setMorningShiftActive(e.target.checked)}
                    className="w-4 h-4 accent-blue-700"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">First Pickup</label>
                    <input
                      type="text"
                      disabled={!morningShiftActive}
                      maxLength={FIELD_LIMITS.TIME_MAX}
                      value={morningPickupTime}
                      onChange={(e) => setMorningPickupTime(e.target.value)}
                      placeholder="07:15 AM"
                      className="w-full px-2.5 py-1.5 text-sm font-mono bg-white disabled:bg-slate-100 border border-slate-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Campus Arrival</label>
                    <input
                      type="text"
                      disabled={!morningShiftActive}
                      maxLength={FIELD_LIMITS.TIME_MAX}
                      value={morningCampusArrival}
                      onChange={(e) => setMorningCampusArrival(e.target.value)}
                      placeholder="08:20 AM"
                      className="w-full px-2.5 py-1.5 text-sm font-mono bg-white disabled:bg-slate-100 border border-slate-300 rounded-md"
                    />
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                <label className="flex items-center justify-between text-sm font-semibold text-slate-900 cursor-pointer">
                  <span>Afternoon Shift</span>
                  <input
                    type="checkbox"
                    checked={afternoonShiftActive}
                    onChange={(e) => setAfternoonShiftActive(e.target.checked)}
                    className="w-4 h-4 accent-blue-700"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Campus Departure</label>
                    <input
                      type="text"
                      disabled={!afternoonShiftActive}
                      maxLength={FIELD_LIMITS.TIME_MAX}
                      value={afternoonCampusDeparture}
                      onChange={(e) => setAfternoonCampusDeparture(e.target.value)}
                      placeholder="04:30 PM"
                      className="w-full px-2.5 py-1.5 text-sm font-mono bg-white disabled:bg-slate-100 border border-slate-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Final Drop</label>
                    <input
                      type="text"
                      disabled={!afternoonShiftActive}
                      maxLength={FIELD_LIMITS.TIME_MAX}
                      value={afternoonDropTime}
                      onChange={(e) => setAfternoonDropTime(e.target.value)}
                      placeholder="05:35 PM"
                      className="w-full px-2.5 py-1.5 text-sm font-mono bg-white disabled:bg-slate-100 border border-slate-300 rounded-md"
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
