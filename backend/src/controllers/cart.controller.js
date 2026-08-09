// src/controllers/cart.controller.js
const prisma = require('../config/db');
const { validateCartInput } = require('../utils/validators');
const { toCartItem } = require('../utils/serializers');

const CART_ITEM_INCLUDE = {
  variant: { include: { product: true } },
};

async function getCart(req, res) {
  try {
    const userId = req.user.id;

    const items = await prisma.cartItem.findMany({
      where: { userId },
      include: CART_ITEM_INCLUDE,
      orderBy: { id: 'asc' },
    });

    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.variant.product.price) * item.quantity,
      0
    );

    return res.status(200).json({
      success: true,
      data: {
        items: items.map(toCartItem),
        subtotal: Number(subtotal.toFixed(2)),
      },
    });
  } catch (err) {
    console.error('Get cart error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch cart' });
  }
}

async function addToCart(req, res) {
  try {
    const userId = req.user.id;
    const { variantId, quantity } = req.body;

    const errors = validateCartInput({ variantId, quantity });
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0] });
    }

    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) {
      return res.status(404).json({ success: false, message: 'Product variant not found' });
    }

    // If this variant is already in the user's cart, merge quantities
    // instead of creating a duplicate row.
    const existing = await prisma.cartItem.findFirst({ where: { userId, variantId } });
    const requestedTotal = (existing?.quantity || 0) + Number(quantity);

    if (requestedTotal > variant.stockQuantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${variant.stockQuantity} items in stock`,
      });
    }

    let cartItem;
    if (existing) {
      cartItem = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: requestedTotal },
        include: CART_ITEM_INCLUDE,
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: { userId, variantId, quantity: Number(quantity) },
        include: CART_ITEM_INCLUDE,
      });
    }

    return res.status(201).json({ success: true, data: toCartItem(cartItem) });
  } catch (err) {
    console.error('Add to cart error:', err);
    return res.status(500).json({ success: false, message: 'Failed to add item to cart' });
  }
}

async function updateCartItem(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { quantity } = req.body;

    const errors = validateCartInput({ quantity }, { partial: true });
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0] });
    }

    const existing = await prisma.cartItem.findUnique({
      where: { id },
      include: { variant: true },
    });

    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    if (Number(quantity) > existing.variant.stockQuantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${existing.variant.stockQuantity} items in stock`,
      });
    }

    const updated = await prisma.cartItem.update({
      where: { id },
      data: { quantity: Number(quantity) },
      include: CART_ITEM_INCLUDE,
    });

    return res.status(200).json({ success: true, data: toCartItem(updated) });
  } catch (err) {
    console.error('Update cart item error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update cart item' });
  }
}

async function removeCartItem(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existing = await prisma.cartItem.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    await prisma.cartItem.delete({ where: { id } });

    return res.status(200).json({ success: true, data: { deleted: true } });
  } catch (err) {
    console.error('Remove cart item error:', err);
    return res.status(500).json({ success: false, message: 'Failed to remove cart item' });
  }
}

module.exports = { getCart, addToCart, updateCartItem, removeCartItem };