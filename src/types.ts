export type SupportedLanguage = 'en' | 'hi' | 'te' | 'ta' | 'kn' | 'mr';

export type PrimaryRole = 'supplier' | 'buyer' | 'unassigned';

export type SupplierSubRole = 'farmer' | 'foodHub' | 'csa';
export type BuyerSubRole = 'restaurant' | 'grocer' | 'distributor' | 'household';
export type SubRole = SupplierSubRole | BuyerSubRole | string;

export interface User {
  id: string;
  name: string;
  phone: string;
  location: string;
  preferredLanguage: SupportedLanguage;
  primaryRole: PrimaryRole;
  subRole?: SubRole;
  createdAt: string;
}

export interface PricingTier {
  minQty: number;
  maxQty?: number; // undefined means unbounded/infinite
  pricePerUnit: number;
  label?: string; // e.g. "Retail (1-10 kg)", "Wholesale (>50 kg)"
}

export type ProduceCategory = 'vegetables' | 'fruits' | 'grains' | 'spices' | 'dairy';

export interface Product {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerLocation: string;
  farmerPhone: string;
  name: string;
  microCategory: ProduceCategory;
  categoryLabel?: string;
  photos: string[];
  unit: 'kg' | 'crate' | 'ton' | 'bag' | 'quintal';
  totalStock: number;
  availableStock: number;
  basePrice: number;
  tieredPricing: PricingTier[];
  harvestDate: string; // ISO date or YYYY-MM-DD
  pickupWindow: string; // e.g. "Daily 7 AM - 11 AM", "Mon/Wed/Sat Morning"
  isAvailable: boolean;
  deliveryOptions: {
    farmPickup: boolean;
    directDelivery: boolean;
  };
  description?: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  tierApplied: string;
  lockId?: string;
}

export interface StockLock {
  id: string;
  productId: string;
  buyerId: string;
  buyerPhone: string;
  quantity: number;
  lockExpiresAt: string; // ISO timestamp
  status: 'active' | 'released' | 'converted';
  createdAt: string;
}

export type OrderStatus = 'requested' | 'accepted' | 'ready' | 'completed' | 'cancelled';

export interface OrderItem {
  productId: string;
  name: string;
  unit: string;
  requestedQuantity: number;
  acceptedQuantity: number;
  unitPrice: number;
  totalItemPrice: number;
  photo?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  buyerLocation: string;
  buyerType?: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  farmerLocation?: string;
  items: OrderItem[];
  subtotal: number;
  fee: number;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: 'cash_on_pickup' | 'pay_on_delivery' | 'simulated_upi';
  pickupSlot: string;
  partialAcceptanceReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryHistoryRecord {
  id: string;
  productId: string;
  productName: string;
  farmerId: string;
  changeType: 'initial' | 'stock_lock' | 'lock_release' | 'order_fulfilled' | 'manual_update' | 'restock';
  delta: number;
  resultingStock: number;
  reason: string;
  timestamp: string;
}

export interface WeatherData {
  city: string;
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: string;
  harvestSafety: 'favorable' | 'moderate' | 'rain_warning';
  advisory: string;
}

export interface NotificationLog {
  id: string;
  toPhone: string;
  recipientName: string;
  channel: 'SMS' | 'WhatsApp';
  provider: 'Twilio' | 'Brevo';
  message: string;
  orderId?: string;
  timestamp: string;
  status: 'delivered' | 'simulated';
}
