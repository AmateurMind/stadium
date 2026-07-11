/**
 * Formatting utilities for StadiumSync.
 */

/**
 * Get or create a persistent anonymous session ID stored in sessionStorage.
 * Format: sess-{timestamp}-{random} — satisfies 8–64 char, alphanumeric + hyphens pattern.
 */
export const getSessionId = (): string => {
  const key = 'stadium_session_id';
  let id = sessionStorage.getItem(key);
  if (!id) {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 10);
    id = `sess-${ts}-${rand}`;
    sessionStorage.setItem(key, id);
  }
  return id;
};

/**
 * Map zone status to a CSS colour class.
 */
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    normal: 'text-green-600',
    busy: 'text-amber-600',
    congested: 'text-red-600',
    closed: 'text-gray-500',
  };
  return colors[status] ?? 'text-gray-500';
};

/**
 * Map zone status to a background CSS class.
 */
export const getStatusBgColor = (status: string): string => {
  const colors: Record<string, string> = {
    normal: 'bg-green-100',
    busy: 'bg-amber-100',
    congested: 'bg-red-100',
    closed: 'bg-gray-100',
  };
  return colors[status] ?? 'bg-gray-100';
};

/**
 * Map alert severity to CSS classes.
 */
export const getSeverityColor = (severity: string): { text: string; bg: string; border: string } => {
  const map: Record<string, { text: string; bg: string; border: string }> = {
    info: { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
    warning: { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
    critical: { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
  };
  return map[severity] ?? map.info;
};

/**
 * Map zone type to a human-readable label.
 */
export const formatZoneType = (type: string): string => {
  const labels: Record<string, string> = {
    gate: 'Gate',
    concourse: 'Concourse',
    seating: 'Seating',
    restroom: 'Restroom',
    concession: 'Food & Drink',
    first_aid: 'First Aid',
    parking: 'Parking',
    vip: 'VIP',
  };
  return labels[type] ?? type.charAt(0).toUpperCase() + type.slice(1);
};

/**
 * Map zone type to an emoji icon.
 */
export const getZoneIcon = (type: string): string => {
  const icons: Record<string, string> = {
    gate: '🚪',
    concourse: '🏟️',
    seating: '💺',
    restroom: '🚻',
    concession: '🍔',
    first_aid: '🏥',
    parking: '🅿️',
    vip: '⭐',
  };
  return icons[type] ?? '📍';
};

/**
 * Map language code to display name.
 */
export const getLanguageName = (code: string): string => {
  const names: Record<string, string> = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    ar: 'العربية',
    pt: 'Português',
    de: 'Deutsch',
    ja: '日本語',
    ko: '한국어',
    zh: '中文',
    hi: 'हिन्दी',
  };
  return names[code] ?? code;
};

/**
 * Format a timestamp string for display.
 */
export const formatTime = (timestamp: string): string => {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  } catch {
    return timestamp;
  }
};
