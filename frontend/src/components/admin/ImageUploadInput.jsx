// src/components/admin/ImageUploadInput.jsx — NEW
// Reusable single-image field: shows a thumbnail once a URL is set, lets the
// admin either upload a file from their device (goes to Cloudinary via the
// backend) or paste/edit a URL directly. Used anywhere a single image URL is
// stored (store logo, favicon, bank QR, OG image, banner image) so this
// logic isn't duplicated across every settings section.
import { useState } from 'react';
import { Upload, Loader2, X } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const inputClass = 'focus-ring w-full border border-gray-300 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm text-gray-900 bg-surface focus:border-primary-500 transition-colors duration-150';

export default function ImageUploadInput({ value, onChange, previewClassName }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [editingUrl, setEditingUrl] = useState(false);

  async function handleFileUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    try {
      const { urls } = await apiClient.uploadImages(files, { token });
      if (urls[0]) onChange(urls[0]);
      showToast('Image uploaded.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <label className="focus-ring press-scale flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors duration-150 cursor-pointer">
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {uploading ? 'Uploading…' : 'Upload from device'}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
        <button
          type="button"
          onClick={() => setEditingUrl((prev) => !prev)}
          className="focus-ring press-scale text-xs font-medium text-gray-500 hover:text-primary-600 transition-colors duration-150"
        >
          {editingUrl ? 'Hide URL field' : value ? 'Edit link' : 'Paste link instead'}
        </button>
      </div>

      {editingUrl && (
        <input
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className={inputClass}
        />
      )}

      {value && (
        <div className="relative w-fit">
          <img
            src={value}
            alt="Preview"
            className={previewClassName || 'h-16 rounded-[var(--radius-sm)] border border-gray-200 bg-gray-100 object-contain'}
            onError={(e) => { e.target.style.opacity = 0.15; }}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-1.5 -right-1.5 p-0.5 bg-white text-gray-500 hover:text-error border border-gray-200 rounded-full shadow-xs"
            aria-label="Remove image"
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
}