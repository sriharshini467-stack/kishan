import React, { useState } from 'react';
import { X, Plus, Sparkles, Layers, Calendar, Clock, MapPin } from 'lucide-react';
import { ProduceCategory, PricingTier } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface NewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export const NewProductModal: React.FC<NewProductModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [microCategory, setMicroCategory] = useState<ProduceCategory>('vegetables');
  const [unit, setUnit] = useState<'kg' | 'crate' | 'ton' | 'bag' | 'quintal'>('kg');
  const [totalStock, setTotalStock] = useState('500');
  const [basePrice, setBasePrice] = useState('40');
  const [harvestDate, setHarvestDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [pickupWindow, setPickupWindow] = useState('Daily 7:00 AM - 11:30 AM');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState(
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80'
  );

  // 3 Pricing Tiers
  const [tier1Min, setTier1Min] = useState('1');
  const [tier1Max, setTier1Max] = useState('20');
  const [tier1Price, setTier1Price] = useState('40');

  const [tier2Min, setTier2Min] = useState('21');
  const [tier2Max, setTier2Max] = useState('100');
  const [tier2Price, setTier2Price] = useState('35');

  const [tier3Min, setTier3Min] = useState('101');
  const [tier3Price, setTier3Price] = useState('30');

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const basePriceNum = Number(basePrice) || 40;
    const tiers: PricingTier[] = [
      {
        minQty: Number(tier1Min) || 1,
        maxQty: Number(tier1Max) || 20,
        pricePerUnit: Number(tier1Price) || basePriceNum,
        label: `Retail (${tier1Min}-${tier1Max} ${unit})`,
      },
      {
        minQty: Number(tier2Min) || 21,
        maxQty: Number(tier2Max) || 100,
        pricePerUnit: Number(tier2Price) || Math.round(basePriceNum * 0.88),
        label: `Bulk (${tier2Min}-${tier2Max} ${unit})`,
      },
      {
        minQty: Number(tier3Min) || 101,
        maxQty: undefined,
        pricePerUnit: Number(tier3Price) || Math.round(basePriceNum * 0.75),
        label: `Wholesale (> ${tier3Min} ${unit})`,
      },
    ];

    await onSubmit({
      name,
      microCategory,
      unit,
      totalStock: Number(totalStock),
      basePrice: basePriceNum,
      tieredPricing: tiers,
      harvestDate: new Date(harvestDate).toISOString(),
      pickupWindow,
      description,
      photos: [photoUrl],
    });

    setIsSubmitting(false);
    onClose();
  };

  const samplePhotoPresets = [
    { label: 'Red Onions', url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=800&q=80' },
    { label: 'Tomatoes', url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80' },
    { label: 'Mangoes', url: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80' },
    { label: 'Wheat/Grains', url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80' },
    { label: 'Turmeric/Spices', url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🌱</span>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">{t('addNewProduce', 'List New Fresh Harvest')}</h3>
              <p className="text-xs text-stone-500">Configure produce details, tiered bulk pricing, and fulfillment slots</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {/* Produce Name & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-800 mb-1">Produce Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Nashik Red Onions (Grade A)"
                className="w-full p-2.5 border border-stone-300 rounded-xl focus:outline-emerald-600 bg-stone-50"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">Micro-Category *</label>
              <select
                value={microCategory}
                onChange={e => setMicroCategory(e.target.value as ProduceCategory)}
                className="w-full p-2.5 border border-stone-300 rounded-xl focus:outline-emerald-600 bg-stone-50"
              >
                <option value="vegetables">{t('vegetables', 'Vegetables')}</option>
                <option value="fruits">{t('fruits', 'Fruits')}</option>
                <option value="grains">{t('grains', 'Grains & Pulses')}</option>
                <option value="spices">{t('spices', 'Spices & Herbs')}</option>
                <option value="dairy">{t('dairy', 'Farmstead Dairy & Honey')}</option>
              </select>
            </div>
          </div>

          {/* Unit, Total Stock, Base Price */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-stone-800 mb-1">Fulfillment Unit</label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value as any)}
                className="w-full p-2.5 border border-stone-300 rounded-xl focus:outline-emerald-600 bg-stone-50 uppercase font-semibold"
              >
                <option value="kg">kg (Kilograms)</option>
                <option value="crate">crate (Crates)</option>
                <option value="bag">bag (Sacks / Bags)</option>
                <option value="quintal">quintal (100 kg)</option>
                <option value="ton">ton (Metric Tons)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">Total Available Stock *</label>
              <input
                type="number"
                required
                min="1"
                value={totalStock}
                onChange={e => setTotalStock(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-xl focus:outline-emerald-600 bg-stone-50 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">Base Price per Unit (₹) *</label>
              <input
                type="number"
                required
                min="1"
                value={basePrice}
                onChange={e => {
                  setBasePrice(e.target.value);
                  setTier1Price(e.target.value);
                  setTier2Price(String(Math.round(Number(e.target.value) * 0.88)));
                  setTier3Price(String(Math.round(Number(e.target.value) * 0.75)));
                }}
                className="w-full p-2.5 border border-stone-300 rounded-xl focus:outline-emerald-600 bg-stone-50 font-bold text-emerald-900"
              />
            </div>
          </div>

          {/* Tiered Bulk Pricing Builder */}
          <div className="p-3 bg-stone-100/70 border border-stone-200 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-stone-900">
              <Layers className="w-4 h-4 text-emerald-700" />
              <span>Tiered Wholesale & Commercial Pricing:</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-2.5 rounded-lg border border-stone-200 space-y-1">
                <span className="font-bold text-stone-700 block">Tier 1: Retail</span>
                <span className="text-stone-400 text-[10px]">Min: {tier1Min} - Max: {tier1Max} {unit}</span>
                <div className="flex items-center gap-1">
                  <span className="font-bold">₹</span>
                  <input
                    type="number"
                    value={tier1Price}
                    onChange={e => setTier1Price(e.target.value)}
                    className="w-full font-bold p-1 border rounded"
                  />
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-stone-200 space-y-1">
                <span className="font-bold text-stone-700 block">Tier 2: Commercial</span>
                <span className="text-stone-400 text-[10px]">Min: {tier2Min} - Max: {tier2Max} {unit}</span>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-emerald-700">₹</span>
                  <input
                    type="number"
                    value={tier2Price}
                    onChange={e => setTier2Price(e.target.value)}
                    className="w-full font-bold p-1 border rounded text-emerald-800"
                  />
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-stone-200 space-y-1">
                <span className="font-bold text-stone-700 block">Tier 3: Wholesale Mandi</span>
                <span className="text-stone-400 text-[10px]">Volume: &gt; {tier3Min} {unit}</span>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-emerald-700">₹</span>
                  <input
                    type="number"
                    value={tier3Price}
                    onChange={e => setTier3Price(e.target.value)}
                    className="w-full font-bold p-1 border rounded text-emerald-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Harvest Date & Fulfillment Window */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-800 mb-1">
                <Calendar className="w-3.5 h-3.5 inline text-emerald-600 mr-1" />
                Harvest Date (determines Freshness Badge)
              </label>
              <input
                type="date"
                required
                value={harvestDate}
                onChange={e => setHarvestDate(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-xl focus:outline-emerald-600 bg-stone-50"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">
                <Clock className="w-3.5 h-3.5 inline text-amber-600 mr-1" />
                Available Pickup / Fulfillment Window
              </label>
              <input
                type="text"
                required
                value={pickupWindow}
                onChange={e => setPickupWindow(e.target.value)}
                placeholder="e.g. Daily 7:00 AM - 11:30 AM"
                className="w-full p-2.5 border border-stone-300 rounded-xl focus:outline-emerald-600 bg-stone-50"
              />
            </div>
          </div>

          {/* Description & Photo Presets */}
          <div>
            <label className="block font-bold text-stone-800 mb-1">Produce Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Mention variety, grading, post-harvest curing, and packaging specifications"
              className="w-full p-2.5 border border-stone-300 rounded-xl focus:outline-emerald-600 bg-stone-50"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-800 mb-1">Produce Photo URL or Quick Presets</label>
            <input
              type="url"
              value={photoUrl}
              onChange={e => setPhotoUrl(e.target.value)}
              className="w-full p-2 border border-stone-300 rounded-lg text-[11px] mb-2 font-mono bg-stone-50"
            />
            <div className="flex flex-wrap gap-1.5">
              {samplePhotoPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPhotoUrl(preset.url)}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors border ${
                    photoUrl === preset.url
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-stone-200 rounded-xl font-semibold text-stone-600 hover:bg-stone-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Harvest Listing</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
