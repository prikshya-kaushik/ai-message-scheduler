/**
 * Schedule Page
 * Form to create/edit scheduled messages with AI generation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { messagesAPI, aiAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import {
  Send, Sparkles, Loader2, User, AtSign, Clock,
  Globe, MessageSquare, FileText, ChevronDown, X, Lightbulb,
} from 'lucide-react';
import toast from 'react-hot-toast';

const PLATFORMS = [
  { value: 'email', label: 'Email', color: 'text-blue-400' },
  { value: 'sms', label: 'SMS', color: 'text-green-400' },
  { value: 'whatsapp', label: 'WhatsApp', color: 'text-emerald-400' },
  { value: 'slack', label: 'Slack', color: 'text-purple-400' },
  { value: 'telegram', label: 'Telegram', color: 'text-sky-400' },
  { value: 'twitter', label: 'Twitter / X', color: 'text-gray-300' },
];

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Sao_Paulo', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Bangkok', 'Asia/Singapore', 'Asia/Tokyo',
  'Australia/Sydney', 'Pacific/Auckland',
];

const DEFAULT_FORM = {
  recipientName: '',
  recipientContact: '',
  subject: '',
  content: '',
  scheduledDate: '',
  scheduledTime: '',
  timezone: 'UTC',
  platform: 'email',
  notes: '',
};

export default function SchedulePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = Boolean(id);

  const [form, setForm] = useState({ ...DEFAULT_FORM, timezone: user?.timezone || 'UTC' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEditing);

  // AI panel state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isAiGenerated, setIsAiGenerated] = useState(false);

  // Fetch message for editing
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const { data } = await messagesAPI.getById(id);
        const msg = data.message;
        const dt = new Date(msg.scheduledAt);
        setForm({
          recipientName: msg.recipient?.name || '',
          recipientContact: msg.recipient?.contact || '',
          subject: msg.subject || '',
          content: msg.content || '',
          scheduledDate: format(dt, 'yyyy-MM-dd'),
          scheduledTime: format(dt, 'HH:mm'),
          timezone: msg.timezone || 'UTC',
          platform: msg.platform || 'email',
          notes: msg.notes || '',
        });
        setIsAiGenerated(msg.isAiGenerated || false);
      } catch {
        toast.error('Failed to load message');
        navigate('/dashboard');
      } finally {
        setFetchLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  // Fetch AI suggestions
  useEffect(() => {
    if (showAI && suggestions.length === 0) {
      aiAPI.getSuggestions().then(({ data }) => setSuggestions(data.suggestions || [])).catch(() => {});
    }
  }, [showAI]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.recipientContact.trim()) errs.recipientContact = 'Recipient contact required';
    if (!form.content.trim()) errs.content = 'Message content required';
    if (!form.scheduledDate) errs.scheduledDate = 'Date required';
    if (!form.scheduledTime) errs.scheduledTime = 'Time required';
    if (form.scheduledDate && form.scheduledTime) {
      const dt = new Date(`${form.scheduledDate}T${form.scheduledTime}`);
      if (dt <= new Date()) errs.scheduledDate = 'Must be a future date/time';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) return setErrors(errs);

    setLoading(true);
    const payload = {
      recipient: { name: form.recipientName, contact: form.recipientContact },
      subject: form.subject,
      content: form.content,
      scheduledAt: new Date(`${form.scheduledDate}T${form.scheduledTime}`).toISOString(),
      timezone: form.timezone,
      platform: form.platform,
      notes: form.notes,
      isAiGenerated,
      aiPrompt: isAiGenerated ? aiPrompt : undefined,
    };

    try {
      if (isEditing) {
        await messagesAPI.update(id, payload);
        toast.success('Message updated!');
      } else {
        await messagesAPI.create(payload);
        toast.success('Message scheduled! 🎉');
      }
      navigate('/dashboard');
    } catch {
      // Handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return toast.error('Enter a prompt first');
    setAiLoading(true);
    try {
      const { data } = await aiAPI.generate({ prompt: aiPrompt, platform: form.platform });
      setForm(prev => ({
        ...prev,
        content: data.content,
        subject: data.subject || prev.subject,
      }));
      setIsAiGenerated(true);
      toast.success('AI message generated!');
    } catch {
      // Handled by interceptor
    } finally {
      setAiLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-white">
          {isEditing ? 'Edit Message' : 'Schedule a Message'}
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {isEditing ? 'Update your scheduled message' : 'Set up a message to be delivered automatically'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Recipient */}
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-brand-400" /> Recipient
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Name (optional)</label>
              <input name="recipientName" value={form.recipientName} onChange={handleChange}
                placeholder="John Doe" className="input" />
            </div>
            <div>
              <label className="label">Contact *</label>
              <div className="relative">
                <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input name="recipientContact" value={form.recipientContact} onChange={handleChange}
                  placeholder="email, phone, @handle" className={`input pl-10 ${errors.recipientContact ? 'border-red-500/60' : ''}`} />
              </div>
              {errors.recipientContact && <p className="text-red-400 text-xs mt-1">{errors.recipientContact}</p>}
            </div>
          </div>
        </div>

        {/* Platform */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-brand-400" /> Platform
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {PLATFORMS.map(({ value, label, color }) => (
              <button key={value} type="button"
                onClick={() => setForm(prev => ({ ...prev, platform: value }))}
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                  form.platform === value
                    ? 'border-brand-500 bg-brand-600/20 text-brand-300'
                    : 'border-surface-border bg-surface-tertiary text-gray-400 hover:border-gray-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* AI Generator Panel */}
        <div className="card overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAI(v => !v)}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-tertiary/50 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-white">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              AI Message Generator
              <span className="px-1.5 py-0.5 rounded text-xs bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">Beta</span>
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showAI ? 'rotate-180' : ''}`} />
          </button>

          {showAI && (
            <div className="px-5 pb-5 space-y-3 border-t border-surface-border animate-slide-up">
              <p className="text-xs text-gray-500 mt-3">Describe what you want to say and AI will craft it for you</p>

              {/* Prompt suggestions */}
              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {suggestions.slice(0, 4).map(s => (
                    <button key={s.prompt} type="button"
                      onClick={() => setAiPrompt(s.prompt)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-surface-border bg-surface-tertiary text-gray-300 hover:border-brand-600/60 hover:text-brand-300 transition-all"
                    >
                      <Lightbulb className="w-3 h-3" />
                      {s.category}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAIGenerate())}
                  placeholder="e.g. Birthday wish for my best friend turning 30"
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={handleAIGenerate}
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="btn-primary px-4"
                >
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-400" /> Message Content
            </h3>
            {isAiGenerated && (
              <span className="flex items-center gap-1 text-xs text-yellow-400">
                <Sparkles className="w-3 h-3" /> AI generated
              </span>
            )}
          </div>

          {form.platform === 'email' && (
            <div>
              <label className="label">Subject</label>
              <input name="subject" value={form.subject} onChange={handleChange}
                placeholder="Email subject" className="input" />
            </div>
          )}

          <div>
            <label className="label">Message *</label>
            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
              placeholder="Write your message here..."
              rows={5}
              className={`input resize-none ${errors.content ? 'border-red-500/60' : ''}`}
            />
            <div className="flex justify-between mt-1">
              {errors.content && <p className="text-red-400 text-xs">{errors.content}</p>}
              <p className={`text-xs ml-auto ${form.content.length > 4500 ? 'text-red-400' : 'text-gray-600'}`}>
                {form.content.length}/5000
              </p>
            </div>
          </div>
        </div>

        {/* Scheduling */}
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-400" /> Schedule
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Date *</label>
              <input type="date" name="scheduledDate" value={form.scheduledDate} onChange={handleChange}
                min={format(new Date(), 'yyyy-MM-dd')}
                className={`input ${errors.scheduledDate ? 'border-red-500/60' : ''}`}
                style={{ colorScheme: 'dark' }}
              />
              {errors.scheduledDate && <p className="text-red-400 text-xs mt-1">{errors.scheduledDate}</p>}
            </div>
            <div>
              <label className="label">Time *</label>
              <input type="time" name="scheduledTime" value={form.scheduledTime} onChange={handleChange}
                className={`input ${errors.scheduledTime ? 'border-red-500/60' : ''}`}
                style={{ colorScheme: 'dark' }}
              />
              {errors.scheduledTime && <p className="text-red-400 text-xs mt-1">{errors.scheduledTime}</p>}
            </div>
            <div>
              <label className="label">Timezone</label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <select name="timezone" value={form.timezone} onChange={handleChange}
                  className="input pl-10 appearance-none">
                  {TIMEZONES.map(tz => (
                    <option key={tz} value={tz} className="bg-surface-secondary">{tz}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="label">Notes (optional)</label>
          <input name="notes" value={form.notes} onChange={handleChange}
            placeholder="Internal notes..." className="input" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {isEditing ? 'Updating...' : 'Scheduling...'}</>
            ) : (
              <><Send className="w-4 h-4" /> {isEditing ? 'Update Message' : 'Schedule Message'}</>
            )}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
