import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { Product, CartItem, Order } from '../types';

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity: number) => Promise<{ success: boolean; message?: string }>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => void;
  subtotal: number;
  fee: number;
  totalAmount: number;
  lockExpiresAt: Date | null;
  secondsRemaining: number;
  checkout: (params: {
    paymentMethod: 'cash_on_pickup' | 'pay_on_delivery' | 'simulated_upi';
    pickupSlot?: string;
    notes?: string;
  }) => Promise<{ success: boolean; order?: Order; error?: string }>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('kisansetu_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isOpen, setIsOpen] = useState(false);
  const [lockExpiresAt, setLockExpiresAt] = useState<Date | null>(() => {
    const saved = localStorage.getItem('kisansetu_lock_expires');
    return saved ? new Date(saved) : null;
  });
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem('kisansetu_cart', JSON.stringify(items));
  }, [items]);

  // Handle 10-minute Lock Timer Countdown
  useEffect(() => {
    if (!lockExpiresAt || items.length === 0) {
      setSecondsRemaining(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((lockExpiresAt.getTime() - now) / 1000));
      setSecondsRemaining(diff);

      if (diff <= 0) {
        clearInterval(interval);
        // Lock expired!
        setItems([]);
        setLockExpiresAt(null);
        localStorage.removeItem('kisansetu_lock_expires');
        localStorage.removeItem('kisansetu_cart');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockExpiresAt, items.length]);

  const addToCart = async (product: Product, quantity: number) => {
    try {
      // Call backend to lock stock atomically
      const res = await axios.post('/api/orders/lock-stock', {
        productId: product.id,
        quantity,
      });

      const { lock, unitPrice, tierApplied } = res.data;

      // Update expires timestamp
      const newExpiry = new Date(lock.lockExpiresAt);
      setLockExpiresAt(newExpiry);
      localStorage.setItem('kisansetu_lock_expires', newExpiry.toISOString());

      setItems(prev => {
        const existingIdx = prev.findIndex(i => i.product.id === product.id);
        if (existingIdx > -1) {
          const updated = [...prev];
          const newQty = updated[existingIdx].quantity + quantity;
          updated[existingIdx] = {
            product,
            quantity: newQty,
            unitPrice,
            tierApplied,
            lockId: lock.id,
          };
          return updated;
        } else {
          return [
            ...prev,
            {
              product,
              quantity,
              unitPrice,
              tierApplied,
              lockId: lock.id,
            },
          ];
        }
      });

      setIsOpen(true);
      return { success: true, message: `Locked ${quantity} ${product.unit} of ${product.name}` };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not lock stock for checkout';
      return { success: false, message: msg };
    }
  };

  const removeFromCart = async (productId: string) => {
    const item = items.find(i => i.product.id === productId);
    if (item && item.lockId) {
      try {
        await axios.post('/api/orders/release-lock', {
          lockId: item.lockId,
          reason: 'Item removed from buyer cart',
        });
      } catch (e) {
        console.warn('Failed to release lock on server', e);
      }
    }

    const remaining = items.filter(i => i.product.id !== productId);
    setItems(remaining);
    if (remaining.length === 0) {
      setLockExpiresAt(null);
      localStorage.removeItem('kisansetu_lock_expires');
    }
  };

  const clearCart = () => {
    // Release locks
    for (const item of items) {
      if (item.lockId) {
        axios.post('/api/orders/release-lock', { lockId: item.lockId, reason: 'Cart cleared' }).catch(() => {});
      }
    }
    setItems([]);
    setLockExpiresAt(null);
    localStorage.removeItem('kisansetu_lock_expires');
    localStorage.removeItem('kisansetu_cart');
  };

  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const fee = Number((subtotal * 0.015).toFixed(2));
  const totalAmount = Number((subtotal + fee).toFixed(2));

  const checkout = async (params: {
    paymentMethod: 'cash_on_pickup' | 'pay_on_delivery' | 'simulated_upi';
    pickupSlot?: string;
    notes?: string;
  }) => {
    if (items.length === 0) {
      return { success: false, error: 'Your cart is empty.' };
    }

    try {
      const payload = {
        items: items.map(i => ({
          productId: i.product.id,
          quantity: i.quantity,
          lockId: i.lockId,
        })),
        paymentMethod: params.paymentMethod,
        pickupSlot: params.pickupSlot,
        notes: params.notes,
      };

      const res = await axios.post('/api/orders/checkout', payload);
      const createdOrder = res.data.order;

      // Reset cart
      setItems([]);
      setLockExpiresAt(null);
      localStorage.removeItem('kisansetu_lock_expires');
      localStorage.removeItem('kisansetu_cart');
      setIsOpen(false);

      return { success: true, order: createdOrder };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Checkout failed. Please try again.';
      return { success: false, error: msg };
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        setIsOpen,
        addToCart,
        removeFromCart,
        clearCart,
        subtotal,
        fee,
        totalAmount,
        lockExpiresAt,
        secondsRemaining,
        checkout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
