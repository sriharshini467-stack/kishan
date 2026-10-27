import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sprout,
  ShoppingBag,
  Globe,
  Bell,
  LogOut,
  RefreshCw,
  UserCheck,
  ChevronDown,
  Layers,
  Building2,
  Tractor,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { SupportedLanguage } from '../i18n/translations';
import { NotificationCenter } from './NotificationCenter';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, switchRole } = useAuth();
  const { currentLanguage, setLanguage, languages, t } = useLanguage();
  const { items, setIsOpen, secondsRemaining } = useCart();

  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const handleLanguageSelect = (lang: SupportedLanguage) => {
    setLanguage(lang);
    setIsLangDropdownOpen(false);
  };

  const handleSwitchWorkspace = async () => {
    if (!user) return;
    setSwitching(true);
    const targetRole = user.primaryRole === 'supplier' ? 'buyer' : 'supplier';
    await switchRole(targetRole);
    setSwitching(false);
    navigate(targetRole === 'supplier' ? '/dashboard/supplier' : '/dashboard/buyer');
  };

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timerStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div
            onClick={() => {
              if (!isAuthenticated) navigate('/auth');
              else if (user?.primaryRole === 'supplier') navigate('/dashboard/supplier');
              else if (user?.primaryRole === 'buyer') navigate('/dashboard/buyer');
              else navigate('/select-role');
            }}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <Sprout className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-stone-900 font-display">
                  {t('appName', 'KisanSetu')}
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded uppercase">
                  Agri-B2B
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block leading-none">
                {t('tagline', 'Direct Farm to Buyer Marketplace')}
              </p>
            </div>
          </div>

          {/* Center: Current Workspace Pill & Switcher */}
          {isAuthenticated && user?.primaryRole !== 'unassigned' && (
            <div className="hidden md:flex items-center gap-2 bg-stone-100 p-1 rounded-xl border border-stone-200">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  user?.primaryRole === 'supplier'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-teal-700 text-white shadow-xs'
                }`}
              >
                {user?.primaryRole === 'supplier' ? (
                  <>
                    <Tractor className="w-3.5 h-3.5 text-amber-300" />
                    <span>{t('supplierWorkspace', 'Farmer / Supplier Desk')}</span>
                  </>
                ) : (
                  <>
                    <Building2 className="w-3.5 h-3.5 text-teal-200" />
                    <span>{t('buyerWorkspace', 'Buyer / Procurement Desk')}</span>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={handleSwitchWorkspace}
                disabled={switching}
                className="flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 font-medium px-2 py-1 rounded-md hover:bg-stone-200/80 transition-colors"
                title="Switch view between Farmer and Buyer roles"
              >
                <RefreshCw className={`w-3 h-3 ${switching ? 'animate-spin' : ''}`} />
                <span>{t('switchRole', 'Switch View')}</span>
              </button>
            </div>
          )}

          {/* Right Controls: Language Selector, Cart, Notifications, User */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-medium text-stone-700 transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-semibold uppercase">{currentLanguage}</span>
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </button>

              {isLangDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-stone-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100">
                    Select Language / भाषा चुनें
                  </div>
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang.code)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                        currentLanguage === lang.code
                          ? 'bg-emerald-50 text-emerald-900 font-bold'
                          : 'text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.nativeName}</span>
                      </span>
                      <span className="text-[10px] text-stone-400">{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Center Trigger */}
            <button
              type="button"
              onClick={() => setIsNotifOpen(true)}
              className="relative p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              title="Twilio/Brevo SMS Alerts Log"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            </button>

            {/* Procurement Cart Button (Visible for Buyer and test convenience) */}
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-bold transition-all"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-700" />
              <span>Cart</span>
              {items.length > 0 && (
                <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                  {items.length}
                </span>
              )}
              {secondsRemaining > 0 && items.length > 0 && (
                <span className="text-[10px] font-mono text-amber-700 bg-amber-100 px-1 rounded ml-0.5">
                  {timerStr}
                </span>
              )}
            </button>

            {/* User Session or Login */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
                <div className="hidden lg:block text-right">
                  <div className="text-xs font-bold text-stone-900 leading-tight truncate max-w-[120px]">
                    {user?.name}
                  </div>
                  <div className="text-[10px] text-stone-500 capitalize">{user?.subRole || user?.primaryRole}</div>
                </div>
                <button
                  onClick={logout}
                  title={t('logout', 'Sign Out')}
                  className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/auth')}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                {t('signIn', 'Sign In')}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Notifications Slideover */}
      <NotificationCenter isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </>
  );
};
