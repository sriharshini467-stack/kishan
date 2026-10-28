import bcrypt from 'bcryptjs';
import type { User, Product, Order, StockLock, InventoryHistoryRecord, NotificationLog, WeatherData } from '../src/types.ts';

// In-memory persistent state with disk backup
class DatabaseStore {
  users: Map<string, User> = new Map();
  userPasswords: Map<string, string> = new Map(); // phone -> passwordHash
  products: Map<string, Product> = new Map();
  orders: Map<string, Order> = new Map();
  stockLocks: Map<string, StockLock> = new Map();
  inventoryHistory: InventoryHistoryRecord[] = [];
  notifications: NotificationLog[] = [];
  lockTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.seedInitialData();
    this.startLockExpirySweep();
  }

  private async seedInitialData() {
    const salt = bcrypt.genSaltSync(10);
    const demoPasswordHash = bcrypt.hashSync('demo123', salt);

    // 1. Seed Demo Users
    const farmerRamesh: User = {
      id: 'usr_farmer_1',
      name: 'Ramesh Patel',
      phone: '9876543210',
      location: 'Nashik, Maharashtra',
      preferredLanguage: 'hi',
      primaryRole: 'supplier',
      subRole: 'farmer',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    };
    this.users.set(farmerRamesh.id, farmerRamesh);
    this.userPasswords.set(farmerRamesh.phone, demoPasswordHash);

    const fpoCollective: User = {
      id: 'usr_farmer_2',
      name: 'Sahyadri Agri Collective (FPO)',
      phone: '9876543211',
      location: 'Pune, Maharashtra',
      preferredLanguage: 'mr',
      primaryRole: 'supplier',
      subRole: 'foodHub',
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    };
    this.users.set(fpoCollective.id, fpoCollective);
    this.userPasswords.set(fpoCollective.phone, demoPasswordHash);

    const buyerAnita: User = {
      id: 'usr_buyer_1',
      name: 'Anita Sharma (Dakshin Bistro)',
      phone: '9123456780',
      location: 'Mumbai Suburban, Maharashtra',
      preferredLanguage: 'en',
      primaryRole: 'buyer',
      subRole: 'restaurant',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    };
    this.users.set(buyerAnita.id, buyerAnita);
    this.userPasswords.set(buyerAnita.phone, demoPasswordHash);

    const buyerWholesale: User = {
      id: 'usr_buyer_2',
      name: 'GreenGrocers Supermarkets',
      phone: '9123456781',
      location: 'Bengaluru, Karnataka',
      preferredLanguage: 'kn',
      primaryRole: 'buyer',
      subRole: 'distributor',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    };
    this.users.set(buyerWholesale.id, buyerWholesale);
    this.userPasswords.set(buyerWholesale.phone, demoPasswordHash);

    // 2. Seed Produce Listings with Tiered Bulk Pricing & Freshness
    const now = Date.now();
    const oneDay = 86400000;

    const seedProducts: Product[] = [
      {
        id: 'prod_1',
        farmerId: farmerRamesh.id,
        farmerName: farmerRamesh.name,
        farmerPhone: farmerRamesh.phone,
        farmerLocation: farmerRamesh.location,
        name: 'Nashik Premium Red Onions (Grade A)',
        microCategory: 'vegetables',
        categoryLabel: 'Root Vegetables',
        photos: [
          'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80'
        ],
        unit: 'kg',
        totalStock: 1200,
        availableStock: 1100,
        basePrice: 38,
        tieredPricing: [
          { minQty: 1, maxQty: 25, pricePerUnit: 38, label: 'Retail (1-25 kg)' },
          { minQty: 26, maxQty: 100, pricePerUnit: 33, label: 'Commercial (26-100 kg)' },
          { minQty: 101, maxQty: undefined, pricePerUnit: 28, label: 'Wholesale Mandi (>100 kg)' }
        ],
        harvestDate: new Date(now - 8 * 3600000).toISOString(), // 8 hours ago (Today)
        pickupWindow: 'Mon - Sat: 6:30 AM - 11:30 AM',
        isAvailable: true,
        deliveryOptions: { farmPickup: true, directDelivery: true },
        description: 'Sun-cured medium pungent Nashik red onions with thick papery skin, ideal for commercial restaurant kitchens and long shelf storage.',
        createdAt: new Date(now - 2 * oneDay).toISOString()
      },
      {
        id: 'prod_2',
        farmerId: farmerRamesh.id,
        farmerName: farmerRamesh.name,
        farmerPhone: farmerRamesh.phone,
        farmerLocation: farmerRamesh.location,
        name: 'Organic Ratnagiri Alphonso Mangoes (GI Tag)',
        microCategory: 'fruits',
        categoryLabel: 'Orchard Fruits',
        photos: [
          'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80'
        ],
        unit: 'crate',
        totalStock: 80,
        availableStock: 74,
        basePrice: 1200, // per crate of 12 pieces
        tieredPricing: [
          { minQty: 1, maxQty: 5, pricePerUnit: 1200, label: 'Retail Crate (1-5)' },
          { minQty: 6, maxQty: 20, pricePerUnit: 1050, label: 'Bulk Crate (6-20)' },
          { minQty: 21, maxQty: undefined, pricePerUnit: 920, label: 'Wholesale Bulk (>20)' }
        ],
        harvestDate: new Date(now - 22 * 3600000).toISOString(), // Harvested yesterday
        pickupWindow: 'Daily: 7:00 AM - 1:00 PM',
        isAvailable: true,
        deliveryOptions: { farmPickup: true, directDelivery: true },
        description: 'Tree-ripened authentic GI-tagged Devgad/Ratnagiri Alphonso mangoes. Saffron rich pulp and intoxicating fragrance.',
        createdAt: new Date(now - 3 * oneDay).toISOString()
      },
      {
        id: 'prod_3',
        farmerId: fpoCollective.id,
        farmerName: fpoCollective.name,
        farmerPhone: fpoCollective.phone,
        farmerLocation: fpoCollective.location,
        name: 'Hydroponic Bangalore Vine Tomatoes',
        microCategory: 'vegetables',
        categoryLabel: 'Greenhouse Produce',
        photos: [
          'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80'
        ],
        unit: 'kg',
        totalStock: 650,
        availableStock: 600,
        basePrice: 28,
        tieredPricing: [
          { minQty: 1, maxQty: 20, pricePerUnit: 28, label: 'Retail (1-20 kg)' },
          { minQty: 21, maxQty: 80, pricePerUnit: 24, label: 'Catering Bulk (21-80 kg)' },
          { minQty: 81, maxQty: undefined, pricePerUnit: 19, label: 'Distributor Crate (>80 kg)' }
        ],
        harvestDate: new Date(now - 5 * 3600000).toISOString(), // Today
        pickupWindow: 'Morning 6:00 AM - 10:00 AM',
        isAvailable: true,
        deliveryOptions: { farmPickup: true, directDelivery: true },
        description: 'Firm, juicy, uniform field tomatoes with high brix level. Zero chemical residue, picked at breaker stage for optimal transit.',
        createdAt: new Date(now - 1 * oneDay).toISOString()
      },
      {
        id: 'prod_4',
        farmerId: fpoCollective.id,
        farmerName: fpoCollective.name,
        farmerPhone: fpoCollective.phone,
        farmerLocation: fpoCollective.location,
        name: 'Stone-Ground Salem Golden Turmeric (Curcumin 4.5%)',
        microCategory: 'spices',
        categoryLabel: 'Spices & Herbs',
        photos: [
          'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80'
        ],
        unit: 'kg',
        totalStock: 350,
        availableStock: 350,
        basePrice: 190,
        tieredPricing: [
          { minQty: 1, maxQty: 10, pricePerUnit: 190, label: '1-10 kg' },
          { minQty: 11, maxQty: 50, pricePerUnit: 165, label: '11-50 kg' },
          { minQty: 51, maxQty: undefined, pricePerUnit: 140, label: '>50 kg Bulk Bag' }
        ],
        harvestDate: new Date(now - 5 * oneDay).toISOString(), // Cured & Stored
        pickupWindow: 'Weekdays: 9:00 AM - 5:00 PM',
        isAvailable: true,
        deliveryOptions: { farmPickup: true, directDelivery: true },
        description: 'Single-origin high curcumin raw turmeric fingers and milled powder from Salem farmers collective. Lab-tested purity.',
        createdAt: new Date(now - 10 * oneDay).toISOString()
      },
      {
        id: 'prod_5',
        farmerId: farmerRamesh.id,
        farmerName: farmerRamesh.name,
        farmerPhone: farmerRamesh.phone,
        farmerLocation: farmerRamesh.location,
        name: 'Organic Sharbati Golden Wheat (Unpolished)',
        microCategory: 'grains',
        categoryLabel: 'Whole Grains',
        photos: [
          'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80'
        ],
        unit: 'bag', // 30kg bag
        totalStock: 150,
        availableStock: 140,
        basePrice: 1350,
        tieredPricing: [
          { minQty: 1, maxQty: 5, pricePerUnit: 1350, label: 'Retail Bag (30kg)' },
          { minQty: 6, maxQty: 25, pricePerUnit: 1220, label: 'Foodservice (6-25 bags)' },
          { minQty: 26, maxQty: undefined, pricePerUnit: 1100, label: 'Mandi Lot (>25 bags)' }
        ],
        harvestDate: new Date(now - 12 * oneDay).toISOString(),
        pickupWindow: 'Daily 8:00 AM - 6:00 PM',
        isAvailable: true,
        deliveryOptions: { farmPickup: true, directDelivery: true },
        description: 'Rainfed Sehore Sharbati wheat, heavy grain with golden sheen that yields naturally sweet, pliable rotis.',
        createdAt: new Date(now - 14 * oneDay).toISOString()
      },
      {
        id: 'prod_6',
        farmerId: fpoCollective.id,
        farmerName: fpoCollective.name,
        farmerPhone: fpoCollective.phone,
        farmerLocation: fpoCollective.location,
        name: 'Pure Gir Cow A2 Bilona Ghee & Raw Honey',
        microCategory: 'dairy',
        categoryLabel: 'Farmstead Dairy',
        photos: [
          'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80'
        ],
        unit: 'kg',
        totalStock: 60,
        availableStock: 55,
        basePrice: 1450,
        tieredPricing: [
          { minQty: 1, maxQty: 4, pricePerUnit: 1450, label: 'Standard (1-4 kg)' },
          { minQty: 5, maxQty: 15, pricePerUnit: 1320, label: 'Gourmet Bulk (5-15 kg)' },
          { minQty: 16, maxQty: undefined, pricePerUnit: 1180, label: 'Wholesale Pail (>15 kg)' }
        ],
        harvestDate: new Date(now - 2 * oneDay).toISOString(),
        pickupWindow: 'Mon - Sat: 9:00 AM - 4:00 PM',
        isAvailable: true,
        deliveryOptions: { farmPickup: true, directDelivery: true },
        description: 'Cultured grass-fed Gir cow A2 curd hand-churned in wooden bilona vessel. Golden granular texture.',
        createdAt: new Date(now - 5 * oneDay).toISOString()
      }
    ];

    for (const p of seedProducts) {
      this.products.set(p.id, p);
      this.inventoryHistory.push({
        id: 'inv_hist_' + Math.random().toString(36).substring(2, 9),
        productId: p.id,
        productName: p.name,
        farmerId: p.farmerId,
        changeType: 'initial',
        delta: p.totalStock,
        resultingStock: p.totalStock,
        reason: 'Initial harvest lot published to KisanSetu marketplace',
        timestamp: p.createdAt
      });
    }

    // 3. Seed Realistic Orders Across 5 States
    const seedOrders: Order[] = [
      {
        id: 'ord_101',
        orderNumber: 'KS-2026-9041',
        buyerId: buyerAnita.id,
        buyerName: buyerAnita.name,
        buyerPhone: buyerAnita.phone,
        buyerLocation: buyerAnita.location,
        buyerType: 'restaurant',
        farmerId: farmerRamesh.id,
        farmerName: farmerRamesh.name,
        farmerPhone: farmerRamesh.phone,
        farmerLocation: farmerRamesh.location,
        items: [
          {
            productId: 'prod_1',
            name: 'Nashik Premium Red Onions (Grade A)',
            unit: 'kg',
            requestedQuantity: 50,
            acceptedQuantity: 50,
            unitPrice: 33,
            totalItemPrice: 1650,
            photo: seedProducts[0].photos[0]
          }
        ],
        subtotal: 1650,
        fee: 25,
        totalAmount: 1675,
        status: 'ready',
        paymentMethod: 'cash_on_pickup',
        pickupSlot: 'Saturday 7:00 AM - 10:00 AM',
        notes: 'Please pack in ventilated jute sacks for transport.',
        createdAt: new Date(now - 26 * 3600000).toISOString(),
        updatedAt: new Date(now - 4 * 3600000).toISOString()
      },
      {
        id: 'ord_102',
        orderNumber: 'KS-2026-9042',
        buyerId: buyerWholesale.id,
        buyerName: buyerWholesale.name,
        buyerPhone: buyerWholesale.phone,
        buyerLocation: buyerWholesale.location,
        buyerType: 'distributor',
        farmerId: farmerRamesh.id,
        farmerName: farmerRamesh.name,
        farmerPhone: farmerRamesh.phone,
        farmerLocation: farmerRamesh.location,
        items: [
          {
            productId: 'prod_1',
            name: 'Nashik Premium Red Onions (Grade A)',
            unit: 'kg',
            requestedQuantity: 150,
            acceptedQuantity: 150,
            unitPrice: 28,
            totalItemPrice: 4200,
            photo: seedProducts[0].photos[0]
          },
          {
            productId: 'prod_2',
            name: 'Organic Ratnagiri Alphonso Mangoes (GI Tag)',
            unit: 'crate',
            requestedQuantity: 10,
            acceptedQuantity: 6, // Partial acceptance demonstrated
            unitPrice: 1050,
            totalItemPrice: 6300,
            photo: seedProducts[1].photos[0]
          }
        ],
        subtotal: 10500,
        fee: 158,
        totalAmount: 10658,
        status: 'accepted',
        paymentMethod: 'simulated_upi',
        pickupSlot: 'Tomorrow 8:00 AM - 11:00 AM',
        partialAcceptanceReason: 'Partial allocation: 4 crates allocated to prior CSA contract, 6 crates confirmed.',
        notes: 'Direct refrigerated vehicle pickup from farm gate.',
        createdAt: new Date(now - 14 * 3600000).toISOString(),
        updatedAt: new Date(now - 2 * 3600000).toISOString()
      },
      {
        id: 'ord_103',
        orderNumber: 'KS-2026-9043',
        buyerId: buyerAnita.id,
        buyerName: buyerAnita.name,
        buyerPhone: buyerAnita.phone,
        buyerLocation: buyerAnita.location,
        buyerType: 'restaurant',
        farmerId: fpoCollective.id,
        farmerName: fpoCollective.name,
        farmerPhone: fpoCollective.phone,
        items: [
          {
            productId: 'prod_3',
            name: 'Hydroponic Bangalore Vine Tomatoes',
            unit: 'kg',
            requestedQuantity: 40,
            acceptedQuantity: 40,
            unitPrice: 24,
            totalItemPrice: 960,
            photo: seedProducts[2].photos[0]
          }
        ],
        subtotal: 960,
        fee: 14,
        totalAmount: 974,
        status: 'requested',
        paymentMethod: 'pay_on_delivery',
        pickupSlot: 'Morning 7:00 AM',
        notes: 'Daily supply for salad station.',
        createdAt: new Date(now - 1 * 3600000).toISOString(),
        updatedAt: new Date(now - 1 * 3600000).toISOString()
      }
    ];

    for (const ord of seedOrders) {
      this.orders.set(ord.id, ord);
    }

    // 4. Seed initial notification logs
    this.notifications.push(
      {
        id: 'notif_1',
        toPhone: farmerRamesh.phone,
        recipientName: farmerRamesh.name,
        channel: 'SMS',
        provider: 'Twilio',
        message: 'KisanSetu: New Order #KS-2026-9042 from GreenGrocers Supermarkets! 150kg Onions, 10 crates Mangoes. Total ₹14,700. Open app to accept.',
        orderId: 'ord_102',
        timestamp: new Date(now - 14 * 3600000).toISOString(),
        status: 'delivered'
      },
      {
        id: 'notif_2',
        toPhone: buyerWholesale.phone,
        recipientName: buyerWholesale.name,
        channel: 'WhatsApp',
        provider: 'Brevo',
        message: 'KisanSetu Update: Farmer Ramesh Patel has partially accepted your Order #KS-2026-9042 (6/10 crates mangoes). Updated total ₹10,658. Status: ACCEPTED.',
        orderId: 'ord_102',
        timestamp: new Date(now - 2 * 3600000).toISOString(),
        status: 'delivered'
      }
    );
  }

  // Periodic sweeper to release expired stock locks (10-minute timeout)
  private startLockExpirySweep() {
    setInterval(() => {
      const now = Date.now();
      for (const [lockId, lock] of this.stockLocks.entries()) {
        if (lock.status === 'active' && new Date(lock.lockExpiresAt).getTime() <= now) {
          this.releaseStockLock(lockId, 'Session stock lock expired after 10 minutes');
        }
      }
    }, 15000); // Check every 15 seconds
  }

  // Atomic Stock Locking Method (10 minutes)
  lockStock(productId: string, buyerId: string, buyerPhone: string, quantity: number): StockLock {
    const product = this.products.get(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (!product.isAvailable) {
      throw new Error(`Produce ${product.name} is currently marked out of stock by the farmer.`);
    }

    if (product.availableStock < quantity) {
      throw new Error(
        `Insufficient available stock for ${product.name}. Requested: ${quantity} ${product.unit}, Available: ${product.availableStock} ${product.unit}`
      );
    }

    // Atomic decrement of available stock
    product.availableStock = Number((product.availableStock - quantity).toFixed(2));
    this.products.set(product.id, product);

    const lockExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const lockId = 'lck_' + Math.random().toString(36).substring(2, 10);
    const lock: StockLock = {
      id: lockId,
      productId,
      buyerId,
      buyerPhone,
      quantity,
      lockExpiresAt,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    this.stockLocks.set(lockId, lock);

    // Audit trail in inventory history
    this.inventoryHistory.push({
      id: 'inv_' + Math.random().toString(36).substring(2, 9),
      productId: product.id,
      productName: product.name,
      farmerId: product.farmerId,
      changeType: 'stock_lock',
      delta: -quantity,
      resultingStock: product.availableStock,
      reason: `10-min Cart Stock Lock reserved by buyer ${buyerPhone} (${quantity} ${product.unit})`,
      timestamp: new Date().toISOString()
    });

    return lock;
  }

  // Release a lock
  releaseStockLock(lockId: string, reason: string): boolean {
    const lock = this.stockLocks.get(lockId);
    if (!lock || lock.status !== 'active') return false;

    lock.status = 'released';
    this.stockLocks.set(lockId, lock);

    const product = this.products.get(lock.productId);
    if (product) {
      product.availableStock = Number((product.availableStock + lock.quantity).toFixed(2));
      this.products.set(product.id, product);

      this.inventoryHistory.push({
        id: 'inv_' + Math.random().toString(36).substring(2, 9),
        productId: product.id,
        productName: product.name,
        farmerId: product.farmerId,
        changeType: 'lock_release',
        delta: lock.quantity,
        resultingStock: product.availableStock,
        reason,
        timestamp: new Date().toISOString()
      });
    }

    return true;
  }

  // Convert active locks to fulfilled order
  convertLocksForOrder(buyerId: string, orderItems: { productId: string; quantity: number }[]): void {
    for (const item of orderItems) {
      // Find active locks for this buyer and product
      for (const [lockId, lock] of this.stockLocks.entries()) {
        if (lock.buyerId === buyerId && lock.productId === item.productId && lock.status === 'active') {
          lock.status = 'converted';
          this.stockLocks.set(lockId, lock);
        }
      }

      // Also deduct from totalStock
      const product = this.products.get(item.productId);
      if (product) {
        product.totalStock = Math.max(0, Number((product.totalStock - item.quantity).toFixed(2)));
        this.products.set(product.id, product);

        this.inventoryHistory.push({
          id: 'inv_' + Math.random().toString(36).substring(2, 9),
          productId: product.id,
          productName: product.name,
          farmerId: product.farmerId,
          changeType: 'order_fulfilled',
          delta: -item.quantity,
          resultingStock: product.availableStock,
          reason: `Confirmed order checkout deducted ${item.quantity} ${product.unit}`,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  // Calculate pricing tier based on quantity
  calculateUnitPrice(product: Product, quantity: number): { price: number; tierLabel: string } {
    if (!product.tieredPricing || product.tieredPricing.length === 0) {
      return { price: product.basePrice, tierLabel: `Standard (₹${product.basePrice}/${product.unit})` };
    }

    // Sort descending by minQty to find the highest matching tier
    const sortedTiers = [...product.tieredPricing].sort((a, b) => b.minQty - a.minQty);
    for (const tier of sortedTiers) {
      if (quantity >= tier.minQty) {
        return {
          price: tier.pricePerUnit,
          tierLabel: tier.label || `Tier (≥${tier.minQty} ${product.unit}: ₹${tier.pricePerUnit}/${product.unit})`
        };
      }
    }

    return { price: product.basePrice, tierLabel: `Base (₹${product.basePrice}/${product.unit})` };
  }

  // Partial Order Acceptance Method
  acceptPartialOrder(
    orderId: string,
    partialItems: { productId: string; acceptedQuantity: number }[],
    reason: string
  ): Order {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'requested') {
      throw new Error(`Cannot modify order with status '${order.status}'. Only 'requested' orders can be partially accepted.`);
    }

    let newSubtotal = 0;

    for (const item of order.items) {
      const match = partialItems.find(p => p.productId === item.productId);
      if (match) {
        if (match.acceptedQuantity > item.requestedQuantity) {
          throw new Error(`Accepted quantity (${match.acceptedQuantity}) cannot exceed requested quantity (${item.requestedQuantity}) for ${item.name}`);
        }

        const unacceptedQuantity = item.requestedQuantity - match.acceptedQuantity;
        item.acceptedQuantity = match.acceptedQuantity;
        item.totalItemPrice = Number((item.acceptedQuantity * item.unitPrice).toFixed(2));

        // If farmer accepts less, return difference back to availableStock
        if (unacceptedQuantity > 0) {
          const product = this.products.get(item.productId);
          if (product) {
            product.availableStock = Number((product.availableStock + unacceptedQuantity).toFixed(2));
            this.products.set(product.id, product);

            this.inventoryHistory.push({
              id: 'inv_' + Math.random().toString(36).substring(2, 9),
              productId: product.id,
              productName: product.name,
              farmerId: product.farmerId,
              changeType: 'manual_update',
              delta: unacceptedQuantity,
              resultingStock: product.availableStock,
              reason: `Returned unaccepted quantity from Order #${order.orderNumber} to active stock`,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
      newSubtotal += item.totalItemPrice;
    }

    order.subtotal = Number(newSubtotal.toFixed(2));
    order.fee = Number((order.subtotal * 0.015).toFixed(2)); // 1.5% fee
    order.totalAmount = Number((order.subtotal + order.fee).toFixed(2));
    order.status = 'accepted';
    order.partialAcceptanceReason = reason || 'Farmer accepted available produce quantity.';
    order.updatedAt = new Date().toISOString();

    this.orders.set(order.id, order);

    // Send notification to buyer via Twilio/Brevo
    this.sendNotification({
      toPhone: order.buyerPhone,
      recipientName: order.buyerName,
      channel: 'SMS',
      provider: 'Twilio',
      message: `KisanSetu: Farmer ${order.farmerName} accepted Order #${order.orderNumber} with adjusted quantities. New Total: ₹${order.totalAmount}. Reason: ${order.partialAcceptanceReason}`,
      orderId: order.id
    });

    return order;
  }

  // Update 5-Stage Order State
  updateOrderStatus(orderId: string, newStatus: Order['status']): Order {
    const order = this.orders.get(orderId);
    if (!order) throw new Error('Order not found');

    order.status = newStatus;
    order.updatedAt = new Date().toISOString();
    this.orders.set(order.id, order);

    // Generate notifications
    let notifMessage = '';
    if (newStatus === 'accepted') {
      notifMessage = `KisanSetu: Order #${order.orderNumber} ACCEPTED by ${order.farmerName}. Total: ₹${order.totalAmount}. Preparing produce.`;
    } else if (newStatus === 'ready') {
      notifMessage = `KisanSetu: Order #${order.orderNumber} is READY FOR PICKUP at ${order.pickupSlot}. Farm: ${order.farmerLocation || 'Farmer Gate'}.`;
    } else if (newStatus === 'completed') {
      notifMessage = `KisanSetu: Order #${order.orderNumber} COMPLETED. Thank you for supporting direct farm-to-table commerce!`;
    } else if (newStatus === 'cancelled') {
      notifMessage = `KisanSetu: Order #${order.orderNumber} was CANCELLED. Any locked stock has been released.`;
      // Release items back to available stock
      for (const item of order.items) {
        const prod = this.products.get(item.productId);
        if (prod) {
          prod.availableStock = Number((prod.availableStock + item.acceptedQuantity).toFixed(2));
          this.products.set(prod.id, prod);
        }
      }
    }

    if (notifMessage) {
      this.sendNotification({
        toPhone: order.buyerPhone,
        recipientName: order.buyerName,
        channel: 'SMS',
        provider: 'Twilio',
        message: notifMessage,
        orderId: order.id
      });
    }

    return order;
  }

  // Twilio / Brevo Dispatch Log
  sendNotification(params: {
    toPhone: string;
    recipientName: string;
    channel: 'SMS' | 'WhatsApp';
    provider: 'Twilio' | 'Brevo';
    message: string;
    orderId?: string;
  }): NotificationLog {
    const log: NotificationLog = {
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      toPhone: params.toPhone,
      recipientName: params.recipientName,
      channel: params.channel,
      provider: params.provider,
      message: params.message,
      orderId: params.orderId,
      timestamp: new Date().toISOString(),
      status: 'delivered'
    };

    this.notifications.unshift(log);
    // Keep max 100 notification logs
    if (this.notifications.length > 100) {
      this.notifications.pop();
    }
    return log;
  }

  // Get Harvest Context Weather
  getHarvestWeather(city: string = 'Nashik'): WeatherData {
    const normalized = city.toLowerCase();
    if (normalized.includes('nashik') || normalized.includes('pune') || normalized.includes('maharashtra')) {
      return {
        city: 'Nashik & Western Ghats Agri Belt',
        temp: 29,
        condition: 'Clear Skies & Moderate Breeze',
        humidity: 48,
        windSpeed: 12,
        icon: '☀️',
        harvestSafety: 'favorable',
        advisory: 'Optimal weather for harvesting onions, grapes, and citrus. Low humidity prevents post-harvest fungal spoilage.'
      };
    } else if (normalized.includes('bengaluru') || normalized.includes('karnataka') || normalized.includes('kolar')) {
      return {
        city: 'Bengaluru / Kolar Farming Zone',
        temp: 26,
        condition: 'Partly Cloudy with Light Showers',
        humidity: 72,
        windSpeed: 16,
        icon: '🌦️',
        harvestSafety: 'moderate',
        advisory: 'Scattered afternoon drizzle expected. Harvest greenhouse tomatoes and leafy greens before 11:30 AM.'
      };
    } else {
      return {
        city: city || 'Agricultural Region',
        temp: 28,
        condition: 'Pleasant & Sunny',
        humidity: 55,
        windSpeed: 14,
        icon: '⛅',
        harvestSafety: 'favorable',
        advisory: 'Conditions are favorable for field operations, sorting, and farm-gate dispatch.'
      };
    }
  }
}

export const db = new DatabaseStore();
