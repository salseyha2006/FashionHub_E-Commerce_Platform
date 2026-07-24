// src/pages/Checkout.jsx — REDESIGNED (pink primary CTAs, gray secondary buttons, radius/shadow tokens on cards, plain non-uppercase headings)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiClient } from '../lib/apiClient';
import StepIndicator from '../components/checkout/StepIndicator';
import ShippingForm from '../components/checkout/ShippingForm';
import PaymentMethodSelector from '../components/checkout/PaymentMethodSelector';

export default function Checkout() {
  const { items, subtotal, refetch } = useCart();
  const { token, isAuthenticated, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [shipping, setShipping] = useState({ fullName: '', phone: '', address: '' });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false); // guards against the empty-cart redirect firing after a successful order
  const [stockError, setStockError] = useState(null);

  // Must be logged in to check out (orders require a user). Wait for AuthContext
  // to finish restoring the session before deciding, so a refresh doesn't
  // bounce a logged-in user to /login for one frame.
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      showToast('Please log in to check out.', 'error');
      navigate('/login', { state: { from: '/checkout' }, replace: true });
    }
  }, [authLoading, isAuthenticated, navigate, showToast]);

  // Side effects (navigation) belong in useEffect, not in the render body.
  // `placed` prevents this from firing during the moment the cart is cleared
  // right after a successful order, before we've navigated to /order-success.
  useEffect(() => {
    if (isAuthenticated && items.length === 0 && !placing && !placed) {
      navigate('/cart', { replace: true });
    }
  }, [isAuthenticated, items.length, placing, placed, navigate]);

  async function handleConfirm() {
    setPlacing(true);
    setStockError(null);
    try {
      const order = await apiClient.post(
        '/orders',
        { shippingAddress: shipping.address, phone: shipping.phone, paymentMethod },
        { token }
      );
      setPlaced(true);
      await refetch();
      navigate('/order-success', { state: { order }, replace: true });
    } catch (err) {
      if (err.status === 400) {
        setStockError(err.message);
      } else {
        showToast(err.message, 'error');
      }
    } finally {
      setPlacing(false);
    }
  }

  // Render nothing while auth/cart checks above decide whether to redirect —
  // avoids a flash of an unusable checkout page.
  if (authLoading || !isAuthenticated) return null;
  if (items.length === 0 && !placing && !placed) return null;

  return (
    <div className="px-4 md:px-8 py-6 max-w-lg mx-auto">
      <StepIndicator current={step} />

      {stockError && (
        <div className="flex items-start gap-2.5 border border-error/20 bg-error-light rounded-[var(--radius-lg)] p-4 mb-4">
          <AlertCircle size={18} className="text-error shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-gray-900">{stockError}</p>
            <button onClick={() => navigate('/cart')} className="focus-ring text-xs text-error font-medium underline underline-offset-2 mt-1">
              Return to cart
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <ReviewStep items={items} subtotal={subtotal} onNext={() => setStep(2)} />
      )}

      {step === 2 && (
        <ShippingForm data={shipping} onNext={(data) => { setShipping(data); setStep(3); }} onBack={() => setStep(1)} />
      )}

      {step === 3 && (
        <PaymentMethodSelector
          value={paymentMethod}
          onNext={(method) => { setPaymentMethod(method); setStep(4); }}
          onBack={() => setStep(2)}
        />
      )}

      {step === 4 && (
        <ConfirmStep
          shipping={shipping}
          paymentMethod={paymentMethod}
          items={items}
          subtotal={subtotal}
          placing={placing}
          onBack={() => setStep(3)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}

function ReviewStep({ items, subtotal, onNext }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-semibold text-gray-900">Review order</h2>
      <div className="divide-y divide-gray-200 border-y border-gray-200">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between py-3 text-sm">
            <div>
              <p className="text-gray-900">{item.variant.product.name}</p>
              <p className="text-xs text-gray-500">
                {item.variant.size}, {item.variant.color} × {item.quantity}
              </p>
            </div>
            <span className="text-gray-900">${(Number(item.variant.product.price) * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-base font-medium">
        <span className="text-gray-900">Subtotal</span>
        <span className="text-gray-900">${subtotal.toFixed(2)}</span>
      </div>
      <button
        onClick={onNext}
        className="focus-ring press-scale py-3 bg-primary-500 text-white text-sm font-medium rounded-[var(--radius-md)] shadow-xs hover:bg-primary-600 transition-colors duration-150"
      >
        Next
      </button>
    </div>
  );
}

function ConfirmStep({ shipping, paymentMethod, items, subtotal, placing, onBack, onConfirm }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-semibold text-gray-900">Confirm order</h2>

      <div className="bg-surface border border-gray-200 rounded-[var(--radius-lg)] shadow-xs p-4 text-sm flex flex-col gap-2">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Delivery to</p>
          <p className="text-gray-900">{shipping.fullName}, {shipping.phone}</p>
          <p className="text-gray-900">{shipping.address}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Payment</p>
          <p className="text-gray-900">{paymentMethod === 'cod' ? 'Cash on Delivery' : 'Bank Transfer'}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Items</p>
          <p className="text-gray-900">{items.reduce((s, i) => s + i.quantity, 0)}</p>
        </div>
        <div className="pt-2 border-t border-gray-200 flex justify-between font-medium">
          <span className="text-gray-900">Total</span>
          <span className="text-gray-900">${subtotal.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={placing}
          className="focus-ring press-scale flex-1 py-3 bg-surface border border-gray-300 text-sm font-medium text-gray-700 rounded-[var(--radius-md)] hover:bg-gray-50 transition-colors duration-150 disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={onConfirm}
          disabled={placing}
          className="focus-ring press-scale flex-1 py-3 bg-primary-500 text-white text-sm font-medium rounded-[var(--radius-md)] shadow-xs hover:bg-primary-600 transition-colors duration-150 disabled:opacity-50"
        >
          {placing ? 'Placing…' : 'Confirm order'}
        </button>
      </div>
    </div>
  );
}