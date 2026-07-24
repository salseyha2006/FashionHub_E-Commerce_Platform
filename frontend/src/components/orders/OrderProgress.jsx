// src/components/orders/OrderProgress.jsx — REDESIGNED (plain labels, error-light cancelled banner)
const STEPS = [
  { key: 'pending', label: 'Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
];

export default function OrderProgress({ status }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 text-sm text-error bg-error-light px-3 py-2.5 rounded-[var(--radius-md)]">
        <span className="h-2 w-2 rounded-full bg-error" />
        This order was cancelled
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => (
        <div key={step.key} className="flex items-center flex-1 last:flex-initial">
          <div className="flex flex-col items-center gap-1.5">
            <span
              className={`h-2.5 w-2.5 rounded-full transition-colors duration-150 ${
                i <= currentIndex ? 'bg-primary-500' : 'bg-gray-200'
              }`}
            />
            <span
              className={`text-[10px] font-medium whitespace-nowrap ${
                i <= currentIndex ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-px mx-1.5 mb-4 transition-colors duration-150 ${i < currentIndex ? 'bg-primary-500' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}