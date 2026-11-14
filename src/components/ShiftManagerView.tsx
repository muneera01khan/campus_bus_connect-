import { useState } from 'react';
import { Clock, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDemo } from '../context/DemoContext';
import { updateBusShifts } from '../services/busService';
import { FIELD_LIMITS, type BusSchedule } from '../types/campus';

interface ShiftManagerViewProps {
  buses: BusSchedule[];
}

interface ShiftDraft {
  firstShiftEntry: string;
  firstShiftExit: string;
  secondShiftEntry: string;
  secondShiftExit: string;
}

export function ShiftManagerView({ buses }: ShiftManagerViewProps) {
  const { firebaseUser } = useAuth();
  const { isDemoMode, demoProfile, updateDemoBusShifts } = useDemo();
  const [drafts, setDrafts] = useState<Record<string, ShiftDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getDraft = (bus: BusSchedule): ShiftDraft =>
    drafts[bus.id] ?? {
      firstShiftEntry: bus.firstShiftEntry,
      firstShiftExit: bus.firstShiftExit,
      secondShiftEntry: bus.secondShiftEntry,
      secondShiftExit: bus.secondShiftExit,
    };

  const updateDraft = (bus: BusSchedule, patch: Partial<ShiftDraft>) => {
    const current = getDraft(bus);
    setDrafts((prev) => ({
      ...prev,
      [bus.id]: { ...current, ...patch },
    }));
  };

  const handleSave = async (bus: BusSchedule) => {
    const actorUid = isDemoMode ? demoProfile.uid : firebaseUser?.uid;
    if (!actorUid) return;
    const draft = getDraft(bus);
    setError(null);
    setSavedId(null);

    if (
      !draft.firstShiftEntry.trim() ||
      !draft.firstShiftExit.trim() ||
      !draft.secondShiftEntry.trim() ||
      !draft.secondShiftExit.trim()
    ) {
      setError('All four shift timings (Entry and Exit for both shifts) are required.');
      return;
    }

    setSavingId(bus.id);

    const payload = {
      busId: bus.id,
      firstShiftEntry: draft.firstShiftEntry,
      firstShiftExit: draft.firstShiftExit,
      secondShiftEntry: draft.secondShiftEntry,
      secondShiftExit: draft.secondShiftExit,
      updatedBy: actorUid,
    };

    try {
      if (isDemoMode) {
        updateDemoBusShifts(payload);
      } else {
        await updateBusShifts(payload);
      }
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
          First & Second Shift Manager
        </h2>
        <p className="text-sm text-slate-600">
          Update First Shift and Second Shift college entry and exit timings across all buses.
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
                      <span>{isSaving ? 'Saving...' : 'Save Timings'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-slate-200 rounded-lg p-3.5 space-y-3">
                    <p className="text-xs font-semibold text-slate-800">First Shift</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">
                          College Entry Time
                        </label>
                        <input
                          type="text"
                          maxLength={FIELD_LIMITS.TIME_MAX}
                          value={draft.firstShiftEntry}
                          onChange={(e) =>
                            updateDraft(bus, { firstShiftEntry: e.target.value })
                          }
                          placeholder="08:00 AM"
                          className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">
                          College Exit Time
                        </label>
                        <input
                          type="text"
                          maxLength={FIELD_LIMITS.TIME_MAX}
                          value={draft.firstShiftExit}
                          onChange={(e) =>
                            updateDraft(bus, { firstShiftExit: e.target.value })
                          }
                          placeholder="02:40 PM"
                          className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-700"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-3.5 space-y-3">
                    <p className="text-xs font-semibold text-slate-800">Second Shift</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">
                          College Entry Time
                        </label>
                        <input
                          type="text"
                          maxLength={FIELD_LIMITS.TIME_MAX}
                          value={draft.secondShiftEntry}
                          onChange={(e) =>
                            updateDraft(bus, { secondShiftEntry: e.target.value })
                          }
                          placeholder="10:30 AM"
                          className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">
                          College Exit Time
                        </label>
                        <input
                          type="text"
                          maxLength={FIELD_LIMITS.TIME_MAX}
                          value={draft.secondShiftExit}
                          onChange={(e) =>
                            updateDraft(bus, { secondShiftExit: e.target.value })
                          }
                          placeholder="05:35 PM"
                          className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-700"
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
