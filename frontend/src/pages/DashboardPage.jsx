/**
 * Dashboard Page
 * Shows stats, upcoming messages, and quick actions
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { messagesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';
import {
  CalendarPlus, Send, AlertCircle, Clock, CheckCircle2,
  XCircle, TrendingUp, ChevronRight, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from '../components/ui/StatusBadge';
import PlatformIcon from '../components/ui/PlatformIcon';

const StatCard = ({ label, value, icon: Icon, color, sub }) => (
  <div className="card p-5 animate-slide-up">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <p className="text-2xl font-display font-bold text-white">{value}</p>
    <p className="text-sm text-gray-400 mt-0.5">{label}</p>
    {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
  </div>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, messagesRes] = await Promise.all([
        messagesAPI.getStats(),
        messagesAPI.getAll({ limit: 8, sortBy: 'createdAt', sortOrder: 'desc' }),
      ]);
      setStats(statsRes.data.stats);
      setUpcoming(statsRes.data.upcoming || []);
      setRecentMessages(messagesRes.data.messages || []);
    } catch {
      // Error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      await messagesAPI.cancel(id);
      toast.success('Message cancelled');
      fetchDashboardData();
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await messagesAPI.delete(id);
      toast.success('Message deleted');
      fetchDashboardData();
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            {greeting}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link to="/schedule" className="btn-primary">
          <CalendarPlus className="w-4 h-4" />
          Schedule Message
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Scheduled"
          value={stats?.scheduled ?? 0}
          icon={Clock}
          color="bg-blue-900/40 text-blue-400"
        />
        <StatCard
          label="Sent"
          value={stats?.sent ?? 0}
          icon={CheckCircle2}
          color="bg-emerald-900/40 text-emerald-400"
        />
        <StatCard
          label="Failed"
          value={stats?.failed ?? 0}
          icon={AlertCircle}
          color="bg-red-900/40 text-red-400"
        />
        <StatCard
          label="Cancelled"
          value={stats?.cancelled ?? 0}
          icon={XCircle}
          color="bg-gray-800/60 text-gray-400"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming messages */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-white">Upcoming Messages</h2>
            <Link to="/schedule" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div className="card p-8 text-center">
              <Send className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No upcoming messages</p>
              <Link to="/schedule" className="btn-primary mt-4 inline-flex">
                <CalendarPlus className="w-4 h-4" /> Schedule one
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map(msg => (
                <div key={msg._id} className="card p-4 flex items-start justify-between gap-3 hover:border-brand-700/50 transition-colors">
                  <div className="flex items-start gap-3 min-w-0">
                    <PlatformIcon platform={msg.platform} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {msg.recipient?.name || msg.recipient?.contact}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{msg.content}</p>
                      <p className="text-xs text-brand-400 mt-1">
                        {formatDistanceToNow(new Date(msg.scheduledAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={msg.status} />
                    <button
                      onClick={() => handleCancel(msg._id)}
                      className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick stats panel */}
        <div>
          <h2 className="font-display font-semibold text-white mb-4">Recent Activity</h2>
          <div className="card divide-y divide-surface-border">
            {recentMessages.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">No messages yet</div>
            ) : (
              recentMessages.slice(0, 6).map(msg => (
                <div key={msg._id} className="p-3 flex items-center gap-3">
                  <PlatformIcon platform={msg.platform} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-300 truncate">
                      {msg.recipient?.name || msg.recipient?.contact}
                    </p>
                    <p className="text-xs text-gray-600">
                      {format(new Date(msg.scheduledAt), 'MMM d, HH:mm')}
                    </p>
                  </div>
                  <StatusBadge status={msg.status} compact />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
