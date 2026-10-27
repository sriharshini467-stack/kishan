import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, MessageSquare, Send, CheckCircle2, Phone, RefreshCw } from 'lucide-react';
import { NotificationLog } from '../types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('9876543210');
  const [testMessage, setTestMessage] = useState('KisanSetu Gateway Test: Notification active and running.');
  const [sendingTest, setSendingTest] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/notifications');
      if (res.data?.notifications) {
        setLogs(res.data.notifications);
      }
    } catch (e) {
      console.warn('Failed to load notification logs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingTest(true);
    try {
      await axios.post('/api/notifications/test-sms', {
        phone: testPhone,
        message: testMessage,
        channel: 'SMS',
        provider: 'Twilio',
      });
      await fetchLogs();
    } catch (e) {
      console.warn(e);
    } finally {
      setSendingTest(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center space-x-2">
            <span className="text-xl">📲</span>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Twilio & Brevo Notification Gateway</h3>
              <p className="text-[11px] text-stone-500">Live SMS & WhatsApp transactional order alerts</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={fetchLogs}
              title="Refresh logs"
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Integration Header Summary */}
        <div className="p-3 bg-emerald-50 border-b border-emerald-100 text-xs text-emerald-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-bold">Gateway Status: ACTIVE</span>
          </div>
          <span className="text-[10px] bg-emerald-200/60 px-2 py-0.5 rounded font-mono">
            Twilio v4.2 / Brevo v3
          </span>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && logs.length === 0 ? (
            <div className="text-center py-8 text-stone-400 text-xs">Loading transmission logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-xs">
              No notifications dispatched yet. Placing an order or accepting partial orders will trigger alerts here.
            </div>
          ) : (
            logs.map(log => (
              <div
                key={log.id}
                className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1.5 shadow-2xs"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 font-bold text-stone-800">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>+91 {log.toPhone}</span>
                    <span className="text-stone-400 font-normal">({log.recipientName})</span>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {log.channel} • {log.provider}
                  </span>
                </div>

                <div className="p-2 bg-white rounded-lg border border-stone-200 text-stone-800 font-mono text-[11px] leading-relaxed">
                  {log.message}
                </div>

                <div className="flex items-center justify-between text-[10px] text-stone-400 pt-0.5">
                  <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Delivered
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Test SMS Dispatcher */}
        <form onSubmit={handleSendTest} className="p-4 border-t border-stone-200 bg-stone-50 space-y-2 text-xs">
          <label className="block font-bold text-stone-800">Transmit Test SMS / Alert</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={testPhone}
              onChange={e => setTestPhone(e.target.value)}
              placeholder="10-digit phone"
              className="w-28 p-2 border border-stone-300 rounded-lg bg-white font-mono"
            />
            <input
              type="text"
              value={testMessage}
              onChange={e => setTestMessage(e.target.value)}
              placeholder="Message..."
              className="flex-1 p-2 border border-stone-300 rounded-lg bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={sendingTest}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Test via Twilio/Brevo Gateway</span>
          </button>
        </form>
      </div>
    </div>
  );
};
