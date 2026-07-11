/**
 * StaffDashboard — Real-time operational intelligence dashboard.
 *
 * Displays:
 *   - Overall stadium occupancy with visual gauge
 *   - Zone-by-zone occupancy chart (recharts)
 *   - AI-generated crowd management alerts
 *   - Full accessibility support
 */

import { useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useStadiumStore } from '../../store/stadiumStore';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { getSeverityColor, formatZoneType, getZoneIcon } from '../../utils/formatters';

const OCCUPANCY_COLORS: Record<string, string> = {
  normal: '#22c55e',
  busy: '#f59e0b',
  congested: '#ef4444',
  closed: '#6b7280',
};

export const StaffDashboard = () => {
  const crowdAnalysis = useStadiumStore(s => s.crowdAnalysis);
  const isLoadingCrowd = useStadiumStore(s => s.isLoadingCrowd);
  const error = useStadiumStore(s => s.error);
  const fetchCrowdAnalysis = useStadiumStore(s => s.fetchCrowdAnalysis);

  useEffect(() => {
    fetchCrowdAnalysis();
  }, [fetchCrowdAnalysis]);

  if (isLoadingCrowd && !crowdAnalysis) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner label="Loading crowd data..." size="lg" />
      </div>
    );
  }

  if (error && !crowdAnalysis) {
    return (
      <div role="alert" className="bg-red-50 border border-red-200 rounded-xl px-6 py-4 text-red-700">
        {error}
      </div>
    );
  }

  if (!crowdAnalysis) return null;

  const chartData = crowdAnalysis.zones.map(z => ({
    name: z.zone_name.split(' — ')[0].split(' – ')[0],
    occupancy: z.occupancy_pct,
    status: z.status,
    fullName: z.zone_name,
  }));

  return (
    <section aria-label="Staff Operations Dashboard" className="space-y-6">
      {/* Overall stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.15em] text-gray-500 mb-1">Total Attendance</p>
          <p className="text-3xl font-black text-gray-900 tabular-nums">
            {crowdAnalysis.total_attendance.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            of {crowdAnalysis.stadium_capacity.toLocaleString()} capacity
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.15em] text-gray-500 mb-1">Overall Occupancy</p>
          <p className="text-3xl font-black text-gray-900 tabular-nums">
            {crowdAnalysis.overall_occupancy_pct}%
          </p>
          <div
            className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={crowdAnalysis.overall_occupancy_pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Stadium occupancy ${crowdAnalysis.overall_occupancy_pct}%`}
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                crowdAnalysis.overall_occupancy_pct >= 90
                  ? 'bg-red-500'
                  : crowdAnalysis.overall_occupancy_pct >= 70
                    ? 'bg-amber-500'
                    : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(crowdAnalysis.overall_occupancy_pct, 100)}%` }}
            />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.15em] text-gray-500 mb-1">Active Alerts</p>
          <p className="text-3xl font-black text-gray-900 tabular-nums">
            {crowdAnalysis.alerts.length}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Source: <span className="font-medium capitalize">{crowdAnalysis.source}</span>
          </p>
        </div>
      </div>

      {/* Zone occupancy chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Zone Occupancy</h2>
        <div
          role="img"
          aria-label="Bar chart showing occupancy percentage for each stadium zone"
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} unit="%" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
              <Tooltip
                formatter={(value: number) => [`${value}%`, 'Occupancy']}
                labelFormatter={(label: string) => {
                  const item = chartData.find(d => d.name === label);
                  return item?.fullName ?? label;
                }}
              />
              <Bar dataKey="occupancy" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={OCCUPANCY_COLORS[entry.status] ?? OCCUPANCY_COLORS.normal}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Screen reader accessible data table */}
        <table className="sr-only" aria-label="Zone occupancy data">
          <thead>
            <tr>
              <th>Zone</th>
              <th>Type</th>
              <th>Occupancy</th>
              <th>Status</th>
              <th>Wait Time</th>
            </tr>
          </thead>
          <tbody>
            {crowdAnalysis.zones.map(zone => (
              <tr key={zone.zone_id}>
                <td>{zone.zone_name}</td>
                <td>{formatZoneType(zone.zone_type)}</td>
                <td>{zone.occupancy_pct}%</td>
                <td>{zone.status}</td>
                <td>{zone.wait_time_minutes} minutes</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Alerts */}
      {crowdAnalysis.alerts.length > 0 && (
        <div aria-live="polite">
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            Crowd Management Alerts
          </h2>
          <ol className="space-y-3" aria-label="Operational alerts">
            {crowdAnalysis.alerts.map((alert, idx) => {
              const colors = getSeverityColor(alert.severity);
              const zone = crowdAnalysis.zones.find(z => z.zone_id === alert.zone_id);
              return (
                <li
                  key={idx}
                  role="article"
                  aria-label={`${alert.severity} alert for ${zone?.zone_name ?? alert.zone_id}`}
                  className={`
                    rounded-xl border p-4 ${colors.bg} ${colors.border}
                    animate-fade-in
                  `}
                >
                  <div className="flex items-start gap-3">
                    <span aria-hidden="true" className="text-lg mt-0.5">
                      {getZoneIcon(zone?.zone_type ?? 'gate')}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>
                          {alert.severity}
                        </span>
                        <span className="text-xs text-gray-500">
                          {zone?.zone_name ?? alert.zone_id}
                        </span>
                      </div>
                      <p className={`text-sm font-medium ${colors.text}`}>{alert.message}</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-gray-600">
                          <span className="font-semibold">Action:</span> {alert.recommended_action}
                        </p>
                        <p className="text-xs text-gray-500">
                          <span className="font-semibold">Impact:</span> {alert.estimated_impact}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* Refresh button */}
      <div className="flex justify-center">
        <button
          onClick={fetchCrowdAnalysis}
          disabled={isLoadingCrowd}
          aria-busy={isLoadingCrowd}
          className="
            px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold
            hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500
            focus:ring-offset-2 disabled:opacity-50 transition-all duration-200
          "
        >
          {isLoadingCrowd ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
    </section>
  );
};
