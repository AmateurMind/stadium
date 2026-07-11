/**
 * ZoneMap — Interactive zone status listing with filters.
 *
 * Provides fans and staff with a filterable view of all stadium zones,
 * their occupancy, wait times, and accessibility status.
 */

import { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { getStatusColor, getStatusBgColor, formatZoneType, getZoneIcon } from '../../utils/formatters';
import type { ZoneStatus, ZoneType } from '../../types';

const ZONE_TYPES: { value: string; label: string }[] = [
  { value: '', label: 'All Zones' },
  { value: 'gate', label: 'Gates' },
  { value: 'concourse', label: 'Concourses' },
  { value: 'seating', label: 'Seating' },
  { value: 'restroom', label: 'Restrooms' },
  { value: 'concession', label: 'Food & Drink' },
  { value: 'first_aid', label: 'First Aid' },
  { value: 'parking', label: 'Parking' },
  { value: 'vip', label: 'VIP' },
];

export const ZoneMap = () => {
  const [zones, setZones] = useState<ZoneStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [accessibleOnly, setAccessibleOnly] = useState(false);

  useEffect(() => {
    const fetchZones = async () => {
      setLoading(true);
      setError(null);
      try {
        const params: { zone_type?: string; accessible_only?: boolean } = {};
        if (filterType) params.zone_type = filterType;
        if (accessibleOnly) params.accessible_only = true;
        const data = await apiClient.getZones(params);
        setZones(data.zones);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load zones');
      } finally {
        setLoading(false);
      }
    };
    fetchZones();
  }, [filterType, accessibleOnly]);

  return (
    <section aria-label="Stadium Zone Map" className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="zone-type-filter" className="text-sm font-medium text-gray-600">
            Zone Type:
          </label>
          <select
            id="zone-type-filter"
            value={filterType}
            onChange={e => setFilterType(e.target.value as ZoneType)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {ZONE_TYPES.map(zt => (
              <option key={zt.value} value={zt.value}>{zt.label}</option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={accessibleOnly}
            onChange={e => setAccessibleOnly(e.target.checked)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            aria-describedby="accessible-help"
          />
          <span>♿ Accessible only</span>
          <span id="accessible-help" className="sr-only">
            Filter to show only wheelchair-accessible zones
          </span>
        </label>
      </div>

      {/* Loading / Error states */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner label="Loading zones..." size="lg" />
        </div>
      )}

      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Zone cards */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" role="list" aria-label="Stadium zones">
          {zones.map(zone => (
            <div
              key={zone.zone_id}
              role="listitem"
              className={`
                rounded-xl border border-gray-100 bg-white p-4 shadow-sm
                hover:shadow-md transition-shadow duration-200
                ${zone.status === 'congested' ? 'ring-1 ring-red-200' : ''}
              `}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className="text-lg">
                    {getZoneIcon(zone.zone_type)}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{zone.zone_name}</h3>
                    <p className="text-xs text-gray-500">{formatZoneType(zone.zone_type)}</p>
                  </div>
                </div>
                <span
                  className={`
                    text-xs font-bold uppercase px-2 py-0.5 rounded-full
                    ${getStatusColor(zone.status)} ${getStatusBgColor(zone.status)}
                  `}
                >
                  {zone.status}
                </span>
              </div>

              <div
                className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2"
                role="progressbar"
                aria-valuenow={zone.occupancy_pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${zone.zone_name} occupancy ${zone.occupancy_pct}%`}
              >
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    zone.status === 'congested'
                      ? 'bg-red-500'
                      : zone.status === 'busy'
                        ? 'bg-amber-500'
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(zone.occupancy_pct, 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="tabular-nums">
                  {zone.current_occupancy.toLocaleString()}/{zone.max_capacity.toLocaleString()}
                  {' '}({zone.occupancy_pct}%)
                </span>
                {zone.wait_time_minutes > 0 && (
                  <span className="font-medium">
                    ~{zone.wait_time_minutes} min wait
                  </span>
                )}
              </div>

              {zone.is_accessible && (
                <p className="text-xs text-primary-600 mt-1.5 font-medium">
                  ♿ Wheelchair accessible
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && !error && zones.length === 0 && (
        <p className="text-center py-8 text-gray-400 text-sm">
          No zones match your current filters.
        </p>
      )}
    </section>
  );
};
