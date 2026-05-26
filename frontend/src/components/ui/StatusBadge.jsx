/**
 * StatusBadge - renders a colored badge for message status
 */
export default function StatusBadge({ status, compact = false }) {
  const map = {
    scheduled: { cls: 'status-scheduled', dot: 'bg-blue-400', label: 'Scheduled' },
    sent: { cls: 'status-sent', dot: 'bg-emerald-400', label: 'Sent' },
    failed: { cls: 'status-failed', dot: 'bg-red-400', label: 'Failed' },
    cancelled: { cls: 'status-cancelled', dot: 'bg-gray-500', label: 'Cancelled' },
    draft: { cls: 'status-draft', dot: 'bg-yellow-400', label: 'Draft' },
  };

  const config = map[status] || map.draft;

  if (compact) {
    return (
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dot}`} title={config.label} />
    );
  }

  return (
    <span className={config.cls}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
