import express from 'express';
import type { Request, Response } from 'express';
import { db } from '../server/db.ts';
import { authenticateToken } from './auth.ts';
import type { Product, PricingTier } from '../src/types.ts';

export const productsRouter = express.Router();

/**
 * GET /api/products
 * Query params: category, maxPrice, search, freshness (today, 48h, all), farmerId
 */
productsRouter.get('/', (req: Request, res: Response): void => {
  try {
    const { category, maxPrice, search, freshness, farmerId } = req.query;

    let list = Array.from(db.products.values());

    if (farmerId) {
      list = list.filter(p => p.farmerId === farmerId);
    }

    if (category && category !== 'all') {
      list = list.filter(p => p.microCategory === category);
    }

    if (maxPrice && !isNaN(Number(maxPrice))) {
      list = list.filter(p => p.basePrice <= Number(maxPrice));
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      list = list.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.farmerLocation.toLowerCase().includes(q) ||
          p.farmerName.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    if (freshness && freshness !== 'all') {
      const now = Date.now();
      const oneDay = 86400000;
      if (freshness === 'today') {
        list = list.filter(p => {
          const diff = now - new Date(p.harvestDate).getTime();
          return diff <= oneDay;
        });
      } else if (freshness === '48h') {
        list = list.filter(p => {
          const diff = now - new Date(p.harvestDate).getTime();
          return diff <= 2 * oneDay;
        });
      }
    }

    // Sort: Available first, then newest harvest
    list.sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) {
        return a.isAvailable ? -1 : 1;
      }
      return new Date(b.harvestDate).getTime() - new Date(a.harvestDate).getTime();
    });

    res.json({ products: list });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching products' });
  }
});

/**
 * POST /api/products
 * Farmer creates produce listing with tiered bulk pricing, harvest freshness, and pickup windows
 */
productsRouter.post('/', authenticateToken, (req: Request, res: Response): void => {
  try {
    const user = (req as any).user;
    if (user.primaryRole !== 'supplier') {
      res.status(403).json({ message: 'Only registered farmers/suppliers can list produce.' });
      return;
    }

    const {
      name,
      microCategory,
      photos,
      unit,
      totalStock,
      basePrice,
      tieredPricing,
      harvestDate,
      pickupWindow,
      description,
      deliveryOptions,
    } = req.body;

    if (!name || !microCategory || totalStock === undefined || basePrice === undefined) {
      res.status(400).json({ message: 'Name, Category, Total Stock, and Base Price are required.' });
      return;
    }

    const newProdId = 'prod_' + Math.random().toString(36).substring(2, 9);
    const stockNum = Math.max(0, Number(totalStock));
    const basePriceNum = Math.max(1, Number(basePrice));

    // Ensure tiered pricing has reasonable structure
    let validTiers: PricingTier[] = Array.isArray(tieredPricing) && tieredPricing.length > 0
      ? tieredPricing
      : [
          { minQty: 1, maxQty: 20, pricePerUnit: basePriceNum, label: `Retail (1-20 ${unit || 'kg'})` },
          { minQty: 21, maxQty: 100, pricePerUnit: Math.round(basePriceNum * 0.9), label: `Bulk (21-100 ${unit || 'kg'})` },
          { minQty: 101, maxQty: undefined, pricePerUnit: Math.round(basePriceNum * 0.8), label: `Wholesale (>100 ${unit || 'kg'})` },
        ];

    const defaultPhotos = [
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
    ];

    const newProduct: Product = {
      id: newProdId,
      farmerId: user.id,
      farmerName: user.name,
      farmerPhone: user.phone,
      farmerLocation: user.location,
      name: name.trim(),
      microCategory,
      photos: Array.isArray(photos) && photos.length > 0 ? photos : defaultPhotos,
      unit: unit || 'kg',
      totalStock: stockNum,
      availableStock: stockNum,
      basePrice: basePriceNum,
      tieredPricing: validTiers,
      harvestDate: harvestDate ? new Date(harvestDate).toISOString() : new Date().toISOString(),
      pickupWindow: pickupWindow || 'Daily 7:00 AM - 11:30 AM',
      isAvailable: true,
      deliveryOptions: deliveryOptions || { farmPickup: true, directDelivery: true },
      description: description || 'Fresh farm-harvested produce direct from the grower.',
      createdAt: new Date().toISOString(),
    };

    db.products.set(newProduct.id, newProduct);

    // Audit in Inventory History
    db.inventoryHistory.push({
      id: 'inv_' + Math.random().toString(36).substring(2, 9),
      productId: newProduct.id,
      productName: newProduct.name,
      farmerId: user.id,
      changeType: 'initial',
      delta: stockNum,
      resultingStock: stockNum,
      reason: 'Produce lot listed on KisanSetu',
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({ message: 'Produce listing created successfully!', product: newProduct });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error creating produce listing' });
  }
});

/**
 * PATCH /api/products/:id/toggle-stock
 * One-tap toggle to mark In Stock or Out of Stock
 */
productsRouter.patch('/:id/toggle-stock', authenticateToken, (req: Request, res: Response): void => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const product = db.products.get(id);

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    // Verify ownership
    if (product.farmerId !== user.id) {
      res.status(403).json({ message: 'Unauthorized. You can only toggle stock for your own produce.' });
      return;
    }

    product.isAvailable = !product.isAvailable;
    db.products.set(product.id, product);

    // Audit
    db.inventoryHistory.push({
      id: 'inv_' + Math.random().toString(36).substring(2, 9),
      productId: product.id,
      productName: product.name,
      farmerId: user.id,
      changeType: 'manual_update',
      delta: 0,
      resultingStock: product.availableStock,
      reason: `Quick toggle switched availability to: ${product.isAvailable ? 'IN STOCK' : 'OUT OF STOCK'}`,
      timestamp: new Date().toISOString(),
    });

    res.json({
      message: `Produce is now marked ${product.isAvailable ? 'In Stock' : 'Out of Stock'}`,
      product,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error toggling stock' });
  }
});

/**
 * DELETE /api/products/:id
 */
productsRouter.delete('/:id', authenticateToken, (req: Request, res: Response): void => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const product = db.products.get(id);

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    if (product.farmerId !== user.id) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }

    db.products.delete(id);
    res.json({ message: 'Product listing removed' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});
