// src/components/checkout/ShippingForm.jsx — REDESIGNED (rounded inputs w/ focus-glow, pink primary Next button)
import { useState } from 'react';

export default function ShippingForm({ data, onNext, onBack }) {
  const [form, setForm] = useState(data);
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function validate() {
    const next = {};
    if (!form.fullName.trim()) next.fullName = 'Full name is required';
    if (!form.phone.trim()) next.phone = 'Phone number is required';
    if (!form.address.trim()) next.address = 'Address is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (validate()) onNext(form);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} error={errors.fullName} />
      <Field label="Phone Number" name="phone" type="tel" value={form.phone} onChange={handleChange} error={errors.phone} />
      <Field
        label="Address"
        name="address"
        value={form.address}
        onChange={handleChange}
        error={errors.address}
        as="textarea"
      />

      <div className="flex gap-3 mt-2">
        <button
          type="button"
          onClick={onBack}
          className="focus-ring press-scale flex-1 py-3 bg-surface border border-gray-300 text-sm font-medium text-gray-700 rounded-[var(--radius-md)] hover:bg-gray-50 transition-colors duration-150"
        >
          Back
        </button>
        <button
          type="submit"
          className="focus-ring press-scale flex-1 py-3 bg-primary-500 text-white text-sm font-medium rounded-[var(--radius-md)] shadow-xs hover:bg-primary-600 transition-colors duration-150"
        >
          Next
        </button>
      </div>
    </form>
  );
}

function Field({ label, name, error, as, ...props }) {
  const Tag = as || 'input';
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      <Tag
        id={name}
        name={name}
        rows={as === 'textarea' ? 3 : undefined}
        {...props}
        className={`focus-ring border rounded-[var(--radius-sm)] px-3.5 py-2.5 text-sm text-gray-900 bg-surface transition-colors duration-150 ${
          error ? 'border-error focus:border-error' : 'border-gray-300 focus:border-primary-500'
        }`}
      />
      {error && <span className="text-xs text-error">{error}</span>}
    </label>
  );
}