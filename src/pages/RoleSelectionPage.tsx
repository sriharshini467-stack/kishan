import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tractor, Building2, Check, ArrowRight, ShieldCheck, Sparkles, Store, Utensils, Warehouse, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { PrimaryRole, SubRole } from '../types';

export const RoleSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, selectRole } = useAuth();
  const { t } = useLanguage();

  const [selectedRole, setSelectedRole] = useState<PrimaryRole>(
    user?.primaryRole && user.primaryRole !== 'unassigned' ? user.primaryRole : 'supplier'
  );
  const [selectedSubRole, setSelectedSubRole] = useState<SubRole>('farmer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supplierSubRoles = [
    { id: 'farmer', name: t('farmer', 'Independent Farmer'), icon: Tractor, desc: 'Smallholder, orchardist, or multi-crop grower' },
    { id: 'foodHub', name: t('foodHub', 'Agri Food Hub / FPO'), icon: Warehouse, desc: 'Farmer Producer Organizations & aggregation centers' },
    { id: 'csa', name: t('csa', 'Community Agriculture (CSA)'), icon: Users, desc: 'Direct subscription & community farm collectives' },
  ];

  const buyerSubRoles = [
    { id: 'restaurant', name: t('restaurant', 'Restaurant & Hospitality'), icon: Utensils, desc: 'Commercial kitchens, chefs, and catering operations' },
    { id: 'grocer', name: t('grocer', 'Retail Grocer / Supermarket'), icon: Store, desc: 'Local neighbourhood retail outlets and grocery chains' },
    { id: 'distributor', name: t('distributor', 'Wholesale Distributor'), icon: Building2, desc: 'Bulk Mandi traders, institutional procurers & food processors' },
  ];

  const handleRoleSelect = (role: PrimaryRole) => {
    setSelectedRole(role);
    if (role === 'supplier') {
      setSelectedSubRole('farmer');
    } else {
      setSelectedSubRole('restaurant');
    }
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    const res = await selectRole(selectedRole, selectedSubRole);
    setIsSubmitting(false);

    if (res.success) {
      if (selectedRole === 'supplier') {
        navigate('/dashboard/supplier');
      } else {
        navigate('/dashboard/buyer');
      }
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-4xl mx-auto w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome, {user?.name || 'Member'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            {t('selectRoleTitle', 'Select Your Operational Role')}
          </h2>
          <p className="mt-2 text-sm text-stone-500 max-w-xl mx-auto">
            {t('selectRoleSubtitle', 'Choose how you want to use KisanSetu. You can also switch between Supplier and Buyer viewpoints anytime in the navigation bar.')}
          </p>
        </div>

        {/* Primary Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Supplier Option */}
          <div
            onClick={() => handleRoleSelect('supplier')}
            className={`cursor-pointer rounded-3xl p-6 sm:p-7 border-2 transition-all relative overflow-hidden flex flex-col ${
              selectedRole === 'supplier'
                ? 'bg-gradient-to-br from-emerald-900 to-stone-900 text-white border-emerald-500 shadow-xl ring-4 ring-emerald-100 scale-102'
                : 'bg-white text-stone-900 border-stone-200 hover:border-emerald-300 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  selectedRole === 'supplier' ? 'bg-emerald-600/60 text-white' : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                <Tractor className="w-7 h-7 text-amber-300" />
              </div>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                  selectedRole === 'supplier'
                    ? 'border-emerald-400 bg-emerald-500 text-white'
                    : 'border-stone-300 bg-white'
                }`}
              >
                {selectedRole === 'supplier' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            <h3 className="text-xl font-black tracking-tight mb-2">
              {t('supplierTitle', 'Supplier / Agricultural Producer')}
            </h3>
            <p
              className={`text-xs leading-relaxed mb-4 flex-1 ${
                selectedRole === 'supplier' ? 'text-emerald-100/90' : 'text-stone-500'
              }`}
            >
              {t(
                'supplierDesc',
                'For Farmers, Agricultural Food Hubs, Farm Collectives (FPOs) and CSAs selling fresh harvest directly.'
              )}
            </p>

            <div
              className={`pt-3 border-t text-xs font-semibold ${
                selectedRole === 'supplier' ? 'border-emerald-700 text-emerald-300' : 'border-stone-100 text-emerald-700'
              }`}
            >
              Features: Inventory locks, tiered bulk pricing, harvest weather, partial order acceptance.
            </div>
          </div>

          {/* Buyer Option */}
          <div
            onClick={() => handleRoleSelect('buyer')}
            className={`cursor-pointer rounded-3xl p-6 sm:p-7 border-2 transition-all relative overflow-hidden flex flex-col ${
              selectedRole === 'buyer'
                ? 'bg-gradient-to-br from-teal-900 to-slate-900 text-white border-teal-500 shadow-xl ring-4 ring-teal-100 scale-102'
                : 'bg-white text-stone-900 border-stone-200 hover:border-teal-300 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  selectedRole === 'buyer' ? 'bg-teal-600/60 text-white' : 'bg-teal-50 text-teal-700'
                }`}
              >
                <Building2 className="w-7 h-7 text-teal-300" />
              </div>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                  selectedRole === 'buyer'
                    ? 'border-teal-400 bg-teal-500 text-white'
                    : 'border-stone-300 bg-white'
                }`}
              >
                {selectedRole === 'buyer' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            <h3 className="text-xl font-black tracking-tight mb-2">
              {t('buyerTitle', 'Buyer / Commercial Procurement')}
            </h3>
            <p
              className={`text-xs leading-relaxed mb-4 flex-1 ${
                selectedRole === 'buyer' ? 'text-teal-100/90' : 'text-stone-500'
              }`}
            >
              {t(
                'buyerDesc',
                'For Restaurants, Supermarkets, Retail Grocers, Food Processors, and Bulk Distributors sourcing fresh produce.'
              )}
            </p>

            <div
              className={`pt-3 border-t text-xs font-semibold ${
                selectedRole === 'buyer' ? 'border-teal-700 text-teal-300' : 'border-stone-100 text-teal-700'
              }`}
            >
              Features: Direct farm sourcing, wholesale tiered pricing, 10-min stock reservation cart.
            </div>
          </div>
        </div>

        {/* Sub-Role Selection Cards */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-md mb-8">
          <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>{t('subRoleLabel', 'Select Sub-Category')}</span>
            <span className="text-xs text-stone-400 font-normal">
              (Tailors your dashboard views and fulfillment options)
            </span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(selectedRole === 'supplier' ? supplierSubRoles : buyerSubRoles).map(sub => {
              const SubIcon = sub.icon;
              const isSelected = selectedSubRole === sub.id;
              return (
                <div
                  key={sub.id}
                  onClick={() => setSelectedSubRole(sub.id)}
                  className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col ${
                    isSelected
                      ? selectedRole === 'supplier'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold'
                        : 'border-teal-600 bg-teal-50 text-teal-950 font-semibold'
                      : 'border-stone-200 bg-stone-50/50 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <SubIcon className={`w-5 h-5 ${isSelected ? 'text-emerald-700' : 'text-stone-500'}`} />
                    {isSelected && <Check className="w-4 h-4 text-emerald-700" />}
                  </div>
                  <span className="text-xs font-bold">{sub.name}</span>
                  <span className="text-[11px] text-stone-500 mt-1">{sub.desc}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Confirmation Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-10 py-3.5 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-extrabold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Configuring Workspace...</span>
            ) : (
              <>
                <span>{t('confirmRoleBtn', 'Continue to Dashboard')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
