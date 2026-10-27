import React, { useState } from 'react';
import { Sparkles, MapPin, Clock, Layers, ShieldCheck, ShoppingCart, Check, Info } from 'lucide-react';
import { Product } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  onQuickToggleStock?: (productId: string) => void;
  isOwner?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickToggleStock, isOwner }) => {
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const [selectedQty, setSelectedQty] = useState<number>(1);
  const [showTiersModal, setShowTiersModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Compute Freshness Badge
  const getFreshnessBadge = (harvestDateStr: string) => {
    const now = Date.now();
    const harvestTime = new Date(harvestDateStr).getTime();
    const hoursAgo = Math.max(0, Math.floor((now - harvestTime) / (3600 * 1000)));

    if (hoursAgo < 16) {
      return {
        label: t('freshnessToday', 'Picked Today'),
        badgeClass: 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400',
        icon: Sparkles,
      };
    } else if (hoursAgo < 40) {
      return {
        label: t('freshnessYesterday', 'Harvested Yesterday'),
        badgeClass: 'bg-teal-700 text-white',
        icon: Sparkles,
      };
    } else if (hoursAgo < 72) {
      return {
        label: t('freshness2Days', 'Fresh (2 days ago)'),
        badgeClass: 'bg-amber-600 text-white',
        icon: Clock,
      };
    } else {
      return {
        label: t('freshnessStored', 'Farm Cured & Stored'),
        badgeClass: 'bg-stone-700 text-white',
        icon: ShieldCheck,
      };
    }
  };

  const freshness = getFreshnessBadge(product.harvestDate);
  const FreshnessIcon = freshness.icon;

  // Calculate active tier price based on current quantity selector
  const getCurrentTierPrice = (qty: number) => {
    if (!product.tieredPricing || product.tieredPricing.length === 0) {
      return product.basePrice;
    }
    const sorted = [...product.tieredPricing].sort((a, b) => b.minQty - a.minQty);
    for (const tier of sorted) {
      if (qty >= tier.minQty) {
        return tier.pricePerUnit;
      }
    }
    return product.basePrice;
  };

  const currentUnitPrice = getCurrentTierPrice(selectedQty);
  const totalCalculated = currentUnitPrice * selectedQty;
  const savingsPerUnit = product.basePrice - currentUnitPrice;

  const handleAddToCart = async () => {
    if (selectedQty <= 0 || selectedQty > product.availableStock) return;
    setIsAdding(true);
    const res = await addToCart(product, selectedQty);
    setIsAdding(false);
    if (res.success) {
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2000);
    }
  };

  const stockPercentage = Math.min(100, Math.round((product.availableStock / Math.max(1, product.totalStock)) * 100));
  const isLowStock = product.availableStock > 0 && product.availableStock < 25;

  return (
    <div
      className={`group relative bg-white rounded-2xl border transition-all duration-300 flex flex-col overflow-hidden shadow-sm hover:shadow-md ${
        !product.isAvailable ? 'opacity-70 border-stone-300' : 'border-stone-200/90 hover:border-emerald-300'
      }`}
    >
      {/* Product Image & Badges */}
      <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
        <img
          src={product.photos[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Freshness Badge */}
        <div className="absolute top-2.5 left-2.5 flex items-center space-x-1">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${freshness.badgeClass}`}
          >
            <FreshnessIcon className="w-3 h-3" />
            {freshness.label}
          </span>
        </div>

        {/* Availability indicator */}
        <div className="absolute top-2.5 right-2.5">
          {product.isAvailable ? (
            <span className="bg-emerald-500/95 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
              {t('inStock', 'In Stock')}
            </span>
          ) : (
            <span className="bg-stone-800/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
              {t('outOfStock', 'Out of Stock')}
            </span>
          )}
        </div>

        {/* Pickup slot banner */}
        <div className="absolute bottom-0 inset-x-0 bg-stone-900/75 backdrop-blur-xs text-stone-200 px-3 py-1 text-[11px] flex items-center justify-between">
          <div className="flex items-center gap-1 truncate">
            <Clock className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">{product.pickupWindow}</span>
          </div>
          <span className="text-[10px] text-stone-300 capitalize">{product.microCategory}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Title & Origin */}
        <div className="mb-2">
          <h3 className="font-bold text-stone-900 text-base leading-snug line-clamp-1 group-hover:text-emerald-800 transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-1 text-xs text-stone-500 mt-0.5">
            <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="truncate">{product.farmerName} • {product.farmerLocation}</span>
          </div>
        </div>

        {/* Stock Status Bar */}
        <div className="my-2 p-2 bg-stone-50 rounded-xl border border-stone-100">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-stone-500">
              {t('stockAvailable', 'Available Stock')}:
            </span>
            <span className={`font-semibold ${isLowStock ? 'text-amber-700' : 'text-stone-800'}`}>
              {product.availableStock} {product.unit} {isLowStock && '(Low Stock!)'}
            </span>
          </div>
          <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isLowStock ? 'bg-amber-500' : 'bg-emerald-600'
              }`}
              style={{ width: `${stockPercentage}%` }}
            />
          </div>
        </div>

        {/* Tiered Bulk Pricing Section */}
        <div className="mt-1 mb-3">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xs text-stone-400 font-medium">{t('retailPrice', 'Retail Base')}: </span>
              <span className="text-xl font-extrabold text-stone-900">₹{currentUnitPrice}</span>
              <span className="text-xs text-stone-500">/{product.unit}</span>
            </div>
            {savingsPerUnit > 0 && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                Save ₹{savingsPerUnit}/{product.unit}!
              </span>
            )}
          </div>

          {/* Interactive Tier Preview Button */}
          {product.tieredPricing && product.tieredPricing.length > 0 && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowTiersModal(!showTiersModal)}
                className="w-full flex items-center justify-between text-xs font-medium text-emerald-800 hover:text-emerald-950 bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/60 rounded-lg px-2.5 py-1.5 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  {t('viewTiers', 'Tiered Wholesale Pricing')}
                </span>
                <Info className="w-3 h-3 text-emerald-600" />
              </button>

              {/* Tier breakdown cards */}
              {showTiersModal && (
                <div className="mt-2 space-y-1.5 p-2 bg-stone-50 rounded-xl border border-stone-200 text-xs animate-in fade-in duration-200">
                  {product.tieredPricing.map((tier, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-1.5 rounded-lg ${
                        selectedQty >= tier.minQty && (tier.maxQty === undefined || selectedQty <= tier.maxQty)
                          ? 'bg-emerald-100 text-emerald-950 font-bold border border-emerald-300'
                          : 'bg-white text-stone-700 border border-stone-100'
                      }`}
                    >
                      <span>
                        {tier.label || (tier.maxQty ? `${tier.minQty} - ${tier.maxQty} ${product.unit}` : `>${tier.minQty} ${product.unit}`)}
                      </span>
                      <span className="font-semibold text-emerald-800">
                        ₹{tier.pricePerUnit}/{product.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Controls for Buyer vs Farmer */}
        <div className="mt-auto pt-2 border-t border-stone-100">
          {isOwner ? (
            /* Farmer Controls: Quick Stock Toggle */
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onQuickToggleStock && onQuickToggleStock(product.id)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  product.isAvailable
                    ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                    : 'bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100'
                }`}
              >
                {product.isAvailable ? t('outOfStock', 'Mark Out of Stock') : t('inStock', 'Mark In Stock')}
              </button>
            </div>
          ) : (
            /* Buyer Controls: Quantity Selector & 10-Minute Stock Lock */
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center border border-stone-300 rounded-lg overflow-hidden bg-stone-50 h-9 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedQty(Math.max(1, selectedQty - (product.unit === 'kg' ? 5 : 1)))}
                    className="px-2.5 hover:bg-stone-200 text-stone-700 font-bold transition-colors"
                    disabled={selectedQty <= 1 || !product.isAvailable}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={product.availableStock}
                    value={selectedQty}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 1;
                      setSelectedQty(Math.min(product.availableStock, Math.max(1, val)));
                    }}
                    disabled={!product.isAvailable}
                    className="w-14 text-center font-bold text-xs bg-transparent border-none focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedQty(Math.min(product.availableStock, selectedQty + (product.unit === 'kg' ? 5 : 1)))}
                    className="px-2.5 hover:bg-stone-200 text-stone-700 font-bold transition-colors"
                    disabled={selectedQty >= product.availableStock || !product.isAvailable}
                  >
                    +
                  </button>
                </div>

                <div className="text-right flex-1 truncate">
                  <span className="text-[10px] text-stone-400 block">{t('subtotal', 'Total')}:</span>
                  <span className="font-extrabold text-stone-900 text-sm">₹{totalCalculated}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!product.isAvailable || product.availableStock <= 0 || isAdding}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all duration-200 ${
                  addedSuccess
                    ? 'bg-emerald-700 text-white'
                    : !product.isAvailable || product.availableStock <= 0
                    ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white'
                }`}
              >
                {addedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-200" />
                    <span>Locked & In Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>{t('addToCart', 'Lock & Add to Cart')}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
