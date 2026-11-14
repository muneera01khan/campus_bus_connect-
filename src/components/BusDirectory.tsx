import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Bus,
  CheckCircle2,
  Eye,
  Lock,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDemo } from '../context/DemoContext';
import { INITIAL_DEMO_BUSES } from '../data/demoData';
import { deleteBusRecord } from '../services/busService';
import type { BusSchedule } from '../types/campus';
import { BusDetailsModal } from './BusDetailsModal';

interface BusDirectoryProps {
  buses: BusSchedule[];
  loading: boolean;
  error: string | null;
  onEditBus: (bus: BusSchedule) => void;
  onOpenAddBus: () => void;
  onOpenFacultyAccess: () => void;
}

type StatusFilter = 'all' | 'active' | 'maintenance' | 'inactive';

export function BusDirectory({
  buses,
  loading,
  error,
  onEditBus,
  onOpenAddBus,
  onOpenFacultyAccess,
}: BusDirectoryProps) {
  const { profile, myFacultyRequest } = useAuth();
  const { isDemoMode, demoRole, demoMyRequest, deleteDemoBus } = useDemo();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedDetailBus, setSelectedDetailBus] = useState<BusSchedule | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const role = isDemoMode ? demoRole : profile?.role ?? 'student';
  const activeFacultyRequest = isDemoMode ? demoMyRequest : myFacultyRequest;
  const canManageBuses = role === 'tdc' || role === 'hod';
  const canViewRestricted =
    canManageBuses || (role === 'faculty' && activeFacultyRequest?.status === 'approved');

  const showingLiveFallbackDemo =
    !isDemoMode && !loading && buses.length === 0 && (role === 'student' || role === 'faculty');
  const effectiveBuses = showingLiveFallbackDemo ? INITIAL_DEMO_BUSES : buses;

  const filteredBuses = useMemo(() => {
    const q = search.trim().toLowerCase();
    return effectiveBuses.filter((bus) => {
      if (statusFilter !== 'all' && bus.status !== statusFilter) return false;
      if (!q) return true;
      return (
        bus.busNumber.toLowerCase().includes(q) || bus.routeName.toLowerCase().includes(q)
      );
    });
  }, [effectiveBuses, search, statusFilter]);

  const handleDelete = async (busId: string) => {
    setDeleting(true);
    try {
      if (isDemoMode) {
        deleteDemoBus(busId);
      } else {
        await deleteBusRecord(busId);
      }
      setConfirmDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Summary & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-display text-2xl font-bold text-slate-900">
            Campus Bus Routes & Shift Timings
          </h2>
          <p className="text-sm text-slate-600">
            {role === 'student' &&
              'Read-only schedule of bus numbers, routes, First Shift and Second Shift college entry and exit timings.'}
            {role === 'faculty' &&
              (canViewRestricted
                ? 'Your faculty access is approved. Select Details on any bus to inspect driver and vehicle records.'
                : 'Showing public bus schedules. Request HOD/Director approval to unlock restricted driver and vehicle details.')}
            {canManageBuses &&
              'Add and update bus routes, First Shift and Second Shift college entry/exit timings, and fleet records.'}
          </p>
        </div>

        {role === 'faculty' && !canViewRestricted && (
          <button
            type="button"
            onClick={onOpenFacultyAccess}
            className="min-h-[40px] px-4 py-2 text-xs sm:text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {activeFacultyRequest
              ? `Access Request: ${activeFacultyRequest.status.toUpperCase()}`
              : 'Request Detailed Access'}
          </button>
        )}
      </div>

      {showingLiveFallbackDemo && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>
            <strong className="font-mono font-semibold">DEMO SAMPLE SCHEDULES:</strong> Live
            Firestore currently has 0 buses, so sample DEMO schedules are shown below (read-only).
          </span>
        </div>
      )}

      {/* Search + Segmented Status Filter */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by bus number or route..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start overflow-x-auto">
          {(
            [
              { id: 'all', label: 'All Buses' },
              { id: 'active', label: 'Active' },
              { id: 'maintenance', label: 'Maintenance' },
              { id: 'inactive', label: 'Inactive' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-white text-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg p-4 flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="break-all">{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-5 animate-pulse flex items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-200 rounded w-1/4" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
              <div className="h-8 bg-slate-100 rounded w-28" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredBuses.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <Bus className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-base font-semibold text-slate-900">
              {effectiveBuses.length === 0
                ? 'No bus schedules published yet'
                : 'No matching buses found'}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              {effectiveBuses.length === 0
                ? canManageBuses
                  ? 'Add the first college bus route with First Shift and Second Shift timings.'
                  : 'Bus routes and shift schedules added by the Transport Coordinator will appear here.'
                : 'Try clearing your search query or selecting a different status filter.'}
            </p>
          </div>
          {effectiveBuses.length === 0 && canManageBuses && (
            <button
              type="button"
              onClick={onOpenAddBus}
              className="mt-2 inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Bus</span>
            </button>
          )}
        </div>
      )}

      {/* Desktop Table & Mobile Cards */}
      {!loading && filteredBuses.length > 0 && (
        <>
          <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Bus Number</th>
                    <th className="py-3 px-4">Bus Route</th>
                    <th className="py-3 px-4">First Shift</th>
                    <th className="py-3 px-4">Second Shift</th>
                    <th className="py-3 px-4">Bus Status</th>
                    {(canViewRestricted || canManageBuses) && (
                      <th className="py-3 px-4 text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {filteredBuses.map((bus) => (
                    <tr key={bus.id} className="hover:bg-slate-50/70 transition-colors align-top">
                      <td className="py-3.5 px-4 font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>{bus.busNumber}</span>
                          {bus.isDemo && (
                            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded">
                              DEMO
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">{bus.routeName}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-0.5 font-mono tabular-nums text-xs">
                          <p className="text-slate-900 font-medium">
                            Entry: {bus.firstShiftEntry || '—'}
                          </p>
                          <p className="text-slate-500">Exit: {bus.firstShiftExit || '—'}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-0.5 font-mono tabular-nums text-xs">
                          <p className="text-slate-900 font-medium">
                            Entry: {bus.secondShiftEntry || '—'}
                          </p>
                          <p className="text-slate-500">Exit: {bus.secondShiftExit || '—'}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusIndicator status={bus.status} />
                      </td>
                      {(canViewRestricted || canManageBuses) && (
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {canViewRestricted && (
                              <button
                                type="button"
                                onClick={() => setSelectedDetailBus(bus)}
                                className="px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 rounded-md inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Details</span>
                              </button>
                            )}
                            {canManageBuses && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onEditBus(bus)}
                                  className="px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                                {confirmDeleteId === bus.id ? (
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      type="button"
                                      disabled={deleting}
                                      onClick={() => handleDelete(bus.id)}
                                      className="px-2 py-1 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded cursor-pointer"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteId(null)}
                                      className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(bus.id)}
                                    className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-md cursor-pointer"
                                    aria-label={`Delete ${bus.busNumber}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-3">
            {filteredBuses.map((bus) => (
              <div
                key={bus.id}
                className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-mono tabular-nums text-sm font-bold text-slate-900">
                        {bus.busNumber}
                      </p>
                      {bus.isDemo && (
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded">
                          DEMO
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-slate-800 mt-0.5">{bus.routeName}</p>
                  </div>
                  <StatusIndicator status={bus.status} />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <p className="text-slate-500 font-medium">First Shift</p>
                    <p className="font-mono tabular-nums text-slate-900 mt-0.5">
                      Entry: {bus.firstShiftEntry || '—'}
                    </p>
                    <p className="font-mono tabular-nums text-slate-500">
                      Exit: {bus.firstShiftExit || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium">Second Shift</p>
                    <p className="font-mono tabular-nums text-slate-900 mt-0.5">
                      Entry: {bus.secondShiftEntry || '—'}
                    </p>
                    <p className="font-mono tabular-nums text-slate-500">
                      Exit: {bus.secondShiftExit || '—'}
                    </p>
                  </div>
                </div>

                {(canViewRestricted || canManageBuses) && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    {canViewRestricted && (
                      <button
                        type="button"
                        onClick={() => setSelectedDetailBus(bus)}
                        className="min-h-[36px] px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>
                    )}
                    {canManageBuses && (
                      <button
                        type="button"
                        onClick={() => onEditBus(bus)}
                        className="min-h-[36px] px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {role === 'faculty' && !canViewRestricted && effectiveBuses.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm text-slate-700">
            <Lock className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              Driver contacts, vehicle registration, and permit details are protected until your
              faculty access request is approved by the HOD / Director.
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenFacultyAccess}
            className="text-xs font-semibold text-blue-700 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            Open Access Request
          </button>
        </div>
      )}

      {selectedDetailBus && (
        <BusDetailsModal bus={selectedDetailBus} onClose={() => setSelectedDetailBus(null)} />
      )}
    </div>
  );
}

function StatusIndicator({ status }: { status: BusSchedule['status'] }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>Active</span>
      </span>
    );
  }
  if (status === 'maintenance') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
        <Wrench className="w-3.5 h-3.5 shrink-0" />
        <span>Maintenance</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      <span>Inactive</span>
    </span>
  );
}
