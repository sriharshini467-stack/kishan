import express from 'express';
import type { Request, Response } from 'express';
import { db } from '../server/db.ts';
import { authenticateToken } from './auth.ts';
import type { Order, OrderItem } from '../src/types.ts';

export const ordersRouter = express.Router();

/**
 * POST /api/orders/lock-stock
 * Dynamic Stock Locking & Cart Validation
 * Atomic lock for 10 minutes during cart checkout to prevent overselling
 */
ordersRouter.post('/lock-stock', authenticateToken, (req: Request, res: Response): void => {
  try {
    const user = (req as any).user;
    const { productId, quantity } = req.body;

    if (!productId || !quantity || Number(quantity) <= 0) {
      res.status(400).json({ message: 'Valid productId and quantity are required.' });
      return;
    }

    const qty = Number(quantity);
    const lock = db.lockStock(productId, user.id, user.phone, qty);
    const product = db.products.get(productId);

    // Calculate applied tier price
    const { price, tierLabel } = db.calculateUnitPrice(product!, qty);

    res.json({
      message: `Successfully locked ${qty} ${product?.unit} for 10 minutes.`,
      lock,
      unitPrice: price,
      tierApplied: tierLabel,
      availableStock: product?.availableStock,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to lock stock.' });
  }
});

/**
 * POST /api/orders/release-lock
 * Buyer removes an item from cart or decrements quantity
 */
ordersRouter.post('/release-lock', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { lockId, reason } = req.body;
    if (!lockId) {
      res.status(400).json({ message: 'lockId is required' });
      return;
    }

    const success = db.releaseStockLock(lockId, reason || 'User removed or adjusted item in cart');
    res.json({ success, message: success ? 'Lock released' : 'Lock not found or already released' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /api/orders/checkout
 * Converts cart and locks into confirmed order
 * Invokes external Twilio/Brevo SMS alert to the farmer!
 */
ordersRouter.post('/checkout', authenticateToken, (req: Request, res: Response): void => {
  try {
    const user = (req as any).user;
    const { items, paymentMethod, pickupSlot, notes } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'Cart items are required for checkout.' });
      return;
    }

    // Group items by farmer (in our marketplace, one checkout per farm or unified checkout)
    const firstProd = db.products.get(items[0].productId);
    if (!firstProd) {
      res.status(400).json({ message: 'Product not found.' });
      return;
    }

    const farmerId = firstProd.farmerId;
    const farmerName = firstProd.farmerName;
    const farmerPhone = firstProd.farmerPhone;
    const farmerLocation = firstProd.farmerLocation;

    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    for (const cartItem of items) {
      const prod = db.products.get(cartItem.productId);
      if (!prod) continue;

      const qty = Number(cartItem.quantity);
      const { price } = db.calculateUnitPrice(prod, qty);
      const totalItemPrice = Number((qty * price).toFixed(2));
      subtotal += totalItemPrice;

      orderItems.push({
        productId: prod.id,
        name: prod.name,
        unit: prod.unit,
        requestedQuantity: qty,
        acceptedQuantity: qty,
        unitPrice: price,
        totalItemPrice,
        photo: prod.photos?.[0],
      });
    }

    const fee = Number((subtotal * 0.015).toFixed(2));
    const totalAmount = Number((subtotal + fee).toFixed(2));
    const orderNumber = 'KS-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

    const newOrder: Order = {
      id: 'ord_' + Math.random().toString(36).substring(2, 9),
      orderNumber,
      buyerId: user.id,
      buyerName: user.name,
      buyerPhone: user.phone,
      buyerLocation: user.location,
      buyerType: user.subRole || 'commercial_buyer',
      farmerId,
      farmerName,
      farmerPhone,
      farmerLocation,
      items: orderItems,
      subtotal: Number(subtotal.toFixed(2)),
      fee,
      totalAmount,
      status: 'requested',
      paymentMethod: paymentMethod || 'cash_on_pickup',
      pickupSlot: pickupSlot || firstProd.pickupWindow || 'Standard Harvest Pickup Window',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Convert locks to permanent checkout deduction
    db.convertLocksForOrder(
      user.id,
      items.map(i => ({ productId: i.productId, quantity: Number(i.quantity) }))
    );

    // Save order
    db.orders.set(newOrder.id, newOrder);

    // External Service: Twilio / Brevo SMS notification to farmer
    const itemsSummary = orderItems.map(i => `${i.acceptedQuantity} ${i.unit} ${i.name}`).join(', ');
    db.sendNotification({
      toPhone: farmerPhone,
      recipientName: farmerName,
      channel: 'SMS',
      provider: 'Twilio',
      message: `KisanSetu Alert: New Order #${orderNumber} from ${user.name} (${user.location})! Items: ${itemsSummary}. Total: ₹${totalAmount}. Please open KisanSetu to accept.`,
      orderId: newOrder.id,
    });

    res.status(201).json({
      message: 'Order placed successfully! Farmer has been alerted via SMS.',
      order: newOrder,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error processing checkout.' });
  }
});

/**
 * GET /api/orders/farmer
 * Returns incoming and active orders for logged-in farmer
 */
ordersRouter.get('/farmer', authenticateToken, (req: Request, res: Response): void => {
  try {
    const user = (req as any).user;
    const farmerOrders = Array.from(db.orders.values())
      .filter(o => o.farmerId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ orders: farmerOrders });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/orders/buyer
 * Returns orders placed by logged-in buyer
 */
ordersRouter.get('/buyer', authenticateToken, (req: Request, res: Response): void => {
  try {
    const user = (req as any).user;
    const buyerOrders = Array.from(db.orders.values())
      .filter(o => o.buyerId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ orders: buyerOrders });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * PATCH /api/orders/:id/partial-accept
 * Partial Order Acceptance Endpoint:
 * Farmers can accept partial quantities (e.g., accept 30 kg out of 40 kg requested),
 * auto-recalculating order totals and returning unaccepted inventory to stock.
 */
ordersRouter.patch('/:id/partial-accept', authenticateToken, (req: Request, res: Response): void => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { partialItems, reason } = req.body;

    const order = db.orders.get(id);
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    if (order.farmerId !== user.id) {
      res.status(403).json({ message: 'Unauthorized. You can only manage orders addressed to your farm.' });
      return;
    }

    if (!Array.isArray(partialItems) || partialItems.length === 0) {
      res.status(400).json({ message: 'partialItems array required with productId and acceptedQuantity.' });
      return;
    }

    const updatedOrder = db.acceptPartialOrder(id, partialItems, reason);

    res.json({
      message: 'Order partially accepted! Totals recalculated and buyer notified via SMS/WhatsApp.',
      order: updatedOrder,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error processing partial acceptance.' });
  }
});

/**
 * PATCH /api/orders/:id/status
 * 5-Stage Order State Machine: requested -> accepted -> ready -> completed (or cancelled)
 */
ordersRouter.patch('/:id/status', authenticateToken, (req: Request, res: Response): void => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['requested', 'accepted', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    const order = db.orders.get(id);
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    // Check authorization: farmer can accept/ready/complete/cancel; buyer can cancel if requested
    if (order.farmerId !== user.id && order.buyerId !== user.id) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }

    const updated = db.updateOrderStatus(id, status);

    res.json({
      message: `Order #${updated.orderNumber} status updated to '${status}'. Alerts dispatched.`,
      order: updated,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});
