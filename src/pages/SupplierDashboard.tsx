import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Tractor,
  TrendingUp,
  Clock,
  AlertTriangle,
  Package,
  Plus,
  RefreshCw,
  CheckCircle,
  History,
  CheckCircle2,
  Phone,
  MapPin,
  Calendar,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Product, Order, InventoryHistoryRecord } from '../types';
import { WeatherWidget } from '../components/WeatherWidget';
import { ProductCard } from '../components/ProductCard';
import { OrderStatusStepper } from '../components/OrderStatusStepper';
import { PartialAcceptModal } from '../components/PartialAcceptModal';
import { NewProductModal } from '../components/NewProductModal';

export const SupplierDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [history, setHistory] = useState<InventoryHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [partialModalOrder, setPartialModalOrder] = useState<Order | null>(null);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'audit'>('orders');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodsRes, ordersRes, histRes] = await Promise.all([
        axios.get('/api/products', { params: { farmerId: user?.id } }),
        axios.get('/api/orders/farmer'),
        axios.get('/api/notifications/inventory-history'),
      ]);

      if (prodsRes.data?.products) setProducts(prodsRes.data.products);
      if (ordersRes.data?.orders) setOrders(ordersRes.data.orders);
      if (histRes.data?.history) setHistory(histRes.data.history);
    } catch (err) {
      console.warn('Dashboard fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  // Quick Stock Toggle
  const handleToggleStock = async (productId: string) => {
    try {
      const res = await axios.patch(`/api/products/${productId}/toggle-stock`);
      if (res.data?.product) {
        setProducts(prev => prev.map(p => (p.id === productId ? res.data.product : p)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Product Submit
  const handleCreateProduct = async (productData: any) => {
    try {
      const res = await axios.post('/api/products', productData);
      if (res.data?.product) {
        setProducts(prev => [res.data.product, ...prev]);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to create product', err);
    }
  };

  // Update Order Status (Full Accept, Ready, Completed, Cancel)
  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const res = await axios.patch(`/api/orders/${orderId}/status`, { status: newStatus });
      if (res.data?.order) {
        setOrders(prev => prev.map(o => (o.id === orderId ? res.data.order : o)));
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Partial Accept Submit
  const handlePartialAcceptSubmit = async (
    orderId: string,
    partialItems: { productId: string; acceptedQuantity: number }[],
    reason: string
  ) => {
    try {
      const res = await axios.patch(`/api/orders/${orderId}/partial-accept`, {
        partialItems,
        reason,
      });
      if (res.data?.order) {
        setOrders(prev => prev.map(o => (o.id === orderId ? res.data.order : o)));
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Metric Computations
  const totalWeeklyRevenue = orders
    .filter(o => o.status === 'completed' || o.status === 'ready' || o.status === 'accepted')
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

  const pendingOrdersCount = orders.filter(o => o.status === 'requested').length;
  const activeListingsCount = products.filter(p => p.isAvailable).length;
  const lowStockCount = products.filter(p => p.availableStock > 0 && p.availableStock < 30).length;

  return (
    <div className="min-h-screen bg-[#fcfaf7] pb-16">
      {/* Top Banner & Operational Welcome */}
      <div className="bg-[#1b4332] text-stone-100 border-b border-[#2d6a4f] pt-8 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#d4a373]">
                <Tractor className="w-4 h-4" />
                <span>{user?.subRole || 'Independent Farmer'} Desk</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                {user?.name}
              </h1>
              <p className="text-xs text-stone-300 flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-[#d4a373]" />
                <span>{user?.location} • Farm Gate Mandi Ready</span>
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={fetchData}
                className="p-2.5 bg-[#2d6a4f] hover:bg-[#40916c] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Refresh listings and incoming orders"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Sync Data</span>
              </button>

              <button
                type="button"
                onClick={() => setIsNewProductOpen(true)}
                className="px-4 py-2.5 bg-[#d4a373] hover:bg-[#c6925d] text-[#1b4332] rounded-xl text-xs font-extrabold shadow-md flex items-center gap-1.5 transition-all active:scale-98"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>{t('addNewProduce', 'Add New Harvest')}</span>
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
            {/* Metric 1: Revenue */}
            <div className="bg-[#2d6a4f]/50 border border-[#40916c]/40 rounded-2xl p-4 text-white">
              <div className="flex items-center justify-between text-xs text-[#d4a373] font-semibold">
                <span>{t('weeklyRevenue', 'Weekly Revenue')}</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white mt-2">
                ₹{totalWeeklyRevenue.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-emerald-200 mt-1 font-medium">Direct Mandi Dispatches</div>
            </div>

            {/* Metric 2: Pending Orders */}
            <div className="bg-[#2d6a4f]/50 border border-[#40916c]/40 rounded-2xl p-4 text-white">
              <div className="flex items-center justify-between text-xs text-[#d4a373] font-semibold">
                <span>{t('pendingOrders', 'Pending Orders')}</span>
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white mt-2">
                {pendingOrdersCount}
              </div>
              <div className="text-[11px] text-amber-200 mt-1 font-medium">Awaiting Farm Confirmation</div>
            </div>

            {/* Metric 3: Active Listings */}
            <div className="bg-[#2d6a4f]/50 border border-[#40916c]/40 rounded-2xl p-4 text-white">
              <div className="flex items-center justify-between text-xs text-[#d4a373] font-semibold">
                <span>{t('activeListings', 'Active Listings')}</span>
                <Package className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white mt-2">
                {activeListingsCount}
              </div>
              <div className="text-[11px] text-emerald-200 mt-1 font-medium">Harvest lots in market</div>
            </div>

            {/* Metric 4: Low Stock Alerts */}
            <div className="bg-[#2d6a4f]/50 border border-[#40916c]/40 rounded-2xl p-4 text-white">
              <div className="flex items-center justify-between text-xs text-[#d4a373] font-semibold">
                <span>{t('lowStockAlerts', 'Low Stock Alerts')}</span>
                <AlertTriangle className="w-4 h-4 text-amber-300" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white mt-2">
                {lowStockCount}
              </div>
              <div className="text-[11px] text-amber-200 mt-1 font-medium">&lt; 30 units remaining</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Weather & Harvest Planning Context */}
        <div className="mb-6">
          <WeatherWidget city={user?.location || 'Nashik'} />
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 mb-6 bg-white rounded-2xl p-1.5 shadow-2xs border">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'orders'
                ? 'bg-[#1b4332] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{t('incomingOrders', 'Incoming Order Requests')}</span>
            {pendingOrdersCount > 0 && (
              <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {pendingOrdersCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'inventory'
                ? 'bg-[#1b4332] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>{t('manageInventory', 'Produce Inventory & Quick Toggles')}</span>
            <span className="bg-stone-200 text-stone-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {products.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'audit'
                ? 'bg-[#1b4332] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Inventory Audit Trail</span>
          </button>
        </div>

        {/* Tab 1: Incoming Orders */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-stone-200">
                <span className="text-4xl block mb-2">📦</span>
                <h3 className="font-bold text-stone-800 text-base">No orders yet</h3>
                <p className="text-stone-500 text-xs mt-1">
                  Orders placed by restaurants, grocers, and wholesalers will appear here with instant SMS alerts.
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
                        <span className="text-xs bg-stone-100 text-stone-700 font-semibold px-2 py-0.5 rounded capitalize">
                          {order.buyerType || 'Commercial Buyer'}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">
                        Placed by <span className="font-bold text-stone-800">{order.buyerName}</span> •{' '}
                        <span>{order.buyerLocation}</span> •{' '}
                        <span className="font-mono text-emerald-800">{order.buyerPhone}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-stone-400 block">Total Order Value:</span>
                      <span className="text-xl font-extrabold text-[#1b4332]">₹{order.totalAmount}</span>
                    </div>
                  </div>

                  {/* Visual 5-Stage Stepper Component */}
                  <div className="py-4">
                    <OrderStatusStepper order={order} />
                  </div>

                  {/* Ordered Items Breakdown */}
                  <div className="bg-stone-50/70 rounded-2xl p-3 border border-stone-100 space-y-2 text-xs">
                    <span className="font-bold text-stone-700 block text-[11px] uppercase tracking-wider">
                      Requested Produce Lots:
                    </span>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1 border-b border-stone-100 last:border-none">
                        <div className="flex items-center gap-2">
                          {item.photo && (
                            <img src={item.photo} alt={item.name} className="w-8 h-8 rounded-lg object-cover" />
                          )}
                          <div>
                            <span className="font-bold text-stone-900">{item.name}</span>
                            <span className="text-stone-500 text-[11px] block">
                              Unit Rate: ₹{item.unitPrice}/{item.unit}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-bold text-stone-800">
                            {item.acceptedQuantity} / {item.requestedQuantity} {item.unit}
                          </span>
                          <span className="text-stone-500 text-[11px] block">
                            ₹{item.totalItemPrice}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Fulfillment details & action buttons */}
                  <div className="mt-4 pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5 text-stone-600">
                      <div>
                        <span className="font-semibold text-stone-800">Fulfillment Slot:</span> {order.pickupSlot}
                      </div>
                      <div>
                        <span className="font-semibold text-stone-800">Payment Mode:</span>{' '}
                        <span className="uppercase">{order.paymentMethod.replace(/_/g, ' ')}</span>
                      </div>
                      {order.notes && (
                        <div className="text-amber-800 italic">"Note: {order.notes}"</div>
                      )}
                    </div>

                    {/* Stage Transition Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      {order.status === 'requested' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, 'accepted')}
                            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs transition-colors"
                          >
                            {t('acceptFull', 'Accept Full Order')}
                          </button>

                          <button
                            type="button"
                            onClick={() => setPartialModalOrder(order)}
                            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-xl transition-colors"
                          >
                            {t('acceptPartial', 'Partial Accept (Adjust Qty)')}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                            className="px-3 py-2 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          >
                            {t('rejectOrder', 'Decline')}
                          </button>
                        </>
                      )}

                      {order.status === 'accepted' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateOrderStatus(order.id, 'ready')}
                          className="px-4 py-2 bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-300" />
                          <span>{t('markReady', 'Mark Ready for Pickup')}</span>
                        </button>
                      )}

                      {order.status === 'ready' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-950 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                          <span>{t('markCompleted', 'Complete Fulfillment')}</span>
                        </button>
                      )}

                      {order.status === 'completed' && (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                          <CheckCircle2 className="w-4 h-4" />
                          Fulfilled & Paid
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Inventory Management & One-Tap Toggles */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200">
              <div>
                <h3 className="font-extrabold text-stone-900 text-sm">
                  {t('manageInventory', 'Harvest Produce Stock Controls')}
                </h3>
                <p className="text-xs text-stone-500">
                  Toggle listings in or out of stock instantly. Changes update buyer carts and lock availability in real-time.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewProductOpen(true)}
                className="px-4 py-2 bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{t('addNewProduce', 'Add New Harvest')}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map(prod => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  isOwner={true}
                  onQuickToggleStock={handleToggleStock}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Inventory History Audit Trail */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-3xl border border-stone-200 p-6">
            <div className="mb-4">
              <h3 className="font-bold text-stone-900 text-base">Farmer Inventory History & Stock Locks</h3>
              <p className="text-xs text-stone-500">
                Audited transaction log tracking 10-minute temporary buyer locks, expirations, order fulfillments, and manual adjustments.
              </p>
            </div>

            <div className="divide-y divide-stone-100 text-xs">
              {history.length === 0 ? (
                <div className="py-8 text-center text-stone-400">No inventory audit events logged yet.</div>
              ) : (
                history.map(item => (
                  <div key={item.id} className="py-3 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900">{item.productName}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            item.changeType === 'stock_lock'
                              ? 'bg-amber-100 text-amber-900'
                              : item.changeType === 'lock_release'
                              ? 'bg-sky-100 text-sky-900'
                              : item.changeType === 'order_fulfilled'
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {item.changeType.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-stone-500 text-[11px] mt-0.5">{item.reason}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`font-mono font-bold text-xs ${
                          item.delta > 0 ? 'text-emerald-700' : 'text-stone-700'
                        }`}
                      >
                        {item.delta > 0 ? `+${item.delta}` : item.delta} units
                      </span>
                      <span className="block text-[10px] text-stone-400">
                        Balance: {item.resultingStock}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Partial Acceptance Modal */}
      {partialModalOrder && (
        <PartialAcceptModal
          order={partialModalOrder}
          isOpen={!!partialModalOrder}
          onClose={() => setPartialModalOrder(null)}
          onSubmit={handlePartialAcceptSubmit}
        />
      )}

      {/* New Produce Listing Modal */}
      <NewProductModal
        isOpen={isNewProductOpen}
        onClose={() => setIsNewProductOpen(false)}
        onSubmit={handleCreateProduct}
      />
    </div>
  );
};
