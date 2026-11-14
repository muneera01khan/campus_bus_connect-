import { useState } from 'react';
import { Clock, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateBusShifts } from '../services/busService';
import { FIELD_LIMITS, type BusSchedule } from '../types/campus';

interface ShiftManagerViewProps {
  buses: BusSchedule[];
}

interface ShiftDraft {
  morningShiftActive: boolean;
  morningPickupTime: string;
  morningCampusArrival: string;
  afternoonShiftActive: boolean;
  afternoonCampusDeparture: string;
  afternoonDropTime: string;
}

export function ShiftManagerView({ buses }: ShiftManagerViewProps) {
  const { firebaseUser } = useAuth();
  const [drafts, setDrafts] = useState<Record<string, ShiftDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getDraft = (bus: BusSchedule): ShiftDraft =>
    drafts[bus.id] ?? {
      morningShiftActive: bus.morningShiftActive,
      morningPickupTime: bus.morningPickupTime,
      morningCampusArrival: bus.morningCampusArrival,
      afternoonShiftActive: bus.afternoonShiftActive,
      afternoonCampusDeparture: bus.afternoonCampusDeparture,
      afternoonDropTime: bus.afternoonDropTime,
    };

  const updateDraft = (bus: BusSchedule, patch: Partial<ShiftDraft>) => {
    const current = getDraft(bus);
    setDrafts((prev) => ({
      ...prev,
      [bus.id]: { ...current, ...patch },
    }));
  };

  const handleSave = async (bus: BusSchedule) => {
    if (!firebaseUser) return;
    const draft = getDraft(bus);
    setSavingId(bus.id);
    setError(null);
    setSavedId(null);

    try {
      await updateBusShifts({
        busId: bus.id,
        morningShiftActive: draft.morningShiftActive,
        afternoonShiftActive: draft.afternoonShiftActive,
        morningPickupTime: draft.morningShiftActive ? draft.morningPickupTime : '',
        morningCampusArrival: draft.morningShiftActive ? draft.morningCampusArrival : '',
        afternoonCampusDeparture: draft.afternoonShiftActive
          ? draft.afternoonCampusDeparture
          : '',
        afternoonDropTime: draft.afternoonShiftActive ? draft.afternoonDropTime : '',
        updatedBy: firebaseUser.uid,
      });
      setSavedId(bus.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save shift updates.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-bold text-slate-900">
          Morning & Afternoon Shift Manager
        </h2>
        <p className="text-sm text-slate-600">
          Enable or disable morning and afternoon shifts and update campus arrival and departure
          timings across the fleet.
        </p>
      </div>

      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg p-3">
          {error}
        </div>
      )}

      {buses.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-2">
          <Clock className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="font-display text-base font-semibold text-slate-900">
            No buses to manage yet
          </p>
          <p className="text-sm text-slate-500">
            Use the Add Bus button in the header to register your first campus bus.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {buses.map((bus) => {
            const draft = getDraft(bus);
            const isSaving = savingId === bus.id;
            const isSaved = savedId === bus.id;

            return (
              <div
                key={bus.id}
                className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <span className="font-mono tabular-nums text-sm font-bold text-slate-900">
                      {bus.busNumber}
                    </span>
                    <span className="text-slate-300 mx-2">·</span>
                    <span className="text-sm font-medium text-slate-700">{bus.routeName}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {isSaved && (
                      <span className="text-xs font-medium text-emerald-700">Saved</span>
                    )}
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleSave(bus)}
                      className="min-h-[36px] px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSaving ? 'Saving...' : 'Save Shifts'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-slate-200 rounded-lg p-3.5 space-y-3">
                    <label className="flex items-center justify-between text-xs font-semibold text-slate-800 cursor-pointer">
                      <span>Morning Shift Active</span>
                      <input
                        type="checkbox"
                        checked={draft.morningShiftActive}
                        onChange={(e) =>
                          updateDraft(bus, { morningShiftActive: e.target.checked })
                        }
                        className="w-4 h-4 accent-blue-700"
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">
                          First Pickup
                        </label>
                        <input
                          type="text"
                          disabled={!draft.morningShiftActive}
                          maxLength={FIELD_LIMITS.TIME_MAX}
                          value={draft.morningPickupTime}
                          onChange={(e) =>
                            updateDraft(bus, { morningPickupTime: e.target.value })
                          }
                          placeholder="07:15 AM"
                          className="w-full px-2.5 py-1.5 text-xs font-mono bg-white disabled:bg-slate-100 border border-slate-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">
                          Campus Arrival
                        </label>
                        <input
                          type="text"
                          disabled={!draft.morningShiftActive}
                          maxLength={FIELD_LIMITS.TIME_MAX}
                          value={draft.morningCampusArrival}
                          onChange={(e) =>
                            updateDraft(bus, { morningCampusArrival: e.target.value })
                          }
                          placeholder="08:20 AM"
                          className="w-full px-2.5 py-1.5 text-xs font-mono bg-white disabled:bg-slate-100 border border-slate-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-3.5 space-y-3">
                    <label className="flex items-center justify-between text-xs font-semibold text-slate-800 cursor-pointer">
                      <span>Afternoon Shift Active</span>
                      <input
                        type="checkbox"
                        checked={draft.afternoonShiftActive}
                        onChange={(e) =>
                          updateDraft(bus, { afternoonShiftActive: e.target.checked })
                        }
                        className="w-4 h-4 accent-blue-700"
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">
                          Campus Departure
                        </label>
                        <input
                          type="text"
                          disabled={!draft.afternoonShiftActive}
                          maxLength={FIELD_LIMITS.TIME_MAX}
                          value={draft.afternoonCampusDeparture}
                          onChange={(e) =>
                            updateDraft(bus, { afternoonCampusDeparture: e.target.value })
                          }
                          placeholder="04:30 PM"
                          className="w-full px-2.5 py-1.5 text-xs font-mono bg-white disabled:bg-slate-100 border border-slate-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">Final Drop</label>
                        <input
                          type="text"
                          disabled={!draft.afternoonShiftActive}
                          maxLength={FIELD_LIMITS.TIME_MAX}
                          value={draft.afternoonDropTime}
                          onChange={(e) =>
                            updateDraft(bus, { afternoonDropTime: e.target.value })
                          }
                          placeholder="05:35 PM"
                          className="w-full px-2.5 py-1.5 text-xs font-mono bg-white disabled:bg-slate-100 border border-slate-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
