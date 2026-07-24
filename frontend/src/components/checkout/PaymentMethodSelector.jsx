import { useEffect, useState } from 'react';
import { useSettings } from '../../hooks/useSettings';

export default function PaymentMethodSelector({ value, onNext, onBack }) {
  const { settings } = useSettings();
  const codEnabled = settings?.codEnabled !== false;
  const bankTransferEnabled = settings?.bankTransferEnabled !== false;

  const [method, setMethod] = useState(value || (codEnabled ? 'cod' : 'bank_transfer'));

  // If the selected method becomes unavailable once settings load, switch to the other one
  useEffect(() => {
    if (method === 'cod' && !codEnabled && bankTransferEnabled) setMethod('bank_transfer');
    if (method === 'bank_transfer' && !bankTransferEnabled && codEnabled) setMethod('cod');
  }, [codEnabled, bankTransferEnabled, method]);

  return (
    <div className="flex flex-col gap-4">
      {codEnabled && (
        <PaymentOption
          selected={method === 'cod'}
          onClick={() => setMethod('cod')}
          label="Cash on Delivery"
          description="Pay when your order arrives"
        />
      )}
      {bankTransferEnabled && (
        <PaymentOption
          selected={method === 'bank_transfer'}
          onClick={() => setMethod('bank_transfer')}
          label="Bank Transfer"
          description="Transfer before delivery"
        />
      )}

      {bankTransferEnabled && method === 'bank_transfer' && (
        <div className="border border-gray-200 rounded-[var(--radius-lg)] p-4 text-sm text-gray-900 bg-gray-50">
          <p>Bank: {settings?.bankName || '—'}</p>
          <p>Account: {settings?.bankAccountNumber || '—'}</p>
          <p>Name: {settings?.bankAccountName || '—'}</p>
          {settings?.bankQrImageUrl && (
            <img
              src={settings.bankQrImageUrl}
              alt="Bank QR code"
              className="mt-3 w-32 h-32 object-contain rounded-[var(--radius-md)] border border-gray-200 bg-surface"
            />
          )}
        </div>
      )}

      <div className="flex gap-3 mt-2">
        <button onClick={onBack} className="focus-ring press-scale flex-1 py-3 bg-surface border border-gray-300 text-sm font-medium text-gray-700 rounded-[var(--radius-md)] hover:bg-gray-50 transition-colors duration-150">
          Back
        </button>
        <button onClick={() => onNext(method)} className="focus-ring press-scale flex-1 py-3 bg-primary-500 text-white text-sm font-medium rounded-[var(--radius-md)] shadow-xs hover:bg-primary-600 transition-colors duration-150">
          Next
        </button>
      </div>
    </div>
  );
}

function PaymentOption({ selected, onClick, label, description }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`focus-ring flex items-start gap-3 p-4 border rounded-[var(--radius-lg)] text-left transition-colors duration-150 ${
        selected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'
      }`}
    >
      <span className={`mt-0.5 h-4 w-4 rounded-full border shrink-0 flex items-center justify-center transition-colors duration-150 ${selected ? 'border-primary-500' : 'border-gray-400'}`}>
        {selected && <span className="h-2 w-2 rounded-full bg-primary-500" />}
      </span>
      <span>
        <span className="block text-sm font-medium text-gray-900">{label}</span>
        <span className="block text-xs text-gray-500 mt-0.5">{description}</span>
      </span>
    </button>
  );
}