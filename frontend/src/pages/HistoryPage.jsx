/**
 * History Page
 * Delivery history with filters and analytics
 */

import React, { useState, useEffect } from 'react';
import { historyAPI, messagesAPI } from '../services/api';
import { format } from 'date-fns';
import { Filter, TrendingUp, CheckCircle2, XCircle, Ban, Loader2 } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import PlatformIcon from '../components/ui/PlatformIcon';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', platform: '', page: 1 });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchHistory();
  }, [filters]);

  useEffect(() => {
    historyAPI.getAnalytics()
      .then(({ data }) => setAnalytics(data))
      .catch(() => {});
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = { limit: 15, page: filters.page };
      if (filters.status) params.status = filters.status;
      if (filters.platform) params.platform = filters.platform;
      const { data } = await historyAPI.getHistory(params);
      setHistory(data.history || []);
      setPagination(data.pagination || {});
    } catch {}
    finally { setLoading(false); }
  };

  const setFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value, page: 1 }));

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Message History</h1>
        <p className="text-gray-400 text-sm mt-1">Track delivery status of all your messages</p>
      </div>

      {/* Analytics bar */}
      {analytics && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-lg font-bold text-white">{analytics.deliveryRate}%</p>
              <p className="text-xs text-gray-400">Delivery Rate</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-brand-400 flex-shrink-0" />
            <div>
              <p className="text-lg font-bold text-white">{analytics.platformStats?.length || 0}</p>
              <p className="text-xs text-gray-400">Platforms Used</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <Ban className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-lg font-bold text-white">
                {analytics.platformStats?.reduce((a, p) => a + p.failed, 0) || 0}
              </p>
              <p className="text-xs text-gray-400">Total Failed</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="w-4 h-4 text-gray-500" />
        <select value={filters.status} onChange={e => setFilter('status', e.target.value)}
          className="input !w-auto text-xs py-1.5" style={{ minWidth: 120 }}>
          <option value="">All Status</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={filters.platform} onChange={e => setFilter('platform', e.target.value)}
          className="input !w-auto text-xs py-1.5" style={{ minWidth: 130 }}>
          <option value="">All Platforms</option>
          {['email', 'sms', 'whatsapp', 'slack', 'telegram', 'twitter'].map(p => (
            <option key={p} value={p} className="capitalize">{p}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center">
            <XCircle className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No history found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-border">
                    {['Platform', 'Recipient', 'Scheduled', 'Status', 'Sent At'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {history.map(msg => (
                    <tr key={msg._id} className="hover:bg-surface-tertiary/40 transition-colors">
                      <td className="px-4 py-3">
                        <PlatformIcon platform={msg.platform} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-white">{msg.recipient?.name || msg.recipient?.contact}</p>
                        {msg.recipient?.name && (
                          <p className="text-xs text-gray-500">{msg.recipient.contact}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {format(new Date(msg.scheduledAt), 'MMM d, yyyy HH:mm')}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={msg.status} />
                        {msg.failureReason && (
                          <p className="text-xs text-red-400 mt-1 max-w-32 truncate" title={msg.failureReason}>
                            {msg.failureReason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {msg.sentAt ? format(new Date(msg.sentAt), 'MMM d, HH:mm') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-surface-border">
                <p className="text-xs text-gray-500">
                  {pagination.total} total messages
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={filters.page <= 1}
                    onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}
                    className="btn-secondary !px-3 !py-1.5 text-xs disabled:opacity-30"
                  >Prev</button>
                  <span className="flex items-center text-xs text-gray-400">
                    {filters.page} / {pagination.totalPages}
                  </span>
                  <button
                    disabled={filters.page >= pagination.totalPages}
                    onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}
                    className="btn-secondary !px-3 !py-1.5 text-xs disabled:opacity-30"
                  >Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
