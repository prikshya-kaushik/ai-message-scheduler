/**
 * PlatformIcon - Renders a colored platform indicator
 */

const PLATFORM_CONFIG = {
  email: { label: 'Email', bg: 'bg-blue-900/40', text: 'text-blue-400', emoji: '✉️' },
  sms: { label: 'SMS', bg: 'bg-green-900/40', text: 'text-green-400', emoji: '💬' },
  whatsapp: { label: 'WhatsApp', bg: 'bg-emerald-900/40', text: 'text-emerald-400', emoji: '📱' },
  slack: { label: 'Slack', bg: 'bg-purple-900/40', text: 'text-purple-400', emoji: '💼' },
  telegram: { label: 'Telegram', bg: 'bg-sky-900/40', text: 'text-sky-400', emoji: '✈️' },
  twitter: { label: 'Twitter', bg: 'bg-gray-800', text: 'text-gray-300', emoji: '🐦' },
};

export default function PlatformIcon({ platform, size = 'default' }) {
  const config = PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.email;
  const sizeClass = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';

  return (
    <div className={`${sizeClass} ${config.bg} rounded-lg flex items-center justify-center flex-shrink-0`}
         title={config.label}>
      <span>{config.emoji}</span>
    </div>
  );
}

export { PLATFORM_CONFIG };
