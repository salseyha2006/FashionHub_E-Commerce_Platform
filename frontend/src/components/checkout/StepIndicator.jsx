// src/components/checkout/StepIndicator.jsx — REDESIGNED (active dot uses pink primary, not solid gray-900)
const STEPS = ['Review', 'Address', 'Payment', 'Confirm'];

export default function StepIndicator({ current }) {
  return (
    <div className="flex items-center mb-6">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const isDone = step < current;
        const isActive = step === current;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-medium transition-colors duration-150 ${
                  isActive ? 'bg-primary-500 text-white' : isDone ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step}
              </span>
              <span className={`text-[10px] font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-1.5 mb-4 transition-colors duration-150 ${isDone ? 'bg-primary-500' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}