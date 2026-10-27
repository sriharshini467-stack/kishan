import React, { useState } from 'react';
import { X, Trash2, ShieldCheck, Timer, CreditCard, Banknote, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { Order } from '../types';

export const CartDrawer: React.FC = () => {
  const { t } = useLanguage();
  const {
    items,
    isOpen,
    setIsOpen,
    removeFromCart,
    subtotal,
    fee,
    totalAmount,
    secondsRemaining,
    checkout,
  } = useCart();

  const [paymentMethod, setPaymentMethod] = useState<'cash_on_pickup' | 'pay_on_delivery' | 'simulated_upi'>('cash_on_pickup');
  const [pickupSlot, setPickupSlot] = useState('Morning 7:30 AM - 11:00 AM');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timerFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const lockProgress = Math.min(100, Math.max(0, (secondsRemaining / 600) * 100));

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCheckoutError(null);

    const res = await checkout({
      paymentMethod,
      pickupSlot,
      notes,
    });

    setIsSubmitting(false);

    if (res.success && res.order) {
      setCompletedOrder(res.order);
    } else {
      setCheckoutError(res.error || 'Failed to place order.');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setCompletedOrder(null);
    setCheckoutError(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🧺</span>
            <h2 className="font-bold text-stone-900 text-base">{t('cartTitle', 'Your Procurement Cart')}</h2>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 10-Minute Dynamic Stock Lock Banner */}
        {items.length > 0 && !completedOrder && (
          <div className="bg-amber-500/10 border-b border-amber-200 p-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <Timer className="w-4 h-4 text-amber-700 animate-pulse" />
                <span>{t('timeRemaining', '10-Min Stock Lock')}:</span>
              </div>
              <span className="font-mono font-extrabold text-amber-950 text-sm bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                {timerFormatted}
              </span>
            </div>
            <div className="w-full bg-amber-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-600 h-full transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${lockProgress}%` }}
              />
            </div>
            <p className="text-[10px] text-amber-800/80 mt-1 leading-tight">
              {t('stockLockedNotice', 'Stock is exclusively reserved for you in MongoDB for 10 minutes to prevent overselling.')}
            </p>
          </div>
        )}

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {completedOrder ? (
            /* Order Placed Success View */
            <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-stone-900">Order Placed Successfully!</h3>
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-stone-200 font-semibold text-stone-800">
                  <span>Order Reference:</span>
                  <span className="font-mono text-emerald-800">{completedOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-200">
                  <span>Farmer / Collective:</span>
                  <span className="font-medium text-stone-900">{completedOrder.farmerName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-200">
                  <span>Total Payable:</span>
                  <span className="font-bold text-emerald-900 text-sm">₹{completedOrder.totalAmount}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-200">
                  <span>Pickup / Delivery Slot:</span>
                  <span className="font-medium text-stone-800">{completedOrder.pickupSlot}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Payment Mode:</span>
                  <span className="font-medium text-stone-800 uppercase">{completedOrder.paymentMethod.replace(/_/g, ' ')}</span>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-left flex items-start gap-2 text-emerald-900 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  Farmer has received an automated <span className="font-bold">Twilio SMS / WhatsApp alert</span>. You will be notified as they accept and prepare the lot.
                </p>
              </div>

              <button
                onClick={handleClose}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
              >
                Continue Procurement
              </button>
            </div>
          ) : items.length === 0 ? (
            /* Empty Cart View */
            <div className="py-16 text-center space-y-3">
              <span className="text-5xl block">🛒</span>
              <p className="text-stone-500 font-medium text-sm">{t('cartEmpty', 'Your cart is currently empty')}</p>
              <p className="text-stone-400 text-xs max-w-xs mx-auto">
                Select fresh harvest items from the farmer marketplace to lock inventory and proceed.
              </p>
            </div>
          ) : (
            /* Items Listing & Summary */
            <>
              {checkoutError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{checkoutError}</span>
                </div>
              )}

              <div className="space-y-3">
                {items.map(item => (
                  <div
                    key={item.product.id}
                    className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <img
                      src={item.product.photos[0]}
                      alt={item.product.name}
                      className="w-12 h-12 rounded-lg object-cover bg-stone-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-stone-900 truncate">{item.product.name}</h4>
                      <p className="text-stone-500 text-[11px]">
                        {item.quantity} {item.product.unit} × ₹{item.unitPrice}
                      </p>
                      <span className="inline-block mt-0.5 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-medium">
                        {item.tierApplied}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-extrabold text-stone-900 text-sm">
                        ₹{item.quantity * item.unitPrice}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-stone-400 hover:text-rose-600 p-1 transition-colors mt-1"
                        title="Remove & release stock lock"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Fulfillment & Payment Method Options */}
              <div className="space-y-3 pt-2 border-t border-stone-200">
                <label className="block text-xs font-bold text-stone-800">
                  {t('paymentMethod', 'Fulfillment & Payment Mode')}:
                </label>

                <div className="grid grid-cols-1 gap-2 text-xs">
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'cash_on_pickup'
                        ? 'border-emerald-500 bg-emerald-50/60 font-semibold text-emerald-950'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash_on_pickup"
                      checked={paymentMethod === 'cash_on_pickup'}
                      onChange={() => setPaymentMethod('cash_on_pickup')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <Banknote className="w-4 h-4 text-emerald-700" />
                    <span>{t('cashOnPickup', 'Cash on Farm Pickup')}</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'pay_on_delivery'
                        ? 'border-emerald-500 bg-emerald-50/60 font-semibold text-emerald-950'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="pay_on_delivery"
                      checked={paymentMethod === 'pay_on_delivery'}
                      onChange={() => setPaymentMethod('pay_on_delivery')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <Truck className="w-4 h-4 text-sky-700" />
                    <span>{t('payOnDelivery', 'Pay on Direct Delivery')}</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'simulated_upi'
                        ? 'border-emerald-500 bg-emerald-50/60 font-semibold text-emerald-950'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="simulated_upi"
                      checked={paymentMethod === 'simulated_upi'}
                      onChange={() => setPaymentMethod('simulated_upi')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <CreditCard className="w-4 h-4 text-indigo-700" />
                    <span>{t('simulatedUpi', 'Simulated Instant UPI / Gateway')}</span>
                  </label>
                </div>

                {/* Pickup Slot Window */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {t('pickupSlot', 'Preferred Fulfillment Window')}:
                  </label>
                  <input
                    type="text"
                    value={pickupSlot}
                    onChange={e => setPickupSlot(e.target.value)}
                    placeholder="e.g. Saturday 7:00 AM - 11:00 AM"
                    className="w-full text-xs p-2 border border-stone-200 rounded-lg focus:outline-emerald-600"
                  />
                </div>

                {/* Order Notes */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Special Packaging / Handling Notes:
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="e.g. Please ventilate sacks, refrigerated vehicle arriving"
                    className="w-full text-xs p-2 border border-stone-200 rounded-lg focus:outline-emerald-600"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer with Financial Breakdown */}
        {items.length > 0 && !completedOrder && (
          <div className="p-4 border-t border-stone-200 bg-stone-50 space-y-3">
            <div className="space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>{t('subtotal', 'Produce Subtotal')}:</span>
                <span className="font-semibold text-stone-800">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('mandiFee', 'APMC Mandi / Platform Fee (1.5%)')}:</span>
                <span className="font-semibold text-stone-800">₹{fee}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-stone-900 pt-1 border-t border-stone-200">
                <span>{t('totalAmount', 'Total Payable')}:</span>
                <span className="text-emerald-800 text-base">₹{totalAmount}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Transmitting Order...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t('placeOrderBtn', 'Confirm & Transmit Order')}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
