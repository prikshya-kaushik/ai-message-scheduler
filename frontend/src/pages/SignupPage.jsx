/**
 * Signup Page
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Zap, User, Mail, Lock, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Sao_Paulo', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Bangkok', 'Asia/Singapore', 'Asia/Tokyo',
  'Australia/Sydney', 'Pacific/Auckland',
];

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', timezone: 'UTC' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name || form.name.length < 2) errs.name = 'Name must be at least 2 characters';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email required';
    if (!form.password || form.password.length < 8) errs.password = 'Password must be 8+ characters';
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
      errs.password = 'Must contain uppercase, lowercase, and a number';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) return setErrors(errs);

    setLoading(true);
    try {
      await signup(form.name, form.email, form.password, form.timezone);
      toast.success('Account created! Welcome aboard 🎉');
      navigate('/dashboard');
    } catch {
      // Handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ name, label, type = 'text', Icon, placeholder, children }) => (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none z-10" />}
        {children || (
          <input
            name={name}
            type={showPassword && name === 'password' ? 'text' : type}
            value={form[name]}
            onChange={handleChange}
            placeholder={placeholder}
            className={`input ${Icon ? 'pl-10' : ''} ${name === 'password' ? 'pr-10' : ''} ${errors[name] ? 'border-red-500/60' : ''}`}
          />
        )}
        {name === 'password' && (
          <button type="button" onClick={() => setShowPassword(v => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {errors[name] && <p className="text-red-400 text-xs mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-white text-lg">SchedulAI</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-white">Create your account</h2>
          <p className="text-gray-400 mt-1">Start scheduling smarter messages today</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field name="name" label="Full Name" Icon={User} placeholder="Jane Smith" />
            <Field name="email" label="Email" type="email" Icon={Mail} placeholder="you@example.com" />
            <Field name="password" label="Password" type="password" Icon={Lock} placeholder="Min 8 characters" />

            {/* Timezone select */}
            <div>
              <label className="label">Timezone</label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <select
                  name="timezone"
                  value={form.timezone}
                  onChange={handleChange}
                  className="input pl-10 appearance-none"
                >
                  {TIMEZONES.map(tz => (
                    <option key={tz} value={tz} className="bg-surface-secondary">{tz}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account...</>
              ) : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-sm mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
