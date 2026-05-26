/**
 * Profile Page
 * User settings and notification preferences
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { User, Bell, Lock, Globe, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Sao_Paulo', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Bangkok', 'Asia/Singapore', 'Asia/Tokyo',
  'Australia/Sydney', 'Pacific/Auckland',
];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [profile, setProfile] = useState({
    name: user?.name || '',
    timezone: user?.timezone || 'UTC',
    notificationEmail: user?.notificationEmail || user?.email || '',
    emailNotifications: user?.emailNotifications ?? true,
  });
  const [profileLoading, setProfileLoading] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const { data } = await authAPI.updateProfile(profile);
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch {}
    finally { setProfileLoading(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (pwForm.newPassword.length < 8) {
      return toast.error('New password must be at least 8 characters');
    }
    setPwLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {}
    finally { setPwLoading(false); }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Profile Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile card */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-brand-400" /> Account Info
        </h2>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input value={profile.name}
              onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
              className="input" placeholder="Your name" />
          </div>
          <div>
            <label className="label">Email</label>
            <input value={user?.email} disabled
              className="input opacity-50 cursor-not-allowed" />
            <p className="text-xs text-gray-600 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="label flex items-center gap-1.5">
              <Globe className="w-3 h-3" /> Timezone
            </label>
            <select value={profile.timezone}
              onChange={e => setProfile(p => ({ ...p, timezone: e.target.value }))}
              className="input appearance-none">
              {TIMEZONES.map(tz => (
                <option key={tz} value={tz} className="bg-surface-secondary">{tz}</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={profileLoading} className="btn-primary">
            {profileLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </form>
      </div>

      {/* Notifications */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-brand-400" /> Notifications
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Email Notifications</p>
              <p className="text-xs text-gray-500">Receive delivery confirmations by email</p>
            </div>
            <button
              type="button"
              onClick={() => setProfile(p => ({ ...p, emailNotifications: !p.emailNotifications }))}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                profile.emailNotifications ? 'bg-brand-600' : 'bg-surface-border'
              }`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                profile.emailNotifications ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
          <div>
            <label className="label">Notification Email</label>
            <input
              type="email"
              value={profile.notificationEmail}
              onChange={e => setProfile(p => ({ ...p, notificationEmail: e.target.value }))}
              placeholder="Notification destination"
              className="input"
            />
          </div>
          <button onClick={handleProfileSave} disabled={profileLoading} className="btn-secondary text-sm">
            Save Preferences
          </button>
        </div>
      </div>

      {/* Password change */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-brand-400" /> Change Password
        </h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {[
            { name: 'currentPassword', label: 'Current Password' },
            { name: 'newPassword', label: 'New Password' },
            { name: 'confirmPassword', label: 'Confirm New Password' },
          ].map(({ name, label }) => (
            <div key={name}>
              <label className="label">{label}</label>
              <input type="password" value={pwForm[name]}
                onChange={e => setPwForm(p => ({ ...p, [name]: e.target.value }))}
                className="input" placeholder="••••••••" />
            </div>
          ))}
          <button type="submit" disabled={pwLoading} className="btn-primary">
            {pwLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Changing...</> : <><Lock className="w-4 h-4" /> Change Password</>}
          </button>
        </form>
      </div>
    </div>
  );
}
