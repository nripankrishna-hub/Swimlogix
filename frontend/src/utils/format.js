/** Shared display formatters. */

export const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${formatDate(d)} · ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
};

export const formatTimeRange = (timing) => {
  if (!timing || (!timing.startTime && !timing.endTime)) return 'Timing not set';
  return `${timing.startTime || '--:--'} – ${timing.endTime || '--:--'}`;
};

export const formatDays = (days) => (days && days.length ? days.join(' · ') : 'Days not set');

export const titleCase = (value) => {
  if (!value) return '';
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export const initials = (name) => {
  if (!name) return 'SL';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
};

export const formatCurrency = (amount, currency = 'INR') => {
  if (amount === undefined || amount === null || amount === '') return '—';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch (err) {
    return `${currency} ${amount}`;
  }
};

/** Bucket a status string into a Badge tone. */
export const statusTone = (status) => {
  switch (String(status)) {
    case 'approved':
    case 'active':
    case 'pass':
    case 'present':
    case 'paid':
    case 'achieved':
      return 'success';
    case 'pending':
    case 'partial':
    case 'in-progress':
    case 'late':
      return 'warning';
    case 'rejected':
    case 'suspended':
    case 'fail':
    case 'absent':
    case 'overdue':
      return 'danger';
    default:
      return 'neutral';
  }
};

/** Today's date as YYYY-MM-DD (for API date filters). */
export const todayISO = () => new Date().toISOString().slice(0, 10);
