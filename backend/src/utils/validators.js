// src/utils/validators.js
const { isSafeUrl } = require('./urlSafety');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegisterInput({ name, email, password, phone }) {
  const errors = [];

  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('Name is required');
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
    errors.push('A valid email is required');
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (phone !== undefined && phone !== null && typeof phone !== 'string') {
    errors.push('Phone must be a string');
  }

  return errors;
}

function validateLoginInput({ email, password }) {
  const errors = [];

  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  }

  return errors;
}
// additions — append to existing file from Phase 2

function validateCategoryInput({ name }) {
  const errors = [];
  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('Category name is required');
  }
  return errors;
}

function validateProductInput({ name, categoryId, price, variants }, { partial = false } = {}) {
  const errors = [];

  if (!partial || name !== undefined) {
    if (!name || typeof name !== 'string' || !name.trim()) {
      errors.push('Product name is required');
    }
  }

  if (!partial || categoryId !== undefined) {
    if (!categoryId || typeof categoryId !== 'string') {
      errors.push('categoryId is required');
    }
  }

  if (!partial || price !== undefined) {
    if (price === undefined || price === null || isNaN(price) || Number(price) < 0) {
      errors.push('Price must be a number >= 0');
    }
  }

  if (!partial || variants !== undefined) {
    if (!Array.isArray(variants) || variants.length === 0) {
      errors.push('At least one variant is required');
    } else {
      const seen = new Set();
      for (const v of variants) {
        if (!v.size || !v.color) {
          errors.push('Each variant requires a size and color');
          break;
        }
        if (v.stockQuantity === undefined || v.stockQuantity === null || isNaN(v.stockQuantity) || Number(v.stockQuantity) < 0) {
          errors.push('Each variant requires a stockQuantity >= 0');
          break;
        }
        const key = `${v.size}::${v.color}`.toLowerCase();
        if (seen.has(key)) {
          errors.push(`Duplicate variant: size ${v.size}, color ${v.color} already exists`);
          break;
        }
        seen.add(key);
      }
    }
  }

  return errors;
}
// additions — append to existing file from Phases 2 & 3

function validateCartInput({ variantId, quantity }, { partial = false } = {}) {
  const errors = [];

  if (!partial) {
    if (!variantId || typeof variantId !== 'string') {
      errors.push('variantId is required');
    }
  }

  if (quantity === undefined || quantity === null || isNaN(quantity) || !Number.isInteger(Number(quantity)) || Number(quantity) < 1) {
    errors.push('quantity must be an integer >= 1');
  }

  return errors;
}

function validateOrderInput({ shippingAddress, phone, paymentMethod }) {
  const errors = [];
  const validPaymentMethods = ['cod', 'bank_transfer'];

  if (!shippingAddress || typeof shippingAddress !== 'string' || !shippingAddress.trim()) {
    errors.push('shippingAddress is required');
  }

  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    errors.push('phone is required');
  }

  if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
    errors.push('paymentMethod must be one of: cod, bank_transfer');
  }

  return errors;
}

// src/utils/validators.js — validatePosCheckoutInput
function validatePosCheckoutInput({ items, paymentMethod, discountAmount, taxRate }) {
  const errors = [];
  const validPaymentMethods = ['cash', 'cod', 'bank_transfer', 'qr'];

  if (!Array.isArray(items) || items.length === 0) {
    errors.push('items must be a non-empty array');
  } else {
    items.forEach((item, i) => {
      if (!item.variantId || typeof item.variantId !== 'string') {
        errors.push(`items[${i}].variantId is required`);
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        errors.push(`items[${i}].quantity must be a positive integer`);
      }
    });
  }

  if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
    errors.push('paymentMethod must be one of: cash, cod, bank_transfer');
  }

  if (discountAmount !== undefined && discountAmount !== null) {
    if (typeof discountAmount !== 'number' || discountAmount < 0) {
      errors.push('discountAmount must be a non-negative number');
    }
  }

  if (taxRate !== undefined && taxRate !== null) {
    if (typeof taxRate !== 'number' || taxRate < 0 || taxRate > 100) {
      errors.push('taxRate must be a number between 0 and 100');
    }
  }

  return errors;
}

const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

// Defines which statuses can move to which. Prevents nonsensical jumps
// (e.g. delivered -> pending) or edits to terminal states.
const ALLOWED_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

function validateStatusInput({ status }) {
  const errors = [];
  if (!status || !ORDER_STATUSES.includes(status)) {
    errors.push('status must be one of: ' + ORDER_STATUSES.join(', '));
  }
  return errors;
}

function isValidTransition(currentStatus, nextStatus) {
  return (ALLOWED_TRANSITIONS[currentStatus] || []).includes(nextStatus);
}

// additions — Step 2: StoreSetting validation
const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const VALID_RADIUS_STYLES = ['rounded', 'sharp', 'pill'];
const VALID_THEME_FONTS = ['inter', 'kantumruy', 'system'];

function validateStoreSettingInput(
  {
    storeName, defaultTaxRate, shippingFee, freeShippingMin, themePrimaryColor, themeRadiusStyle, themeFont,
    colorPresets, sizePresets, homepageSections,
    storeLogoUrl, faviconUrl, bankQrImageUrl, ogImageUrl,
    smtpPort, maintenanceMode, defaultLanguage,
  },
  { partial = false } = {}
) {
  const errors = [];

  // Phase 14 — security hardening: any admin-editable URL field must be
  // http(s) only. Applied here (not just in the frontend) since this
  // endpoint can be hit directly.
  for (const [label, value] of [
    ['storeLogoUrl', storeLogoUrl], ['faviconUrl', faviconUrl],
    ['bankQrImageUrl', bankQrImageUrl], ['ogImageUrl', ogImageUrl],
  ]) {
    if (value !== undefined && value !== null && value !== '' && !isSafeUrl(value)) {
      errors.push(`${label} must be a valid http(s) URL`);
    }
  }

  if (smtpPort !== undefined && smtpPort !== null) {
    if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
      errors.push('smtpPort must be an integer between 1 and 65535');
    }
  }

  if (maintenanceMode !== undefined && typeof maintenanceMode !== 'boolean') {
    errors.push('maintenanceMode must be a boolean');
  }

  if (defaultLanguage !== undefined && !['en', 'km'].includes(defaultLanguage)) {
    errors.push('defaultLanguage must be one of: en, km');
  }

  if (!partial || storeName !== undefined) {
    if (!storeName || typeof storeName !== 'string' || !storeName.trim()) {
      errors.push('storeName is required');
    }
  }

  if (defaultTaxRate !== undefined && defaultTaxRate !== null) {
    if (typeof defaultTaxRate !== 'number' || isNaN(defaultTaxRate) || defaultTaxRate < 0 || defaultTaxRate > 100) {
      errors.push('defaultTaxRate must be a number between 0 and 100');
    }
  }

  if (shippingFee !== undefined && shippingFee !== null) {
    if (typeof shippingFee !== 'number' || isNaN(shippingFee) || shippingFee < 0) {
      errors.push('shippingFee must be a non-negative number');
    }
  }

  if (freeShippingMin !== undefined && freeShippingMin !== null) {
    if (typeof freeShippingMin !== 'number' || isNaN(freeShippingMin) || freeShippingMin < 0) {
      errors.push('freeShippingMin must be a non-negative number');
    }
  }

  // Phase 10 — Theme & Branding: validated server-side too, never trust the
  // color <input type="color"> or dropdown alone since this endpoint can be
  // hit directly.
  if (themePrimaryColor !== undefined && themePrimaryColor !== null) {
    if (typeof themePrimaryColor !== 'string' || !HEX_COLOR_REGEX.test(themePrimaryColor)) {
      errors.push('themePrimaryColor must be a valid hex color (e.g. #f4297d)');
    }
  }

  if (themeRadiusStyle !== undefined && themeRadiusStyle !== null) {
    if (!VALID_RADIUS_STYLES.includes(themeRadiusStyle)) {
      errors.push('themeRadiusStyle must be one of: ' + VALID_RADIUS_STYLES.join(', '));
    }
  }

  if (themeFont !== undefined && themeFont !== null) {
    if (!VALID_THEME_FONTS.includes(themeFont)) {
      errors.push('themeFont must be one of: ' + VALID_THEME_FONTS.join(', '));
    }
  }

  // Phase 11 — Presets & Homepage Layout: these come from Admin-only forms,
  // but validate shape server-side regardless since the endpoint accepts
  // raw JSON in the request body.
  if (colorPresets !== undefined && colorPresets !== null) {
    if (!Array.isArray(colorPresets) || colorPresets.some(
      (p) => !p || typeof p.name !== 'string' || !p.name.trim() || typeof p.hex !== 'string' || !HEX_COLOR_REGEX.test(p.hex)
    )) {
      errors.push('colorPresets must be an array of { name, hex } with valid hex colors');
    }
  }

  if (sizePresets !== undefined && sizePresets !== null) {
    if (!Array.isArray(sizePresets) || sizePresets.some((s) => typeof s !== 'string' || !s.trim())) {
      errors.push('sizePresets must be an array of non-empty strings');
    }
  }

  if (homepageSections !== undefined && homepageSections !== null) {
    if (!Array.isArray(homepageSections) || homepageSections.some(
      (h) => !h || typeof h.id !== 'string' || typeof h.label !== 'string' || typeof h.visible !== 'boolean'
    )) {
      errors.push('homepageSections must be an array of { id, label, visible }');
    }
  }

  return errors;
}

function validateUpdateProfileInput({ name, email }) {
  const errors = [];

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      errors.push('Name is required');
    }
  }

  if (email !== undefined) {
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
      errors.push('A valid email is required');
    }
  }

  return errors;
}

function validateChangePasswordInput({ currentPassword, newPassword }) {
  const errors = [];

  if (!currentPassword || typeof currentPassword !== 'string') {
    errors.push('Current password is required');
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    errors.push('New password must be at least 8 characters');
  }

  return errors;
}

// Phase 12 — Roles & Permissions: staff invitations & permission edits.
const { PERMISSIONS } = require('./permissions');

function validateTeamInviteInput({ name, email, password, permissions }) {
  const errors = [];

  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('name is required');
  }
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.push('A valid email is required');
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (permissions !== undefined) {
    if (!Array.isArray(permissions) || permissions.some((p) => !PERMISSIONS.includes(p))) {
      errors.push('permissions must be an array of valid permission keys');
    }
  }

  return errors;
}

function validateTeamUpdateInput({ permissions, isActive }) {
  const errors = [];

  if (permissions !== undefined) {
    if (!Array.isArray(permissions) || permissions.some((p) => !PERMISSIONS.includes(p))) {
      errors.push('permissions must be an array of valid permission keys');
    }
  }
  if (isActive !== undefined && typeof isActive !== 'boolean') {
    errors.push('isActive must be a boolean');
  }

  return errors;
}

module.exports = {
  validateRegisterInput,
  validateLoginInput,
  validateCategoryInput,
  validateProductInput,
  validateCartInput,
  validateOrderInput,
  validateStatusInput,
  isValidTransition,
  validatePosCheckoutInput,
  validateStoreSettingInput,
  validateUpdateProfileInput,
  validateChangePasswordInput,
  validateTeamInviteInput,
  validateTeamUpdateInput,
};