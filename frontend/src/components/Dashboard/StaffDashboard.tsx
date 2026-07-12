/**
 * StaffDashboard — Real-time operational intelligence dashboard.
 *
 * Displays:
 *   - Overall stadium occupancy with visual gauge
 *   - Zone-by-zone occupancy chart (recharts)
 *   - AI-generated crowd management alerts
 *   - Full accessibility support
 */

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useStadiumStore } from '../../store/stadiumStore';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { getSeverityColor, formatZoneType, getZoneIcon } from '../../utils/formatters';
import { apiClient } from '../../api/client';
import type { FanServices, MatchStats } from '../../types';

const OCCUPANCY_COLORS: Record<string, string> = {
  normal: '#22c55e',
  busy: '#f59e0b',
  congested: '#ef4444',
  closed: '#6b7280',
};

const RISK_STYLES: Record<string, string> = {
  low: 'bg-green-50 text-green-800 border-green-200',
  elevated: 'bg-amber-50 text-amber-800 border-amber-200',
  high: 'bg-orange-50 text-orange-800 border-orange-200',
  critical: 'bg-red-50 text-red-800 border-red-200',
};

export const StaffDashboard = () => {
  const crowdAnalysis = useStadiumStore(s => s.crowdAnalysis);
  const isLoadingCrowd = useStadiumStore(s => s.isLoadingCrowd);
  const error = useStadiumStore(s => s.error);
  const stadiumId = useStadiumStore(s => s.stadiumId);
  const fetchCrowdAnalysis = useStadiumStore(s => s.fetchCrowdAnalysis);

  const [matchStats, setMatchStats] = useState<MatchStats | null>(null);
  const [fanServices, setFanServices] = useState<FanServices | null>(null);

  useEffect(() => {
    fetchCrowdAnalysis();
    void apiClient.getMatchStats().then(setMatchStats).catch(() => setMatchStats(null));
    void apiClient.getFanServices(stadiumId).then(setFanServices).catch(() => setFanServices(null));
  }, [fetchCrowdAnalysis, stadiumId]);

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

  const operationsBrief = crowdAnalysis.operations_brief;
  const chartData = crowdAnalysis.zones.map(z => ({
    name: z.zone_name.split(' — ')[0].split(' – ')[0],
    occupancy: z.occupancy_pct,
    status: z.status,
    fullName: z.zone_name,
  }));

  return (
    <section aria-label="Staff Operations Dashboard" className="space-y-6">
      {/* Live Match Analytics Panel (thestatsapi.com integration) */}
      {matchStats && (
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 bg-primary-600 text-[10px] uppercase font-bold tracking-[0.15em] px-4 py-1.5 rounded-bl-2xl">
            Live stats: {matchStats.source}
          </div>
          <div className="flex justify-between items-center mb-6">
            <div className="text-left">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Tournament Match</p>
              <h3 className="text-xl font-black mt-1 flex items-center gap-2">
                ⚽ {matchStats.teams.home.name} vs {matchStats.teams.away.name}
              </h3>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 animate-pulse">
                Live {matchStats.minute}'
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Score & xG comparison */}
            <div className="space-y-4">
              <div className="flex justify-around items-center py-4 bg-slate-800/40 rounded-2xl border border-slate-800">
                <div className="text-center">
                  <p className="text-3xl font-black">{matchStats.teams.home.goals}</p>
                  <p className="text-xs text-slate-400 mt-1">{matchStats.teams.home.name}</p>
                </div>
                <div className="text-slate-500 font-bold">vs</div>
                <div className="text-center">
                  <p className="text-3xl font-black">{matchStats.teams.away.goals}</p>
                  <p className="text-xs text-slate-400 mt-1">{matchStats.teams.away.name}</p>
                </div>
              </div>

              {/* xG progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>xG: {matchStats.overview.expected_goals.all.home}</span>
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Expected Goals (xG)</span>
                  <span>xG: {matchStats.overview.expected_goals.all.away}</span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full flex overflow-hidden">
                  <div
                    className="bg-primary-500 h-full rounded-l-full transition-all duration-500"
                    style={{
                      width: `${
                        (matchStats.overview.expected_goals.all.home /
                          (matchStats.overview.expected_goals.all.home +
                            matchStats.overview.expected_goals.all.away || 1)) *
                        100
                      }%`,
                    }}
                  />
                  <div
                    className="bg-amber-500 h-full rounded-r-full transition-all duration-500"
                    style={{
                      width: `${
                        (matchStats.overview.expected_goals.all.away /
                          (matchStats.overview.expected_goals.all.home +
                            matchStats.overview.expected_goals.all.away || 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Possession & Shot Summary */}
            <div className="space-y-4">
              {/* Possession */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{matchStats.overview.possession_pct.home}%</span>
                  <span>Possession</span>
                  <span>{matchStats.overview.possession_pct.away}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full flex overflow-hidden">
                  <div
                    className="bg-primary-500 h-full transition-all duration-500"
                    style={{ width: `${matchStats.overview.possession_pct.home}%` }}
                  />
                  <div
                    className="bg-slate-700 h-full transition-all duration-500"
                    style={{ width: `${matchStats.overview.possession_pct.away}%` }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
                  <p className="text-slate-400 font-semibold mb-0.5">Shots</p>
                  <p className="font-bold text-sm">
                    {matchStats.overview.shots.home} - {matchStats.overview.shots.away}
                  </p>
                </div>
                <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
                  <p className="text-slate-400 font-semibold mb-0.5">Fouls</p>
                  <p className="font-bold text-sm">
                    {matchStats.overview.fouls.home} - {matchStats.overview.fouls.away}
                  </p>
                </div>
                <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
                  <p className="text-slate-400 font-semibold mb-0.5">Corners</p>
                  <p className="font-bold text-sm">
                    {matchStats.overview.corners.home} - {matchStats.overview.corners.away}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Operations command brief */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-gray-500 mb-1">
              FIFA 2026 Operations Brief
            </p>
            <h2 className="text-lg font-bold text-gray-900">{operationsBrief.headline}</h2>
          </div>
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${
              RISK_STYLES[operationsBrief.risk_level] ?? RISK_STYLES.low
            }`}
          >
            {operationsBrief.risk_level} risk
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Staff Deployment</h3>
            <ul className="space-y-2" aria-label="Recommended staff deployment actions">
              {operationsBrief.recommended_staffing.map(action => (
                <li key={action} className="text-sm text-gray-600 flex gap-2">
                  <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 rounded-full bg-primary-500 shrink-0" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Fan Messaging</h3>
            <ul className="space-y-2" aria-label="Recommended fan-facing messages">
              {operationsBrief.fan_messaging.map(message => (
                <li key={message} className="text-sm text-gray-600 flex gap-2">
                  <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span>{message}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <p className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-sm text-blue-900">
            <span className="font-semibold">Accessibility:</span> {operationsBrief.accessibility_note}
          </p>
          <p className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-sm text-emerald-900">
            <span className="font-semibold">Sustainability:</span> {operationsBrief.sustainability_note}
          </p>
        </div>
      </div>

      {fanServices && (
        <section className="rounded-2xl border border-line bg-surface p-5" aria-labelledby="vision-monitor-heading">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary-700">
                Vision AI + safety guidance
              </p>
              <h2 id="vision-monitor-heading" className="mt-1 text-lg font-bold text-ink">
                Safety monitor
              </h2>
            </div>
            <span className="rounded-full border border-line bg-canvas px-3 py-1 text-xs font-semibold text-ink">
              Simulated camera feed
            </span>
          </div>
          <p className="mt-3 text-sm text-ink">{fanServices.vision.data_notice}</p>
          <div className="mt-3 flex flex-wrap gap-2" aria-label="Vision detection capabilities">
            {fanServices.vision.detection_capabilities.map(capability => (
              <span key={capability} className="rounded-full bg-canvas px-3 py-1 text-xs font-medium text-ink">
                {capability}
              </span>
            ))}
          </div>

          {fanServices.vision.active_incidents.length > 0 ? (
            <ul className="mt-4 space-y-3" aria-label="Active vision safety incidents">
              {fanServices.vision.active_incidents.map(incident => (
                <li key={`${incident.detection_type}-${incident.location}`} className="rounded-xl border border-line bg-canvas p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold capitalize text-ink">
                      {incident.detection_type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-ink">{incident.location}</span>
                    <span className="text-xs text-ink">{incident.confidence_pct}% confidence</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{incident.generated_guidance}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-xl bg-white p-4 text-sm text-slate-700">
              No active simulated vision incidents. Continue monitoring live crowd data.
            </p>
          )}

          <details className="mt-4 rounded-xl border border-line bg-canvas p-4">
            <summary className="cursor-pointer font-semibold text-ink">Safety response playbooks</summary>
            <ul className="mt-3 space-y-3 text-sm text-slate-700">
              {fanServices.vision.response_playbooks.map(playbook => (
                <li key={playbook.detection_type}>
                  <span className="font-semibold capitalize text-slate-900">
                    {playbook.detection_type.replace('_', ' ')}:
                  </span>{' '}
                  {playbook.generated_guidance}
                </li>
              ))}
            </ul>
          </details>
        </section>
      )}

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
