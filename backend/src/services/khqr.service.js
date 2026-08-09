// src/services/khqr.service.js
// Wraps the `bakong-khqr` SDK (generates the KHQR string + md5 hash for a
// given amount) and the separate Bakong Open API (checks whether that md5
// has since been paid). These are two different systems from NBC/Bakong:
// the SDK never talks to the network, it just encodes a payload; only the
// Open API call requires an access token and internet access.
const { BakongKHQR, khqrData, IndividualInfo } = require('bakong-khqr');
const QRCode = require('qrcode');
const prisma = require('../config/db');
const { decrypt } = require('../utils/crypto');

const khqr = new BakongKHQR();

const BAKONG_OPEN_API_BASE = 'https://api-bakong.nbc.gov.kh/v1';
const DEFAULT_QR_LIFETIME_MS = 5 * 60 * 1000; // 5 minutes

// Internal — the single settings row, thrown as a friendly error if KHQR
// hasn't been configured yet (no Bakong account ID, or toggle left off).
async function getKhqrSettings() {
  const settings = await prisma.storeSetting.findFirst();
  if (!settings || !settings.khqrEnabled || !settings.bakongAccountId) {
    const err = new Error('KHQR payment is not configured yet. Set it up in Admin Settings → Payment methods.');
    err.statusCode = 400;
    throw err;
  }
  return settings;
}

/**
 * Generate a KHQR string + md5 + scannable QR image for a given amount.
 * @param {number} amount
 * @param {string} billNumber - shown on some banking apps as a reference (e.g. order number)
 * @param {{ expiresInMs?: number }} [opts]
 */
async function generateKhqr(amount, billNumber, opts = {}) {
  const settings = await getKhqrSettings();
  const expiresInMs = opts.expiresInMs || DEFAULT_QR_LIFETIME_MS;
  const expirationTimestamp = Date.now() + expiresInMs;

  const currency = settings.khqrCurrency === 'KHR' ? khqrData.currency.khr : khqrData.currency.usd;
  // KHR is a whole-number currency in KHQR (no decimal places); USD keeps cents.
  const normalizedAmount = settings.khqrCurrency === 'KHR' ? Math.round(Number(amount)) : Math.round(Number(amount) * 100) / 100;

  const optionalData = {
    currency,
    amount: normalizedAmount,
    billNumber: String(billNumber).slice(0, 25),
    storeLabel: (settings.bakongMerchantName || settings.storeName || 'Store').slice(0, 25),
    terminalLabel: 'Web-Checkout',
    expirationTimestamp,
    // Required whenever bakongAccountId is a bank-level routing alias
    // (e.g. abaakhppxxx@abaa) rather than a personal alias — without the
    // real account number + bank name, scanning apps reject the QR as
    // "Invalid Qr Merchant Data" because they can't resolve which account
    // to credit.
    accountInformation: settings.bakongAccountNumber || undefined,
    acquiringBank: settings.bakongAcquiringBank || undefined,
    // Individual (non-merchant) Bakong accounts are registered under MCC
    // 0000 in Bakong's directory. The SDK defaults to 5999 (retail) if
    // omitted, which doesn't match what's on file for a personal account
    // and can get the QR rejected by the paying bank's app as invalid.
    merchantCategoryCode: settings.bakongAccountNumber ? '0000' : undefined,
  };

  const individualInfo = new IndividualInfo(
    settings.bakongAccountId,
    (settings.bakongMerchantName || settings.storeName || 'Store').slice(0, 25),
    (settings.bakongMerchantCity || 'Phnom Penh').slice(0, 15),
    optionalData
  );

  const response = khqr.generateIndividual(individualInfo);

  if (!response || response.status?.code !== 0) {
    const err = new Error(response?.status?.message || 'Failed to generate KHQR code');
    err.statusCode = 400;
    throw err;
  }

  const qrImage = await QRCode.toDataURL(response.data.qr, {
    errorCorrectionLevel: 'M',
    width: 320,
    margin: 2,
  });

  return {
    qrString: response.data.qr,
    md5: response.data.md5,
    qrImage,
    expiresAt: new Date(expirationTimestamp),
    currency: settings.khqrCurrency,
    amount: normalizedAmount,
  };
}

/**
 * Check whether a KHQR (by md5) has been paid, via Bakong Open API.
 * Returns { paid: boolean }. Never throws for "not paid yet" — only for
 * missing/invalid configuration, which callers should surface clearly
 * rather than silently treating as "still pending".
 */
async function checkPaid(md5) {
  const settings = await prisma.storeSetting.findFirst();
  const token = settings?.bakongTokenEncrypted ? decrypt(settings.bakongTokenEncrypted) : null;

  if (!token) {
    const err = new Error('Bakong Open API access token is not set. Add it in Admin Settings → Payment methods.');
    err.statusCode = 400;
    throw err;
  }

  const res = await fetch(`${BAKONG_OPEN_API_BASE}/check_transaction_by_md5`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ md5 }),
  });

  // Bakong returns 404 while the transaction hasn't landed yet — that's a
  // normal "not paid" state, not an error worth surfacing. But 401/403
  // (token invalid/expired) and 5xx are real problems: if we swallow them
  // as "not paid" too, a paid order polls forever and never flips to PAID,
  // with no visible error anywhere. Surface those instead.
  if (res.status === 404) {
    return { paid: false };
  }
  if (!res.ok) {
    const bodyText = await res.text().catch(() => '');
    const err = new Error(
      res.status === 401 || res.status === 403
        ? 'Bakong Open API token is invalid or expired. Update it in Admin Settings → Payment methods.'
        : `Bakong Open API error (HTTP ${res.status}). Payment status could not be verified.`
    );
    err.statusCode = 502;
    console.error('[khqr] check_transaction_by_md5 failed:', res.status, bodyText);
    throw err;
  }

  const json = await res.json().catch(() => null);
  // responseCode 0 = transaction found (paid). responseCode 1 = "not found /
  // not yet paid" — this is Bakong's NORMAL response while waiting, and per
  // their docs it comes back as HTTP 200 (not a 4xx/5xx), so the !res.ok
  // check above does NOT catch it. If an order is genuinely paid but this
  // keeps returning responseCode 1 forever, it is almost never a "payment
  // didn't happen" problem — it's a config mismatch, most commonly: the
  // bakongToken was issued for a DIFFERENT Bakong account than the one in
  // bakongAccountId that the QR was generated against, so the token can
  // only see its own account's transactions, never this one's.
  console.log('[khqr] check_transaction_by_md5', {
    md5,
    responseCode: json?.responseCode,
    responseMessage: json?.responseMessage,
  });
  return { paid: json?.responseCode === 0, raw: json };
}

module.exports = { generateKhqr, checkPaid, getKhqrSettings };