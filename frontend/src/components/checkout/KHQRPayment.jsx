// src/components/checkout/KHQRPayment.jsx
// Shown on an order that was placed with paymentMethod = 'qr'. Generates
// (or resumes) a KHQR code for the order's total. Payment status is
// checked only when the customer presses "I've paid — check now" — no
// background polling — since Bakong Open API has a daily request quota
// (sandbox/trial tokens are commonly capped around 100/day) and
// auto-polling burns through that fast. If you're on a trial token, ask
// NBC/your partner bank for a production token before going live either
// way. Used on both OrderSuccess (right after checkout) and OrderDetail
// (if the customer navigates away and comes back to a still-pending order).
import { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle2, RefreshCw, Loader2 } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';

export default function KHQRPayment({ orderId, onPaid }) {
  const { token } = useAuth();
  const [qrImage, setQrImage] = useState(null);
  const [md5, setMd5] = useState(null);
  const [status, setStatus] = useState('LOADING'); // LOADING | PENDING | PAID | EXPIRED | ERROR
  const [errorMessage, setErrorMessage] = useState('');
  const [checkError, setCheckError] = useState(''); // inline, non-fatal — shown next to the button
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [checkingNow, setCheckingNow] = useState(false);
  const timerRef = useRef(null);

  const generateQR = useCallback(async () => {
    setStatus('LOADING');
    setErrorMessage('');
    setCheckError('');
    try {
      const data = await apiClient.post(`/orders/${orderId}/khqr/generate`, {}, { token });
      setQrImage(data.qrImage);
      setMd5(data.md5);
      setStatus('PENDING');
      const remaining = Math.floor((new Date(data.expiresAt) - Date.now()) / 1000);
      setSecondsLeft(Math.max(remaining, 0));
    } catch (err) {
      setErrorMessage(err.message);
      setStatus('ERROR');
    }
  }, [orderId, token]);

  useEffect(() => {
    generateQR();
    return () => clearInterval(timerRef.current);
  }, [generateQR]);

  const handleCheckNow = async () => {
    if (!md5) return;
    setCheckingNow(true);
    setCheckError('');
    try {
      const data = await apiClient.get(`/orders/${orderId}/khqr/status`, { token });
      if (data.status === 'PAID') {
        clearInterval(timerRef.current);
        setStatus('PAID');
        onPaid?.();
      } else if (data.status === 'EXPIRED') {
        clearInterval(timerRef.current);
        setStatus('EXPIRED');
      } else {
        setCheckError("Not detected yet — if you've paid, wait a few seconds and try again.");
      }
    } catch (err) {
      setCheckError(err.message || 'Could not verify payment status.');
    } finally {
      setCheckingNow(false);
    }
  };

  useEffect(() => {
    if (status !== 'PENDING') return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setStatus('EXPIRED');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [status]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="flex flex-col items-center gap-3 border border-gray-200 rounded-[var(--radius-lg)] p-5 bg-surface">
      {status === 'LOADING' && (
        <p className="text-sm text-gray-500 py-8">Generating KHQR code…</p>
      )}

      {status === 'PENDING' && qrImage && (
        <>
          <img src={qrImage} alt="KHQR payment code" className="w-56 h-56 object-contain" />
          <p className="text-xs text-gray-500 text-center">
            Scan with the Bakong app or your bank's app to pay
          </p>
          <p className="font-mono text-base text-gray-900">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-primary-600">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-pulse" />
            Waiting for payment…
          </div>
          <button
            onClick={handleCheckNow}
            disabled={checkingNow}
            className="focus-ring press-scale flex items-center gap-1.5 px-3 py-1.5 mt-1 border border-primary-200 text-primary-700 text-xs font-medium rounded-[var(--radius-md)] disabled:opacity-60"
          >
            {checkingNow ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <RefreshCw size={12} />
            )}
            I've paid — check now
          </button>
          {checkError && (
            <p className="text-[11px] text-gray-500 text-center max-w-[220px]">{checkError}</p>
          )}
        </>
      )}

      {status === 'PAID' && (
        <div className="flex flex-col items-center gap-2 py-6">
          <CheckCircle2 size={40} className="text-success" strokeWidth={1.5} />
          <p className="text-sm font-medium text-gray-900">Payment received</p>
        </div>
      )}

      {status === 'EXPIRED' && (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <p className="text-sm text-error">This KHQR code has expired.</p>
          <button
            onClick={generateQR}
            className="focus-ring press-scale flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-[var(--radius-md)]"
          >
            <RefreshCw size={14} /> Generate new code
          </button>
        </div>
      )}

      {status === 'ERROR' && (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <p className="text-sm text-error">{errorMessage || 'Could not load the KHQR code.'}</p>
          <button
            onClick={generateQR}
            className="focus-ring press-scale flex items-center gap-1.5 px-4 py-2 bg-surface border border-gray-300 text-sm font-medium text-gray-700 rounded-[var(--radius-md)]"
          >
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      )}
    </div>
  );
}