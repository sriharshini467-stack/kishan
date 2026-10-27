import React from 'react';
import { CheckCircle2, Clock, PackageCheck, Truck, XCircle, AlertCircle } from 'lucide-react';
import { OrderStatus, Order } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface OrderStatusStepperProps {
  order: Order;
}

export const OrderStatusStepper: React.FC<OrderStatusStepperProps> = ({ order }) => {
  const { t } = useLanguage();
  const stages: { key: OrderStatus; labelKey: string; icon: React.ElementType }[] = [
    { key: 'requested', labelKey: 'statusRequested', icon: Clock },
    { key: 'accepted', labelKey: 'statusAccepted', icon: CheckCircle2 },
    { key: 'ready', labelKey: 'statusReady', icon: PackageCheck },
    { key: 'completed', labelKey: 'statusCompleted', icon: Truck },
  ];

  if (order.status === 'cancelled') {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center space-x-3 text-rose-800">
        <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
        <div>
          <span className="font-semibold text-sm">{t('statusCancelled', 'Order Cancelled')}</span>
          <p className="text-xs text-rose-600 mt-0.5">
            This order was cancelled. Reserved inventory was released back to active harvest stock.
          </p>
        </div>
      </div>
    );
  }

  const currentIdx = stages.findIndex(s => s.key === order.status);

  return (
    <div className="w-full">
      {/* Visual Stepper */}
      <div className="relative flex items-center justify-between">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-stone-200 w-full z-0" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-600 transition-all duration-500 z-0"
          style={{ width: `${(Math.max(0, currentIdx) / (stages.length - 1)) * 100}%` }}
        />

        {stages.map((stage, idx) => {
          const isDone = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          const Icon = stage.icon;

          return (
            <div key={stage.key} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCurrent
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-md scale-110'
                    : isDone
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border-2 border-stone-300 text-stone-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={`text-[11px] font-medium mt-1.5 transition-colors text-center whitespace-nowrap ${
                  isCurrent
                    ? 'text-emerald-800 font-bold'
                    : isDone
                    ? 'text-stone-800'
                    : 'text-stone-400'
                }`}
              >
                {t(stage.labelKey, stage.key)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Partial Acceptance Notice */}
      {order.partialAcceptanceReason && (
        <div className="mt-3.5 bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start space-x-2 text-amber-900 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">{t('partialAcceptedNotice', 'Quantity Adjusted by Farmer')}</span>
            <p className="text-amber-700 mt-0.5">{order.partialAcceptanceReason}</p>
          </div>
        </div>
      )}
    </div>
  );
};
