// src/pages/admin/AdminPOS.jsx
// In-store point-of-sale: search/scan a product variant, build a running
// sale on the right, then checkout (Cash or QR) to create a completed
// ("delivered") order. No customer account or login required — this is
// for walk-ins. Renders full-screen (own header, no admin sidebar) — see
// the dedicated /admin/pos route in App.jsx.
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, Trash2, ScanLine, ShoppingBag, X, QrCode, Banknote, PauseCircle, PlayCircle, Clock, Camera } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'qr', label: 'QR Code' },
];

// Products at or below this remaining stock are flagged amber in the grid
// and cart so a cashier notices before selling out completely.
const LOW_STOCK_THRESHOLD = 5;

// Shared list markup for the Held Sales panel. `compact` shrinks row padding
// and icon sizes for the desktop dropdown; the mobile bottom sheet uses the
// roomier default sizing since it has a full-width touch surface to work with.
function HeldSalesList({ heldCarts, onResume, onDelete, compact }) {
  if (heldCarts.length === 0) {
    return (
      <p className="text-xs text-gray-400 text-center py-6 px-3">
        No held sales. Press <kbd className="px-1 py-0.5 rounded border border-gray-200 bg-gray-50 font-mono">F3</kbd> to park the current one.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-gray-100">
      {heldCarts.map((h) => {
        const heldTotal = h.cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const itemCount = h.cart.reduce((sum, i) => sum + i.quantity, 0);
        return (
          <li key={h.id} className={`flex items-center gap-2 ${compact ? 'px-3.5 py-2.5' : 'px-4 py-3'}`}>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">{h.label}</p>
              <p className="text-[11px] text-gray-500">
                {itemCount} item{itemCount !== 1 ? 's' : ''} · ${heldTotal.toFixed(2)} · {new Date(h.heldAt).toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => onResume(h.id)}
              title="Resume this sale"
              className={compact ? 'p-1.5 rounded hover:bg-primary-50 text-primary-600 shrink-0' : 'w-11 h-11 flex items-center justify-center rounded-full hover:bg-primary-50 active:bg-primary-100 text-primary-600 shrink-0'}
            >
              <PlayCircle size={compact ? 17 : 20} />
            </button>
            <button
              onClick={() => onDelete(h.id)}
              title="Discard this sale"
              className={compact ? 'p-1.5 rounded hover:bg-error-light text-error shrink-0' : 'w-11 h-11 flex items-center justify-center rounded-full hover:bg-error-light active:bg-error-light text-error shrink-0'}
            >
              <Trash2 size={compact ? 15 : 18} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default function AdminPOS() {
  const { token, user } = useAuth();
  const { showToast } = useToast();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(''); // '' = All
  const [cart, setCart] = useState([]); // [{ variantId, productName, size, color, price, stockQuantity, quantity, image }]
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discountInput, setDiscountInput] = useState('');
  const [taxRateInput, setTaxRateInput] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);
  const [invoice, setInvoice] = useState(null); // snapshot shown after a successful sale
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [amountReceived, setAmountReceived] = useState('');
  // Held (suspended) sales — a cashier can park the current cart to serve
  // another walk-in, then come back and resume it later. In-memory only:
  // fine for a single continuous POS session at one till.
  const [heldCarts, setHeldCarts] = useState([]);
  const [showHeldPanel, setShowHeldPanel] = useState(false);
  // Mobile-only: Products/Cart are shown as full-height tabs instead of
  // stacked on one long scrolling page (desktop keeps both side-by-side).
  const [mobileView, setMobileView] = useState('products'); // 'products' | 'cart'
  // Camera barcode scan — opens a full-screen live viewfinder (html5-qrcode)
  // as an alternative to a physical USB/Bluetooth scanner, for phones/tablets
  // with no external scanner attached.
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const searchInputRef = useRef(null);

  // Category chips — loaded once.
  useEffect(() => {
    apiClient.get('/categories').then(setCategories).catch(() => {});
  }, []);

  // Loads the browsable grid — called on mount, on every debounced
  // keystroke/scan, and whenever the category filter changes.
  async function loadProducts(q, category) {
    setSearching(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (category) params.set('category', category);
      const data = await apiClient.get(`/admin/pos/products?${params.toString()}`, { token });
      setResults(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSearching(false);
    }
  }

  // Debounced search — fires for typed queries, scanner input, and
  // category-chip changes. Also runs once on mount with q='' to populate
  // the default browsable grid.
  useEffect(() => {
    const q = query.trim();
    setSearching(true);
    const timer = setTimeout(() => {
      loadProducts(q, activeCategory);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, activeCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  // Barcode scanners just "type" into whatever's focused — keep the search
  // box focused after every cart change or modal close so scans always land.
  useEffect(() => {
    if (!showCheckoutModal && !invoice) {
      searchInputRef.current?.focus();
    }
  }, [cart.length, showCheckoutModal, invoice]);

  // Keyboard shortcuts for a mouse-free cashier flow:
  //  F2        → open checkout modal (only if cart has items)
  //  Escape    → close checkout modal / dismiss invoice
  //  Ctrl+Bksp → clear cart (guarded by confirm to avoid accidental wipes)
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'F2') {
        e.preventDefault();
        if (cart.length > 0 && !showCheckoutModal && !invoice) {
          setShowCheckoutModal(true);
        }
      } else if (e.key === 'F3') {
        e.preventDefault();
        if (cart.length > 0 && !showCheckoutModal && !invoice) {
          holdCurrentCart();
        }
      } else if (e.key === 'Escape') {
        if (showScanner) setShowScanner(false);
        else if (showCheckoutModal) setShowCheckoutModal(false);
        else if (invoice) setInvoice(null);
        else if (showHeldPanel) setShowHeldPanel(false);
      } else if (e.key === 'Backspace' && e.ctrlKey) {
        e.preventDefault();
        if (cart.length > 0 && window.confirm('Clear the current sale?')) {
          clearCart();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length, showCheckoutModal, invoice, showHeldPanel, showScanner]); // eslint-disable-line react-hooks/exhaustive-deps

  // Starts the camera the moment the scanner modal opens, stops and releases
  // it the moment it closes (unmount, successful scan, or Escape) — never
  // leaves the camera running in the background.
  useEffect(() => {
    if (!showScanner) return;

    let stopped = false;
    const scanner = new Html5Qrcode('pos-camera-scanner');
    setScannerError('');

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          if (stopped) return;
          stopped = true;
          handleScanResult(decodedText);
        },
        () => {} // per-frame "nothing decoded yet" callback — ignore and keep scanning
      )
      .catch(() => {
        setScannerError('Could not access the camera. Check camera permissions for this site and try again.');
      });

    return () => {
      stopped = true;
      scanner.stop().then(() => scanner.clear()).catch(() => {});
    };
  }, [showScanner]); // eslint-disable-line react-hooks/exhaustive-deps

  // A decoded barcode is looked up directly (not via the debounced search
  // state) so a scan resolves immediately instead of waiting on a keystroke
  // debounce timer or a stale `results` list.
  async function handleScanResult(code) {
    setShowScanner(false);
    try {
      const params = new URLSearchParams({ q: code });
      if (activeCategory) params.set('category', activeCategory);
      const data = await apiClient.get(`/admin/pos/products?${params.toString()}`, { token });
      const exact = data.find((r) => r.sku && r.sku.toLowerCase() === code.trim().toLowerCase());
      if (exact) {
        addToCart(exact);
        showToast(`Added ${exact.productName}`, 'success');
      } else {
        setQuery(code);
        showToast(`No exact SKU match for "${code}" — showing closest results instead`, 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      searchInputRef.current?.focus();
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    // Exact single SKU match (typical barcode scan) — add straight to cart.
    const exact = results.find((r) => r.sku && r.sku.toLowerCase() === query.trim().toLowerCase());
    if (exact) {
      addToCart(exact);
      setQuery('');
      setResults([]);
      searchInputRef.current?.focus();
    }
  }

  function addToCart(variant) {
    setCart((prev) => {
      const existing = prev.find((i) => i.variantId === variant.variantId);
      if (existing) {
        if (existing.quantity >= variant.stockQuantity) {
          showToast(`Only ${variant.stockQuantity} in stock`, 'error');
          return prev;
        }
        return prev.map((i) =>
          i.variantId === variant.variantId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      if (variant.stockQuantity < 1) {
        showToast('Out of stock', 'error');
        return prev;
      }
      // First item of a fresh sale — on mobile, jump straight to the Cart
      // tab so the cashier sees what they just added instead of having to
      // switch manually. Later items stay on Products so they can keep
      // adding without an extra tap each time.
      if (prev.length === 0) setMobileView('cart');
      return [
        ...prev,
        {
          variantId: variant.variantId,
          productName: variant.productName,
          size: variant.size,
          color: variant.color,
          price: Number(variant.price),
          stockQuantity: variant.stockQuantity,
          image: variant.image,
          quantity: 1,
        },
      ];
    });
  }

  function clearCart() {
    setCart([]);
  }

  // Parks the current in-progress sale so the cashier can serve someone
  // else immediately, without losing the first customer's items.
  function holdCurrentCart() {
    if (cart.length === 0) return;
    const label = customerName.trim() || `Hold #${heldCarts.length + 1}`;
    setHeldCarts((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        label,
        cart,
        customerName,
        customerPhone,
        discountInput,
        taxRateInput,
        heldAt: new Date().toISOString(),
      },
    ]);
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setDiscountInput('');
    setTaxRateInput('');
    showToast(`Sale held as "${label}"`, 'success');
    searchInputRef.current?.focus();
  }

  // Brings a held sale back into the active cart. If there's already an
  // unsaved sale in progress, that one is parked first so nothing is lost.
  function resumeHeldCart(id) {
    const held = heldCarts.find((h) => h.id === id);
    if (!held) return;

    if (cart.length > 0) {
      const label = customerName.trim() || `Hold #${heldCarts.length + 1}`;
      setHeldCarts((prev) => [
        ...prev.filter((h) => h.id !== id),
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          label,
          cart,
          customerName,
          customerPhone,
          discountInput,
          taxRateInput,
          heldAt: new Date().toISOString(),
        },
      ]);
    } else {
      setHeldCarts((prev) => prev.filter((h) => h.id !== id));
    }

    setCart(held.cart);
    setCustomerName(held.customerName);
    setCustomerPhone(held.customerPhone);
    setDiscountInput(held.discountInput);
    setTaxRateInput(held.taxRateInput);
    setShowHeldPanel(false);
    setMobileView('cart');
    searchInputRef.current?.focus();
  }

  function deleteHeldCart(id) {
    if (!window.confirm('Discard this held sale? This cannot be undone.')) return;
    setHeldCarts((prev) => prev.filter((h) => h.id !== id));
  }

  function updateQuantity(variantId, delta) {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.variantId !== variantId) return i;
          const nextQty = i.quantity + delta;
          if (nextQty > i.stockQuantity) {
            showToast(`Only ${i.stockQuantity} in stock`, 'error');
            return i;
          }
          return { ...i, quantity: nextQty };
        })
        .filter((i) => i.quantity > 0)
    );
  }

  function removeFromCart(variantId) {
    setCart((prev) => prev.filter((i) => i.variantId !== variantId));
  }

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountAmount = Math.min(Number(discountInput) || 0, subtotal);
  const taxRate = Math.min(Math.max(Number(taxRateInput) || 0, 0), 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = Math.round(taxableAmount * (taxRate / 100) * 100) / 100;
  const grandTotal = Math.round((taxableAmount + taxAmount) * 100) / 100;

  const amountReceivedNum = Number(amountReceived) || 0;
  const changeDue = Math.max(0, Math.round((amountReceivedNum - grandTotal) * 100) / 100);
  const cashInsufficient = paymentMethod === 'cash' && amountReceived !== '' && amountReceivedNum < grandTotal;

  async function handleCheckout() {
    if (cart.length === 0) return;
    setCheckingOut(true);
    try {
      const data = await apiClient.post(
        '/admin/pos/checkout',
        {
          items: cart.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          paymentMethod,
          amountReceived: paymentMethod === 'cash' ? amountReceivedNum : undefined,
          discountAmount,
          taxRate,
        },
        { token }
      );
      setInvoice({
        orderNumber: data.orderNumber,
        date: data.createdAt || new Date().toISOString(),
        cashier: user?.name,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        paymentMethod,
        amountReceived: paymentMethod === 'cash' ? amountReceivedNum : null,
        changeDue: paymentMethod === 'cash' ? changeDue : null,
        items: cart,
        subtotal,
        discountAmount,
        taxRate,
        taxAmount,
        total: grandTotal,
      });
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setPaymentMethod('cash');
      setDiscountInput('');
      setTaxRateInput('');
      setShowCheckoutModal(false);
      setAmountReceived('');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCheckingOut(false);
    }
  }
  return (
    <div className="fixed inset-0 z-40 bg-gray-25 flex flex-col">
      {/* Slim top bar — replaces the admin sidebar/header while in POS mode */}
      <header className="shrink-0 h-14 px-4 md:px-6 flex items-center justify-between border-b border-gray-200 bg-surface">
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-[7px] bg-[image:var(--gradient-primary)] shrink-0" aria-hidden="true" />
          <span className="text-sm font-semibold text-gray-900">Thida Shop · POS</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden md:flex items-center gap-2.5 text-[11px] text-gray-400">
            <span><kbd className="px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 font-mono">F2</kbd> Checkout</span>
            <span><kbd className="px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 font-mono">F3</kbd> Hold</span>
            <span><kbd className="px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 font-mono">Esc</kbd> Close</span>
          </span>

          <div className="relative">
            <button
              onClick={() => setShowHeldPanel((v) => !v)}
              className={`relative flex items-center gap-1.5 text-xs font-medium px-3 min-h-[40px] rounded-[var(--radius-sm)] transition-colors ${
                heldCarts.length > 0
                  ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
              }`}
            >
              <Clock size={15} strokeWidth={1.75} />
              Held
              {heldCarts.length > 0 && (
                <span className="ml-0.5 bg-amber-500 text-white text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center">
                  {heldCarts.length}
                </span>
              )}
            </button>

            {showHeldPanel && (
              <>
                {/* Mobile (<lg): full-width bottom sheet with backdrop — a w-72
                    dropdown pinned to the right can run off a narrow phone
                    screen, so this slides up from the bottom instead. */}
                <div
                  className="lg:hidden fixed inset-0 bg-black/40 z-50"
                  onClick={() => setShowHeldPanel(false)}
                />
                <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-lg max-h-[75vh] flex flex-col">
                  <div className="flex justify-center pt-2.5 pb-1 shrink-0">
                    <span className="w-9 h-1 rounded-full bg-gray-200" />
                  </div>
                  <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <p className="text-sm font-semibold text-gray-700">Held Sales</p>
                    <button
                      onClick={() => setShowHeldPanel(false)}
                      className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="overflow-y-auto pb-[env(safe-area-inset-bottom)]">
                    <HeldSalesList
                      heldCarts={heldCarts}
                      onResume={resumeHeldCart}
                      onDelete={deleteHeldCart}
                      compact={false}
                    />
                  </div>
                </div>

                {/* Desktop (lg+): compact dropdown anchored under the button */}
                <div className="hidden lg:block absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-[var(--radius-md)] shadow-lg z-50 overflow-hidden">
                  <div className="px-3.5 py-2.5 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-700">Held Sales</p>
                    <button onClick={() => setShowHeldPanel(false)} className="p-0.5 rounded hover:bg-gray-100 text-gray-400">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    <HeldSalesList
                      heldCarts={heldCarts}
                      onResume={resumeHeldCart}
                      onDelete={deleteHeldCart}
                      compact
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {user?.name && (
            <span className="text-xs text-gray-500 hidden sm:inline">Cashier: {user.name}</span>
          )}
          <Link
            to="/admin/dashboard"
            className="flex items-center text-xs font-medium text-gray-600 hover:text-gray-900 px-3 min-h-[40px] rounded-[var(--radius-sm)] hover:bg-gray-100 transition-colors"
          >
            Exit POS
          </Link>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-5">
        {/* Mobile-only tab bar: switches between the full-height Products
            grid and the full-height Cart panel. Hidden on lg+, where both
            panels sit side-by-side instead. */}
        <div className="lg:hidden flex shrink-0 border-b border-gray-200 bg-surface">
          <button
            onClick={() => setMobileView('products')}
            className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              mobileView === 'products'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            Products
          </button>
          <button
            onClick={() => setMobileView('cart')}
            className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              mobileView === 'cart'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            Cart
            {cart.length > 0 && (
              <span className="bg-primary-600 text-white text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center">
                {cart.reduce((sum, i) => sum + i.quantity, 0)}
              </span>
            )}
          </button>
        </div>

        {/* Left: search + product grid — full height on mobile when active,
            scrolls independently; always visible side-by-side on lg+ */}
        <div
          className={`${mobileView === 'products' ? 'flex' : 'hidden'} flex-1 min-h-0 flex-col border-r border-gray-200 lg:flex lg:col-span-3`}
        >
          <div className="p-4 md:p-6 pb-0 shrink-0">
            <div className="flex items-center gap-2 mb-4">
              <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-0">
                <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input
                  ref={searchInputRef}
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, or scan SKU/barcode..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-[var(--radius-md)] border border-gray-200 text-sm focus-ring"
                />
              </form>
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                title="Scan barcode with camera"
                aria-label="Scan barcode with camera"
                className="focus-ring shrink-0 w-11 h-11 flex items-center justify-center rounded-[var(--radius-md)] border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-primary-600 active:bg-gray-100 transition-colors"
              >
                <Camera size={18} />
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-1 px-1">
              <button
                onClick={() => setActiveCategory('')}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  activeCategory === ''
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-surface text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.slug)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    activeCategory === c.slug
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-surface text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-6">
            {searching && results.length === 0 && <p className="text-sm text-gray-500 py-8 text-center">Loading…</p>}
            {!searching && results.length === 0 && (
              <p className="text-sm text-gray-500 py-8 text-center">No products found.</p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {results.map((v) => (
                <button
                  key={v.variantId}
                  onClick={() => addToCart(v)}
                  disabled={v.stockQuantity < 1}
                  className={`group bg-surface border rounded-[var(--radius-md)] overflow-hidden text-left hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    v.stockQuantity > 0 && v.stockQuantity <= LOW_STOCK_THRESHOLD
                      ? 'border-amber-300 hover:border-amber-400'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <div className="relative aspect-square bg-gray-100">
                    {v.image ? (
                      <img src={v.image} alt={v.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No image</div>
                    )}
                    <span className="absolute top-1.5 right-1.5 bg-white/95 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus size={14} className="text-primary-600" />
                    </span>
                    {v.stockQuantity < 1 && (
                      <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs font-medium text-gray-600">
                        Out of stock
                      </span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-medium text-gray-900 truncate">{v.productName}</p>
                    <p className="text-[11px] text-gray-500 truncate">{v.size} / {v.color}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-semibold text-gray-900">${Number(v.price).toFixed(2)}</span>
                      <span
                        className={`text-[10px] ${
                          v.stockQuantity <= LOW_STOCK_THRESHOLD && v.stockQuantity > 0
                            ? 'text-amber-600 font-medium'
                            : 'text-gray-400'
                        }`}
                      >
                        {v.stockQuantity} left
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: current sale — full height on mobile when active, own
            scroll region; fixed column side-by-side on lg+ */}
        <div
          className={`${mobileView === 'cart' ? 'flex' : 'hidden'} flex-1 min-h-0 flex-col bg-surface lg:flex lg:col-span-2`}
        >
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Current Sale</h2>
              {cart.length > 0 && (
                <div className="flex items-center gap-3">
                  <button onClick={holdCurrentCart} className="text-xs text-gray-500 hover:text-amber-600 flex items-center gap-1">
                    <PauseCircle size={13} /> Hold
                  </button>
                  <button onClick={clearCart} className="text-xs text-gray-400 hover:text-error flex items-center gap-1">
                    <X size={13} /> Clear
                  </button>
                </div>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="py-10 flex flex-col items-center text-gray-300">
                <ShoppingBag size={32} strokeWidth={1.5} />
                <p className="text-sm text-gray-400 mt-2">No items yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 mb-4">
                {cart.map((i) => (
                  <li key={i.variantId} className="py-2.5 flex items-center gap-2.5">
                    {i.image ? (
                      <img src={i.image} alt={i.productName} className="w-10 h-10 rounded-[var(--radius-sm)] object-cover shrink-0 bg-gray-100" />
                    ) : (
                      <div className="w-10 h-10 rounded-[var(--radius-sm)] shrink-0 bg-gray-100" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{i.productName}</p>
                      <p className="text-xs text-gray-500">
                        {i.size} / {i.color} · ${i.price.toFixed(2)}
                        {i.stockQuantity - i.quantity <= LOW_STOCK_THRESHOLD && (
                          <span className="text-amber-600 font-medium"> · {i.stockQuantity - i.quantity} left</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => updateQuantity(i.variantId, -1)}
                        className="w-9 h-9 lg:w-auto lg:h-auto lg:p-1 flex items-center justify-center rounded-full lg:rounded hover:bg-gray-100 active:bg-gray-200 transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-sm">{i.quantity}</span>
                      <button
                        onClick={() => updateQuantity(i.variantId, 1)}
                        className="w-9 h-9 lg:w-auto lg:h-auto lg:p-1 flex items-center justify-center rounded-full lg:rounded hover:bg-gray-100 active:bg-gray-200 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        onClick={() => removeFromCart(i.variantId)}
                        className="w-9 h-9 lg:w-auto lg:h-auto lg:p-1 flex items-center justify-center rounded-full lg:rounded hover:bg-error-light text-error transition-colors ml-0.5"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="py-3 border-t border-gray-100 mb-3 space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 w-16 shrink-0">Discount $</label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-2.5 py-2 lg:py-1.5 rounded-[var(--radius-sm)] border border-gray-200 text-sm focus-ring"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 w-16 shrink-0">Tax %</label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="100"
                  step="0.01"
                  value={taxRateInput}
                  onChange={(e) => setTaxRateInput(e.target.value)}
                  placeholder="0"
                  className="w-full px-2.5 py-2 lg:py-1.5 rounded-[var(--radius-sm)] border border-gray-200 text-sm focus-ring"
                />
              </div>
              {(discountAmount > 0 || taxAmount > 0) && (
                <>
                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-sm text-error">
                      <span>Discount</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {taxAmount > 0 && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Tax ({taxRate}%)</span>
                      <span>${taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-medium text-gray-700">Total</span>
                <span className="text-lg font-semibold text-gray-900">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2 mb-3">
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer name (optional)"
                className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-gray-200 text-sm focus-ring"
              />
              <input
                type="tel"
                inputMode="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Phone (optional)"
                className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-gray-200 text-sm focus-ring"
              />
            </div>
          </div>

          <div className="shrink-0 p-4 md:p-6 pt-3 border-t border-gray-100">
            <button
              onClick={() => setShowCheckoutModal(true)}
              disabled={cart.length === 0}
              className="w-full py-2.5 rounded-[var(--radius-md)] bg-primary-600 text-white text-sm font-medium disabled:opacity-50 hover:bg-primary-700 transition-colors"
            >
              Charge · ${grandTotal.toFixed(2)}
            </button>
          </div>
        </div>
      </div>

      {/* Checkout modal — choose Cash (with amount received / change) or QR */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center sm:p-4 z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-[var(--radius-md)] max-w-sm w-full p-6 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-center -mt-2 mb-1 sm:hidden">
              <span className="w-9 h-1 rounded-full bg-gray-200" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Checkout</h2>
              <button onClick={() => setShowCheckoutModal(false)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
                <X size={18} />
              </button>
            </div>

            <div className="text-center mb-5 py-3 bg-gray-25 rounded-[var(--radius-md)]">
              <p className="text-xs text-gray-500 mb-1">Total Due</p>
              <p className="text-3xl font-semibold text-gray-900">${grandTotal.toFixed(2)}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-[var(--radius-md)] border text-sm font-medium transition-colors ${
                  paymentMethod === 'cash'
                    ? 'bg-primary-50 border-primary-500 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Banknote size={20} strokeWidth={1.75} />
                Cash
              </button>
              <button
                onClick={() => setPaymentMethod('qr')}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-[var(--radius-md)] border text-sm font-medium transition-colors ${
                  paymentMethod === 'qr'
                    ? 'bg-primary-50 border-primary-500 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <QrCode size={20} strokeWidth={1.75} />
                QR Code
              </button>
            </div>

            {paymentMethod === 'cash' && (
              <div className="mb-4">
                <label className="text-xs text-gray-500 mb-1 block">Amount Received</label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  autoFocus
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-gray-200 text-lg font-medium focus-ring"
                />

                <div className="flex gap-1.5 mt-2">
                  {[...new Set([
                    Math.ceil(grandTotal),
                    Math.ceil(grandTotal / 5) * 5,
                    Math.ceil(grandTotal / 10) * 10,
                    Math.ceil(grandTotal / 20) * 20,
                  ])].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setAmountReceived(String(amt))}
                      className="flex-1 min-h-[40px] py-1.5 rounded-[var(--radius-sm)] border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 active:bg-gray-100"
                    >
                      ${amt}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Change</span>
                  <span className={`text-lg font-semibold ${cashInsufficient ? 'text-error' : 'text-gray-900'}`}>
                    ${changeDue.toFixed(2)}
                  </span>
                </div>
                {cashInsufficient && (
                  <p className="text-xs text-error mt-1">Amount received is less than the total due.</p>
                )}
              </div>
            )}

            {paymentMethod === 'qr' && (
              <div className="mb-4 flex flex-col items-center py-4">
                <div className="w-40 h-40 rounded-[var(--radius-md)] border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 mb-3">
                  <QrCode size={56} strokeWidth={1} />
                  <p className="text-[11px] mt-1">Scan to Pay</p>
                </div>
                <p className="text-sm text-gray-600">
                  Amount: <span className="font-semibold text-gray-900">${grandTotal.toFixed(2)}</span>
                </p>
                <p className="text-[11px] text-gray-400 mt-1 text-center">
                  Placeholder QR — connect a real payment gateway (e.g. Bakong KHQR) here later.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="flex-1 min-h-[44px] py-2.5 rounded-[var(--radius-md)] border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckout}
                disabled={checkingOut || cashInsufficient}
                className="flex-1 min-h-[44px] py-2.5 rounded-[var(--radius-md)] bg-primary-600 text-white text-sm font-medium disabled:opacity-50 hover:bg-primary-700 active:bg-primary-800 transition-colors"
              >
                {checkingOut ? 'Processing…' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-sale invoice — 80mm thermal receipt layout, printable via window.print() */}
      {invoice && (
        <>
          <style>{`
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
              }
              body * { visibility: hidden; }
              #pos-invoice, #pos-invoice * { visibility: visible; }
              #pos-invoice {
                position: fixed;
                inset: 0;
                margin: 0;
                width: 80mm;
                font-family: 'Courier New', monospace;
              }
            }
          `}</style>
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 print:bg-white print:p-0 print:static">
            <div
              id="pos-invoice"
              className="bg-white max-w-[302px] w-full p-4 max-h-[90vh] overflow-y-auto font-mono text-[11px] leading-snug text-black print:max-h-none print:shadow-none"
            >
              <div className="text-center mb-3">
                <p className="text-sm font-bold uppercase">Thida Shop</p>
                <p className="text-[10px]">Phnom Penh, Cambodia</p>
                <p className="text-[10px] mt-1">*** SALE RECEIPT ***</p>
              </div>

              <div className="border-t border-dashed border-black my-2" />

              <div className="space-y-0.5">
                <div className="flex justify-between"><span>Order#</span><span>{invoice.orderNumber}</span></div>
                <div className="flex justify-between"><span>Date</span><span>{new Date(invoice.date).toLocaleString()}</span></div>
                {invoice.cashier && <div className="flex justify-between"><span>Cashier</span><span>{invoice.cashier}</span></div>}
                {invoice.customerName && <div className="flex justify-between"><span>Customer</span><span>{invoice.customerName}</span></div>}
                {invoice.customerPhone && <div className="flex justify-between"><span>Phone</span><span>{invoice.customerPhone}</span></div>}
                <div className="flex justify-between"><span>Payment</span><span className="uppercase">{invoice.paymentMethod}</span></div>
              </div>

              <div className="border-t border-dashed border-black my-2" />

              <div>
                {invoice.items.map((i) => (
                  <div key={i.variantId} className="mb-1.5">
                    <div className="flex justify-between">
                      <span className="flex-1 min-w-0 pr-1">{i.productName}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span>{i.size}/{i.color} × {i.quantity} @ ${i.price.toFixed(2)}</span>
                      <span>${(i.price * i.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-black my-2" />

              <div className="space-y-0.5">
                <div className="flex justify-between"><span>Subtotal</span><span>${invoice.subtotal.toFixed(2)}</span></div>
                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between"><span>Discount</span><span>-${invoice.discountAmount.toFixed(2)}</span></div>
                )}
                {invoice.taxAmount > 0 && (
                  <div className="flex justify-between"><span>Tax ({invoice.taxRate}%)</span><span>${invoice.taxAmount.toFixed(2)}</span></div>
                )}
                <div className="border-t border-black my-1" />
                <div className="flex justify-between text-sm font-bold"><span>TOTAL</span><span>${invoice.total.toFixed(2)}</span></div>

                {invoice.paymentMethod === 'cash' && invoice.amountReceived != null && (
                  <>
                    <div className="flex justify-between mt-1"><span>Cash Received</span><span>${invoice.amountReceived.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Change</span><span>${invoice.changeDue.toFixed(2)}</span></div>
                  </>
                )}
              </div>

              <div className="border-t border-dashed border-black my-3" />

              <p className="text-center text-[10px] mb-4">Thank you for shopping with us!</p>

              <div className="flex gap-2 print:hidden">
                <button
                  onClick={() => setInvoice(null)}
                  className="flex-1 min-h-[44px] py-2 rounded-[var(--radius-md)] border border-gray-200 text-xs font-sans font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                >
                  New Sale
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 min-h-[44px] py-2 rounded-[var(--radius-md)] bg-primary-600 text-white text-xs font-sans font-medium hover:bg-primary-700 active:bg-primary-800"
                >
                  Print
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Camera barcode scan — full-screen live viewfinder, an alternative
          to a physical USB/Bluetooth scanner on phones/tablets. */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex flex-col">
          <div className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top)] py-3 shrink-0">
            <p className="text-sm font-medium text-white">Scan barcode</p>
            <button
              onClick={() => setShowScanner(false)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 active:bg-white/25 transition-colors"
              aria-label="Close scanner"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center px-4 min-h-0">
            <div id="pos-camera-scanner" className="w-full max-w-sm rounded-[var(--radius-md)] overflow-hidden" />
          </div>

          <div className="px-6 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-2 text-center shrink-0">
            {scannerError ? (
              <p className="text-sm text-red-400">{scannerError}</p>
            ) : (
              <p className="text-xs text-white/60">Point the camera at a barcode or QR code</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}