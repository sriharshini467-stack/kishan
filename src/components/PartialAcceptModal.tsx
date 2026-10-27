import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';
import { Order } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface PartialAcceptModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (orderId: string, partialItems: { productId: string; acceptedQuantity: number }[], reason: string) => Promise<void>;
}

export const PartialAcceptModal: React.FC<PartialAcceptModalProps> = ({
  order,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { t } = useLanguage();
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    order.items.forEach(i => {
      init[i.productId] = i.requestedQuantity;
    });
    return init;
  });
  const [reason, setReason] = useState(
    'Partial allocation due to morning harvest yield; balance will be returned to inventory.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleQtyChange = (productId: string, val: number, max: number) => {
    const safeVal = Math.max(0, Math.min(max, val));
    setQuantities(prev => ({ ...prev, [productId]: safeVal }));
  };

  // Recalculate preview subtotal
  let previewSubtotal = 0;
  order.items.forEach(item => {
    const accepted = quantities[item.productId] ?? item.requestedQuantity;
    previewSubtotal += accepted * item.unitPrice;
  });
  const previewFee = Number((previewSubtotal * 0.015).toFixed(2));
  const previewTotal = Number((previewSubtotal + previewFee).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const partialItems = order.items.map(item => ({
      productId: item.productId,
      acceptedQuantity: quantities[item.productId] ?? item.requestedQuantity,
    }));
    await onSubmit(order.id, partialItems, reason);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center space-x-2">
            <span className="text-xl">⚖️</span>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">{t('acceptPartial', 'Partial Order Acceptance')}</h3>
              <p className="text-xs text-stone-500">Order #{order.orderNumber} • {order.buyerName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:text-stone-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Specify the exact quantity you can fulfill from current harvest. Any unaccepted quantity will be automatically credited back to your active marketplace stock, and the buyer will receive an SMS notification.
            </p>
          </div>

          <div className="space-y-3">
            {order.items.map(item => {
              const currentVal = quantities[item.productId] ?? item.requestedQuantity;
              return (
                <div key={item.productId} className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                  <div className="flex justify-between font-bold text-stone-900 mb-1">
                    <span>{item.name}</span>
                    <span className="text-stone-500">₹{item.unitPrice}/{item.unit}</span>
                  </div>

                  <div className="flex items-center justify-between gap-4 mt-2">
                    <span className="text-stone-500">
                      Requested: <span className="font-semibold text-stone-800">{item.requestedQuantity} {item.unit}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-700">Accept:</span>
                      <input
                        type="number"
                        min="0"
                        max={item.requestedQuantity}
                        step={item.unit === 'kg' ? '1' : '1'}
                        value={currentVal}
                        onChange={e => handleQtyChange(item.productId, parseFloat(e.target.value) || 0, item.requestedQuantity)}
                        className="w-20 px-2 py-1 border border-stone-300 rounded-lg text-center font-bold text-stone-900 bg-white"
                      />
                      <span className="text-stone-600 font-medium">{item.unit}</span>
                    </div>
                  </div>

                  <div className="text-right mt-1.5 text-[11px] text-emerald-800 font-semibold">
                    New Line Total: ₹{(currentVal * item.unitPrice).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              Reason / Explanatory Note to Buyer:
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={e => setReason(e.target.value)}
              required
              className="w-full text-xs p-2.5 border border-stone-200 rounded-xl focus:outline-emerald-600 bg-stone-50"
            />
          </div>

          {/* Financial Recalculation Preview */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
            <div className="flex justify-between">
              <span>Recalculated Subtotal:</span>
              <span className="font-bold">₹{previewSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Mandi Fee (1.5%):</span>
              <span className="font-bold">₹{previewFee}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold pt-1 border-t border-emerald-200">
              <span>Updated Total Payable:</span>
              <span className="text-emerald-900">₹{previewTotal}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Confirm & Notify Buyer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
