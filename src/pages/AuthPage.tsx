import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sprout, Phone, Lock, User, MapPin, Globe, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SupportedLanguage } from '../i18n/translations';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, signup, quickDemoLogin } = useAuth();
  const { t, currentLanguage, setLanguage, languages } = useLanguage();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Signup fields
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [location, setLocation] = useState('Nashik, Maharashtra');
  const [preferredLang, setPreferredLang] = useState<SupportedLanguage>(currentLanguage);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (mode === 'signin') {
      const res = await login(phone, password);
      setIsSubmitting(false);
      if (res.success) {
        navigate('/select-role');
      } else {
        setError(res.error || 'Failed to sign in.');
      }
    } else {
      // Signup
      if (password !== confirmPassword) {
        setError(t('passwordMismatch', 'Passwords do not match'));
        setIsSubmitting(false);
        return;
      }
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        setError(t('invalidPhone', 'Please enter a valid 10-digit mobile number'));
        setIsSubmitting(false);
        return;
      }

      const res = await signup({
        name,
        phone: cleanPhone,
        password,
        confirmPassword,
        location,
        preferredLanguage: preferredLang,
      });

      setIsSubmitting(false);
      if (res.success) {
        setLanguage(preferredLang);
        navigate('/select-role');
      } else {
        setError(res.error || 'Failed to create account.');
      }
    }
  };

  const handleDemo = async (role: 'farmer' | 'restaurant' | 'wholesale') => {
    setIsSubmitting(true);
    await quickDemoLogin(role);
    setIsSubmitting(false);
    if (role === 'farmer') {
      navigate('/dashboard/supplier');
    } else {
      navigate('/dashboard/buyer');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo and Brand */}
        <div className="flex justify-center items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center text-white shadow-lg">
            <Sprout className="w-7 h-7 text-emerald-300" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-black text-stone-900 tracking-tight font-display">
              {t('appName', 'KisanSetu')}
            </h1>
            <p className="text-xs text-stone-500 font-medium">
              {t('tagline', 'Direct Farm to Buyer Marketplace')}
            </p>
          </div>
        </div>

        {/* Global Language Selector on Auth */}
        <div className="mt-4 flex justify-center">
          <div className="inline-flex items-center gap-1 bg-white p-1 rounded-xl border border-stone-200 shadow-2xs">
            <Globe className="w-3.5 h-3.5 text-emerald-600 ml-1.5" />
            <select
              value={currentLanguage}
              onChange={e => {
                const l = e.target.value as SupportedLanguage;
                setLanguage(l);
                setPreferredLang(l);
              }}
              className="text-xs font-semibold bg-transparent border-none text-stone-700 py-1 pr-6 focus:outline-none cursor-pointer"
            >
              {languages.map(l => (
                <option key={l.code} value={l.code}>
                  {l.nativeName} ({l.name})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-5 sm:px-8 shadow-xl border border-stone-200/80 rounded-3xl">
          {/* Tab Selector */}
          <div className="flex border-b border-stone-200 pb-3 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`flex-1 text-center py-2 text-sm font-bold border-b-2 transition-all ${
                mode === 'signin'
                  ? 'border-emerald-700 text-emerald-900'
                  : 'border-transparent text-stone-400 hover:text-stone-600'
              }`}
            >
              {t('signIn', 'Sign In')}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`flex-1 text-center py-2 text-sm font-bold border-b-2 transition-all ${
                mode === 'signup'
                  ? 'border-emerald-700 text-emerald-900'
                  : 'border-transparent text-stone-400 hover:text-stone-600'
              }`}
            >
              {t('createAccount', 'Create Account')}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    {t('fullName', 'Full Name')} *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder={t('fullNamePlaceholder', 'e.g. Ramesh Patel')}
                      className="w-full text-xs pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-emerald-600"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    {t('location', 'Location (City / District)')} *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder={t('locationPlaceholder', 'e.g. Nashik, Maharashtra')}
                      className="w-full text-xs pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-emerald-600"
                    />
                  </div>
                </div>

                {/* Preferred Language */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    {t('preferredLanguage', 'Preferred Language')}
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <select
                      value={preferredLang}
                      onChange={e => {
                        const l = e.target.value as SupportedLanguage;
                        setPreferredLang(l);
                        setLanguage(l);
                      }}
                      className="w-full text-xs pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-emerald-600 cursor-pointer"
                    >
                      {languages.map(l => (
                        <option key={l.code} value={l.code}>
                          {l.nativeName} ({l.name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Mobile Phone Number */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                {t('phoneNumber', 'Phone Number')} *
              </label>
              <div className="relative flex">
                <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-stone-300 bg-stone-100 text-stone-500 font-bold text-xs">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder={t('phoneNumberPlaceholder', '10-digit mobile number')}
                  className="w-full text-xs px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-r-xl focus:bg-white focus:outline-emerald-600 font-mono"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                {t('password', 'Password')} *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t('passwordPlaceholder', 'Enter secure password')}
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-emerald-600"
                />
              </div>
            </div>

            {/* Retype Password for Signup */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  {t('confirmPassword', 'Retype Password')} *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder={t('confirmPasswordPlaceholder', 'Confirm password')}
                    className="w-full text-xs pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-emerald-600"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <span>Verifying...</span>
              ) : mode === 'signin' ? (
                <>
                  <span>{t('signIn', 'Sign In')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>{t('createAccount', 'Create Account & Continue')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* One-Click Demo Profiles for Evaluator */}
          <div className="mt-6 pt-5 border-t border-stone-200">
            <div className="text-center text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2.5">
              ⚡ {t('quickDemoLogin', 'One-Click Fast Demo Login')}
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleDemo('farmer')}
                className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 font-semibold text-xs rounded-xl flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span>🌾</span>
                  <span>{t('demoFarmer', 'Login as Ramesh (Farmer - Nashik)')}</span>
                </span>
                <span className="text-[10px] bg-emerald-200/70 text-emerald-900 px-1.5 py-0.5 rounded font-mono">
                  Supplier
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDemo('restaurant')}
                className="w-full py-2 px-3 bg-teal-50 hover:bg-teal-100 border border-teal-300 text-teal-950 font-semibold text-xs rounded-xl flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span>🍽️</span>
                  <span>{t('demoBuyerRestaurant', 'Login as Anita (Restaurant Buyer)')}</span>
                </span>
                <span className="text-[10px] bg-teal-200/70 text-teal-900 px-1.5 py-0.5 rounded font-mono">
                  Buyer
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDemo('wholesale')}
                className="w-full py-2 px-3 bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 font-semibold text-xs rounded-xl flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span>🏪</span>
                  <span>{t('demoBuyerWholesale', 'Login as GreenGrocers (Wholesale)')}</span>
                </span>
                <span className="text-[10px] bg-stone-300 text-stone-800 px-1.5 py-0.5 rounded font-mono">
                  Distributor
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
