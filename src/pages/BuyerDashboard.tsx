import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  ShoppingBag,
  Building2,
  Clock,
  Filter,
  CheckCircle,
  Truck,
  RotateCcw,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { Product, Order, ProduceCategory } from '../types';
import { ProductCard } from '../components/ProductCard';
import { OrderStatusStepper } from '../components/OrderStatusStepper';
import { CartDrawer } from '../components/CartDrawer';

export const BuyerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { setIsOpen: openCartDrawer, items: cartItems } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Active view: catalog vs active procurement orders
  const [activeTab, setActiveTab] = useState<'catalog' | 'orders'>('catalog');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(2000);
  const [freshnessFilter, setFreshnessFilter] = useState<'all' | 'today' | '48h'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high' | 'stock'>('newest');

  const fetchCatalogAndOrders = async () => {
    try {
      setLoading(true);
      const [prodsRes, ordersRes] = await Promise.all([
        axios.get('/api/products', {
          params: {
            category: selectedCategory,
            maxPrice,
            search: searchQuery,
            freshness: freshnessFilter,
          },
        }),
        axios.get('/api/orders/buyer'),
      ]);

      if (prodsRes.data?.products) setProducts(prodsRes.data.products);
      if (ordersRes.data?.orders) setOrders(ordersRes.data.orders);
    } catch (err) {
      console.warn('Buyer data fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogAndOrders();
  }, [selectedCategory, maxPrice, freshnessFilter, searchQuery]);

  // Client-side Sorting
  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === 'price_low') return a.basePrice - b.basePrice;
    if (sortBy === 'price_high') return b.basePrice - a.basePrice;
    if (sortBy === 'stock') return b.availableStock - a.availableStock;
    return new Date(b.harvestDate).getTime() - new Date(a.harvestDate).getTime();
  });

  const categories: { key: string; labelKey: string; icon: string }[] = [
    { key: 'all', labelKey: 'allCategories', icon: '🌾' },
    { key: 'vegetables', labelKey: 'vegetables', icon: '🥦' },
    { key: 'fruits', labelKey: 'fruits', icon: '🥭' },
    { key: 'grains', labelKey: 'grains', icon: '🌾' },
    { key: 'spices', labelKey: 'spices', icon: '🌶️' },
    { key: 'dairy', labelKey: 'dairy', icon: '🍯' },
  ];

  const activeOrdersCount = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length;

  return (
    <div className="min-h-screen bg-[#f4f7f8] pb-16">
      {/* Fresh Teal & Cool Slate Procurement Header */}
      <div className="bg-gradient-to-r from-[#028090] via-[#00707f] to-[#1e3d59] text-white pt-8 pb-10 px-4 sm:px-6 lg:px-8 border-b border-[#028090]/40">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-200">
                <Building2 className="w-4 h-4" />
                <span>Commercial Procurement Desk • {user?.subRole || 'Wholesale Buyer'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                {t('catalogTitle', 'Fresh Produce Direct from Farms')}
              </h1>
              <p className="text-xs text-teal-100/90 mt-1">
                {t(
                  'catalogSubtitle',
                  'Direct farm sourcing with tiered bulk savings and live 10-minute MongoDB stock locking.'
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => openCartDrawer(true)}
                className="px-4 py-2.5 bg-white text-[#028090] hover:bg-teal-50 rounded-xl text-xs font-extrabold shadow-md flex items-center gap-2 transition-all active:scale-98"
              >
                <ShoppingBag className="w-4 h-4 text-[#028090]" />
                <span>Procurement Cart</span>
                {cartItems.length > 0 && (
                  <span className="bg-[#028090] text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {cartItems.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search Bar & Primary Category Tabs */}
          <div className="mt-6 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder', 'Search vegetables, fruits, grains, spices, farmer, or mandi region...')}
                className="w-full pl-10 pr-4 py-3 bg-white text-stone-900 rounded-2xl text-xs font-medium placeholder-stone-400 focus:outline-none shadow-sm"
              />
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs p-1 rounded-2xl border border-white/20">
              <span className="text-xs text-teal-100 pl-2 font-medium">{t('sortBy', 'Sort')}:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-transparent text-white text-xs font-bold py-1.5 pr-4 pl-1 focus:outline-none cursor-pointer"
              >
                <option value="newest" className="text-stone-900">{t('sortNewest', 'Latest Harvest')}</option>
                <option value="price_low" className="text-stone-900">{t('sortPriceLow', 'Price: Low to High')}</option>
                <option value="price_high" className="text-stone-900">{t('sortPriceHigh', 'Price: High to Low')}</option>
                <option value="stock" className="text-stone-900">{t('sortStock', 'Highest Stock')}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Navigation Tabs: Catalog vs My Orders */}
        <div className="flex border-b border-stone-200 mb-6 bg-white rounded-2xl p-1.5 shadow-2xs border">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'catalog'
                ? 'bg-[#028090] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Farm Catalog & Tiered Pricing</span>
            <span className="bg-white/20 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {sortedProducts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'orders'
                ? 'bg-[#028090] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>My Active Procurement Orders</span>
            {activeOrdersCount > 0 && (
              <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {activeOrdersCount}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'catalog' ? (
          <div>
            {/* Filter Bar: Categories, Freshness, Max Price */}
            <div className="bg-white rounded-2xl border border-stone-200 p-4 mb-6 shadow-2xs space-y-3">
              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {categories.map(cat => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      selectedCategory === cat.key
                        ? 'bg-[#028090] text-white shadow-xs'
                        : 'bg-stone-100 hover:bg-stone-200/70 text-stone-700'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{t(cat.labelKey, cat.key)}</span>
                  </button>
                ))}
              </div>

              {/* Sub-Filters: Freshness & Max Price */}
              <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-4 text-xs">
                {/* Freshness Badge Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-stone-500 font-semibold">{t('filterFreshness', 'Harvest Freshness')}:</span>
                  <div className="flex items-center bg-stone-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setFreshnessFilter('all')}
                      className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-colors ${
                        freshnessFilter === 'all' ? 'bg-white text-stone-900 font-bold shadow-2xs' : 'text-stone-600'
                      }`}
                    >
                      {t('allFreshness', 'All Harvests')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFreshnessFilter('today')}
                      className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-colors ${
                        freshnessFilter === 'today' ? 'bg-emerald-600 text-white font-bold shadow-2xs' : 'text-stone-600'
                      }`}
                    >
                      🌟 {t('todayHarvest', 'Picked Today')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFreshnessFilter('48h')}
                      className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-colors ${
                        freshnessFilter === '48h' ? 'bg-teal-700 text-white font-bold shadow-2xs' : 'text-stone-600'
                      }`}
                    >
                      {t('past2Days', 'Within 48h')}
                    </button>
                  </div>
                </div>

                {/* Max Price Range Slider */}
                <div className="flex items-center gap-3">
                  <span className="text-stone-500 font-semibold">
                    {t('filterByPrice', 'Max Base Price')}: <span className="font-bold text-stone-900">₹{maxPrice}</span>
                  </span>
                  <input
                    type="range"
                    min="20"
                    max="2000"
                    step="20"
                    value={maxPrice}
                    onChange={e => setMaxPrice(Number(e.target.value))}
                    className="w-32 accent-[#028090] cursor-pointer"
                  />
                  {maxPrice < 2000 && (
                    <button
                      type="button"
                      onClick={() => setMaxPrice(2000)}
                      className="text-[10px] text-stone-400 hover:text-stone-700"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Produce Card Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <div key={n} className="bg-white rounded-2xl h-80 border border-stone-200 animate-pulse p-4">
                    <div className="bg-stone-200 h-40 rounded-xl mb-3" />
                    <div className="h-4 bg-stone-200 rounded w-2/3 mb-2" />
                    <div className="h-4 bg-stone-200 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-stone-200">
                <span className="text-4xl block mb-2">🔍</span>
                <h3 className="font-bold text-stone-800 text-base">No produce matching your criteria</h3>
                <p className="text-stone-500 text-xs mt-1">
                  Try clearing your search filters or adjusting the price range slider.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setMaxPrice(2000);
                    setFreshnessFilter('all');
                  }}
                  className="mt-4 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Orders Tab: Active Procurement Orders with 5-stage Stepper */
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-stone-200">
                <span className="text-4xl block mb-2">📋</span>
                <h3 className="font-bold text-stone-800 text-base">No procurement orders placed yet</h3>
                <p className="text-stone-500 text-xs mt-1">
                  Browse the fresh produce catalog and click "Lock & Add to Cart" to start sourcing directly from farmers.
                </p>
              </div>
            ) : (
              orders.map(order => (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-stone-200/90 shadow-xs hover:shadow-md transition-all p-5 sm:p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-stone-900 text-sm">
                          #{order.orderNumber}
                        </span>
                        <span className="text-xs bg-teal-50 text-[#028090] font-bold px-2 py-0.5 rounded border border-teal-200">
                          Farm: {order.farmerName}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">
                        Placed on {new Date(order.createdAt).toLocaleDateString()} • Farmer Phone:{' '}
                        <span className="font-mono text-emerald-800 font-semibold">{order.farmerPhone}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-stone-400 block">Total Payable:</span>
                      <span className="text-xl font-extrabold text-[#028090]">₹{order.totalAmount}</span>
                    </div>
                  </div>

                  {/* 5-Stage Stepper Component */}
                  <div className="py-4">
                    <OrderStatusStepper order={order} />
                  </div>

                  {/* Items Summary */}
                  <div className="bg-stone-50/70 rounded-2xl p-3 border border-stone-100 space-y-2 text-xs">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1 border-b border-stone-100 last:border-none">
                        <div className="flex items-center gap-2">
                          {item.photo && (
                            <img src={item.photo} alt={item.name} className="w-8 h-8 rounded-lg object-cover" />
                          )}
                          <div>
                            <span className="font-bold text-stone-900">{item.name}</span>
                            <span className="text-stone-500 text-[11px] block">
                              ₹{item.unitPrice}/{item.unit}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-bold text-stone-800">
                            {item.acceptedQuantity} {item.unit}
                          </span>
                          <span className="text-stone-500 text-[11px] block">
                            ₹{item.totalItemPrice}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Logistics & Payment */}
                  <div className="mt-4 pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-600">
                    <div>
                      <span className="font-semibold text-stone-800">Pickup Slot:</span> {order.pickupSlot} •{' '}
                      <span className="font-semibold text-stone-800">Payment:</span>{' '}
                      <span className="uppercase">{order.paymentMethod.replace(/_/g, ' ')}</span>
                    </div>

                    <div className="text-stone-400 text-[11px]">
                      Updated: {new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Cart Drawer */}
      <CartDrawer />
    </div>
  );
};
