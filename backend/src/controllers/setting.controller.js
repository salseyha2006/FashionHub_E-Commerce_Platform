// src/controllers/setting.controller.js
const prisma = require('../config/db');
const { validateStoreSettingInput } = require('../utils/validators');
const { encrypt } = require('../utils/crypto');
const { isSafeUrl } = require('../utils/urlSafety');

// Phase 11 — defaults used only the very first time a settings row is
// created for a fresh environment (mirrors what the migration backfills
// for existing rows, so dev/test DBs created via `prisma migrate deploy`
// without ever running the historical migration still get sane presets).
const DEFAULT_COLOR_PRESETS = [
  { name: 'Black', hex: '#000000' }, { name: 'White', hex: '#FFFFFF' },
  { name: 'Gray', hex: '#9CA3AF' }, { name: 'Red', hex: '#EF4444' },
  { name: 'Blue', hex: '#3B82F6' }, { name: 'Navy', hex: '#1E3A8A' },
  { name: 'Green', hex: '#22C55E' }, { name: 'Yellow', hex: '#EAB308' },
  { name: 'Pink', hex: '#EC4899' }, { name: 'Purple', hex: '#A855F7' },
  { name: 'Orange', hex: '#F97316' }, { name: 'Brown', hex: '#92400E' },
  { name: 'Beige', hex: '#D6C7A1' },
];
const DEFAULT_SIZE_PRESETS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const DEFAULT_HOMEPAGE_SECTIONS = [
  { id: 'hero', label: 'Hero banner', visible: true },
  { id: 'categories', label: 'Featured categories', visible: true },
  { id: 'featured', label: 'Featured products', visible: true },
];

// Phase 14 — fields whose *values* never get written to the audit log,
// only whether they changed. Financial/credential data doesn't belong in
// an audit trail even redacted-in-place; a boolean is enough for
// accountability without becoming a second place secrets leak from.
const AUDIT_REDACTED_FIELDS = new Set(['smtpPasswordEncrypted', 'bankAccountNumber']);

// Internal helper: guarantees exactly one settings row exists (self-healing
// in case migrations/seed haven't created it yet on a fresh environment).
async function getOrCreateSettings() {
  let settings = await prisma.storeSetting.findFirst();
  if (!settings) {
    settings = await prisma.storeSetting.create({
      data: {
        colorPresets: DEFAULT_COLOR_PRESETS,
        sizePresets: DEFAULT_SIZE_PRESETS,
        homepageSections: DEFAULT_HOMEPAGE_SECTIONS,
      },
    });
  }
  return settings;
}

function toSettingDTO(s) {
  return {
    id: s.id,
    storeName: s.storeName,
    storeLogoUrl: s.storeLogoUrl,
    contactPhone: s.contactPhone,
    contactEmail: s.contactEmail,
    storeAddress: s.storeAddress,
    currencySymbol: s.currencySymbol,
    defaultTaxRate: Number(s.defaultTaxRate),
    shippingFee: Number(s.shippingFee),
    freeShippingMin: s.freeShippingMin != null ? Number(s.freeShippingMin) : null,
    bankName: s.bankName,
    bankAccountNumber: s.bankAccountNumber,
    bankAccountName: s.bankAccountName,
    bankQrImageUrl: s.bankQrImageUrl,
    codEnabled: s.codEnabled,
    bankTransferEnabled: s.bankTransferEnabled,
    themePrimaryColor: s.themePrimaryColor,
    themeRadiusStyle: s.themeRadiusStyle,
    themeFont: s.themeFont,
    faviconUrl: s.faviconUrl,
    colorPresets: s.colorPresets,
    sizePresets: s.sizePresets,
    homepageSections: s.homepageSections,
    // Phase 13
    seoTitle: s.seoTitle,
    seoDescription: s.seoDescription,
    ogImageUrl: s.ogImageUrl,
    gaId: s.gaId,
    smtpHost: s.smtpHost,
    smtpPort: s.smtpPort,
    smtpUser: s.smtpUser,
    smtpPasswordSet: !!s.smtpPasswordEncrypted, // never return the encrypted blob itself
    notificationEmailFrom: s.notificationEmailFrom,
    maintenanceMode: s.maintenanceMode,
    defaultLanguage: s.defaultLanguage,
    timezone: s.timezone,
    updatedAt: s.updatedAt,
  };
}

// GET /api/admin/settings — admin, full record
async function getSettings(req, res) {
  try {
    const settings = await getOrCreateSettings();
    return res.status(200).json({ success: true, data: toSettingDTO(settings) });
  } catch (err) {
    console.error('Get settings error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
}

// PUT /api/admin/settings — admin, partial update (upsert onto the single row)
async function updateSettings(req, res) {
  try {
    const {
      storeName, storeLogoUrl, contactPhone, contactEmail, storeAddress,
      currencySymbol, defaultTaxRate, shippingFee, freeShippingMin,
      bankName, bankAccountNumber, bankAccountName, bankQrImageUrl,
      codEnabled, bankTransferEnabled,
      themePrimaryColor, themeRadiusStyle, themeFont, faviconUrl,
      colorPresets, sizePresets, homepageSections,
      seoTitle, seoDescription, ogImageUrl, gaId,
      smtpHost, smtpPort, smtpUser, smtpPassword, notificationEmailFrom,
      maintenanceMode, defaultLanguage, timezone,
    } = req.body;

    const errors = validateStoreSettingInput(
      {
        storeName, defaultTaxRate, shippingFee, freeShippingMin,
        themePrimaryColor, themeRadiusStyle, themeFont, colorPresets, sizePresets, homepageSections,
        storeLogoUrl, faviconUrl, bankQrImageUrl, ogImageUrl,
        smtpPort, maintenanceMode, defaultLanguage,
      },
      { partial: true }
    );
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0] });
    }

    const existing = await getOrCreateSettings();

    const data = {
      ...(storeName !== undefined && { storeName: storeName.trim() }),
      ...(storeLogoUrl !== undefined && { storeLogoUrl: storeLogoUrl || null }),
      ...(contactPhone !== undefined && { contactPhone: contactPhone || null }),
      ...(contactEmail !== undefined && { contactEmail: contactEmail || null }),
      ...(storeAddress !== undefined && { storeAddress: storeAddress || null }),
      ...(currencySymbol !== undefined && { currencySymbol }),
      ...(defaultTaxRate !== undefined && { defaultTaxRate }),
      ...(shippingFee !== undefined && { shippingFee }),
      ...(freeShippingMin !== undefined && { freeShippingMin: freeShippingMin ?? null }),
      ...(bankName !== undefined && { bankName: bankName || null }),
      ...(bankAccountNumber !== undefined && { bankAccountNumber: bankAccountNumber || null }),
      ...(bankAccountName !== undefined && { bankAccountName: bankAccountName || null }),
      ...(bankQrImageUrl !== undefined && { bankQrImageUrl: bankQrImageUrl || null }),
      ...(codEnabled !== undefined && { codEnabled }),
      ...(bankTransferEnabled !== undefined && { bankTransferEnabled }),
      ...(themePrimaryColor !== undefined && { themePrimaryColor }),
      ...(themeRadiusStyle !== undefined && { themeRadiusStyle }),
      ...(themeFont !== undefined && { themeFont }),
      ...(faviconUrl !== undefined && { faviconUrl: faviconUrl || null }),
      ...(colorPresets !== undefined && { colorPresets }),
      ...(sizePresets !== undefined && { sizePresets }),
      ...(homepageSections !== undefined && { homepageSections }),
      // Phase 13
      ...(seoTitle !== undefined && { seoTitle: seoTitle || null }),
      ...(seoDescription !== undefined && { seoDescription: seoDescription || null }),
      ...(ogImageUrl !== undefined && { ogImageUrl: ogImageUrl || null }),
      ...(gaId !== undefined && { gaId: gaId || null }),
      ...(smtpHost !== undefined && { smtpHost: smtpHost || null }),
      ...(smtpPort !== undefined && { smtpPort: smtpPort || null }),
      ...(smtpUser !== undefined && { smtpUser: smtpUser || null }),
      ...(notificationEmailFrom !== undefined && { notificationEmailFrom: notificationEmailFrom || null }),
      ...(maintenanceMode !== undefined && { maintenanceMode }),
      ...(defaultLanguage !== undefined && { defaultLanguage }),
      ...(timezone !== undefined && { timezone }),
    };

    // smtpPassword is write-only: a non-empty string (re)encrypts and
    // replaces it, an explicit empty string clears it, `undefined` (the
    // field just wasn't sent) leaves whatever is already stored untouched.
    if (smtpPassword !== undefined) {
      data.smtpPasswordEncrypted = smtpPassword ? encrypt(smtpPassword) : null;
    }

    const updated = await prisma.storeSetting.update({ where: { id: existing.id }, data });

    // Phase 14 — audit log. Best-effort: a logging failure should never
    // fail the actual settings update.
    try {
      await writeAuditLog(req.user, existing, updated, data);
    } catch (auditErr) {
      console.error('Audit log write failed:', auditErr);
    }

    return res.status(200).json({ success: true, data: toSettingDTO(updated) });
  } catch (err) {
    console.error('Update settings error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
}

// GET /api/settings — public, read-only, storefront-safe subset only
async function getPublicSettings(req, res) {
  try {
    const s = await getOrCreateSettings();
    return res.status(200).json({
      success: true,
      data: {
        storeName: s.storeName,
        storeLogoUrl: s.storeLogoUrl,
        currencySymbol: s.currencySymbol,
        shippingFee: Number(s.shippingFee),
        freeShippingMin: s.freeShippingMin != null ? Number(s.freeShippingMin) : null,
        bankName: s.bankName,
        bankAccountNumber: s.bankAccountNumber,
        bankAccountName: s.bankAccountName,
        bankQrImageUrl: s.bankQrImageUrl,
        codEnabled: s.codEnabled,
        bankTransferEnabled: s.bankTransferEnabled,
        themePrimaryColor: s.themePrimaryColor,
        themeRadiusStyle: s.themeRadiusStyle,
        themeFont: s.themeFont,
        faviconUrl: s.faviconUrl,
        homepageSections: s.homepageSections,
        // Phase 13 — storefront-safe subset only. SMTP credentials never
        // leave the admin-only DTO above.
        seoTitle: s.seoTitle,
        seoDescription: s.seoDescription,
        ogImageUrl: s.ogImageUrl,
        gaId: s.gaId,
        maintenanceMode: s.maintenanceMode,
        defaultLanguage: s.defaultLanguage,
      },
    });
  } catch (err) {
    console.error('Get public settings error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
}

// Phase 14 — writes one audit-log row per settings update, redacting
// sensitive fields to a changed:true/false flag instead of their values.
async function writeAuditLog(reqUser, before, after, appliedData) {
  const changedFields = [];
  for (const field of Object.keys(appliedData)) {
    const from = before[field];
    const to = after[field];
    const same = JSON.stringify(from) === JSON.stringify(to);
    if (same) continue;

    if (AUDIT_REDACTED_FIELDS.has(field)) {
      changedFields.push({ field, changed: true });
    } else {
      changedFields.push({ field, from, to });
    }
  }
  if (changedFields.length === 0) return;

  let actorName = reqUser?.email || 'Unknown';
  let actorEmail = reqUser?.email || 'unknown';
  if (reqUser?.id) {
    const actor = await prisma.user.findUnique({ where: { id: reqUser.id }, select: { name: true, email: true } });
    if (actor) { actorName = actor.name; actorEmail = actor.email; }
  }

  await prisma.settingAuditLog.create({
    data: {
      actorId: reqUser?.id || null,
      actorName,
      actorEmail,
      changedFields,
    },
  });
}

// GET /api/admin/settings/audit-log — owner-only (mounted with requireAdmin)
async function listAuditLog(req, res) {
  try {
    const logs = await prisma.settingAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return res.status(200).json({ success: true, data: { logs } });
  } catch (err) {
    console.error('List audit log error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch audit log' });
  }
}

// GET /api/admin/settings/export — JSON backup of all settings.
// SMTP password is intentionally excluded: the encrypted blob is tied to
// this deployment's SETTINGS_ENCRYPTION_KEY and isn't portable across
// environments, so re-entering it after import is the safer default.
async function exportSettings(req, res) {
  try {
    const s = await getOrCreateSettings();
    const dto = toSettingDTO(s);
    delete dto.id;
    delete dto.updatedAt;
    delete dto.smtpPasswordSet;
    return res.status(200).json({
      success: true,
      data: { exportedAt: new Date().toISOString(), settings: dto },
    });
  } catch (err) {
    console.error('Export settings error:', err);
    return res.status(500).json({ success: false, message: 'Failed to export settings' });
  }
}

// PUT /api/admin/settings/import — restores a previously exported JSON blob.
// Runs through the exact same validation as a normal update; nothing here
// bypasses the checks in updateSettings.
async function importSettings(req, res) {
  try {
    const incoming = req.body?.settings;
    if (!incoming || typeof incoming !== 'object') {
      return res.status(400).json({ success: false, message: 'Missing "settings" object in import payload' });
    }
    // Delegate to the same code path as a normal PUT so validation,
    // redaction rules, and audit logging all stay in exactly one place.
    req.body = incoming;
    return updateSettings(req, res);
  } catch (err) {
    console.error('Import settings error:', err);
    return res.status(500).json({ success: false, message: 'Failed to import settings' });
  }
}

module.exports = {
  getSettings,
  updateSettings,
  getPublicSettings,
  listAuditLog,
  exportSettings,
  importSettings,
};
