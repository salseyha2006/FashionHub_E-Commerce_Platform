function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: user.permissions || [],
  };
}

// Find this function in serializers.js and replace it:
function toProductListItem(product) {
  const totalStock = product.variants?.reduce((sum, v) => sum + v.stockQuantity, 0) ?? 0;
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    images: product.images,
    inStock: totalStock > 0,
    totalStock, // NEW — used by admin product table for the stock column + low-stock highlight
    category: product.category ? { id: product.category.id, slug: product.category.slug, name: product.category.name } : null,
  };
}

function toProductDetail(product) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    images: product.images,
    isActive: product.isActive,
    category: product.category ? { id: product.category.id, slug: product.category.slug, name: product.category.name } : null,
    variants: product.variants,
  };
}

// Used by POS search — one row per sellable variant, with product info flattened in.
function toPosVariant(variant) {
  return {
    variantId: variant.id,
    sku: variant.sku,
    size: variant.size,
    color: variant.color,
    stockQuantity: variant.stockQuantity,
    productId: variant.product.id,
    productName: variant.product.name,
    price: variant.product.price,
    image: Array.isArray(variant.product.images) ? variant.product.images[0] : null,
  };
}

function toCartItem(item) {
  return {
    id: item.id,
    quantity: item.quantity,
    variant: {
      id: item.variant.id,
      size: item.variant.size,
      color: item.variant.color,
      stockQuantity: item.variant.stockQuantity,
      product: {
        id: item.variant.product.id,
        name: item.variant.product.name,
        price: item.variant.product.price,
        images: item.variant.product.images,
      },
    },
    quantity: item.quantity,
  };
}

function toOrderDetail(order) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    subtotalAmount: order.subtotalAmount,
    discountAmount: order.discountAmount,
    taxRate: order.taxRate,
    taxAmount: order.taxAmount,
    totalAmount: order.totalAmount,
    shippingAddress: order.shippingAddress,
    phone: order.phone,
    paymentMethod: order.paymentMethod,
    items: (order.items || []).map((item) => ({
      productNameSnapshot: item.productNameSnapshot,
      sizeSnapshot: item.sizeSnapshot,
      colorSnapshot: item.colorSnapshot,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    createdAt: order.createdAt,
  };
}

function toOrderSummary(order) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt,
  };
}

function toAdminOrderDetail(order) {
  return {
    ...toOrderDetail(order),
    customerName: order.user?.name,
    customerEmail: order.user?.email,
  };
}

function toAdminOrderSummary(order) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    totalAmount: order.totalAmount,
    customerName: order.user?.name,
    phone: order.phone,
    shippingAddress: order.shippingAddress,
    createdAt: order.createdAt,
  };
}


module.exports = {
  toPublicUser,
  toProductListItem,
  toProductDetail,
  toCartItem,
  toOrderDetail,
  toOrderSummary,
  toAdminOrderSummary,
  toAdminOrderDetail,
  toPosVariant,
};