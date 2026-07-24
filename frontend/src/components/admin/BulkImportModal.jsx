// src/components/admin/BulkImportModal.jsx
// 3-step "Import from Excel" flow for AdminProducts: download template ->
// parse & preview client-side (SheetJS) -> confirm import against
// POST /products/bulk-import. Matches the surface/gray/primary-500 design
// tokens used across the other Admin* pages.
import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { X, Download, Upload, CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const TEMPLATE_HEADERS = ['name', 'category', 'description', 'price', 'images', 'variants'];
const TEMPLATE_EXAMPLE_ROW = [
  'Classic Tee',
  'T-Shirts',
  'Soft cotton crew neck',
  12.00,
  'https://a.jpg|https://b.jpg',
  'S:Black:10;M:Black:5;S:White:8',
];

const STEP_LABELS = ['Template', 'Preview', 'Done'];

function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, TEMPLATE_EXAMPLE_ROW]);
  ws['!cols'] = [{ wch: 22 }, { wch: 16 }, { wch: 28 }, { wch: 10 }, { wch: 36 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Products');
  XLSX.writeFile(wb, 'fashionhub-product-import-template.xlsx');
}

function downloadCsv(filename, rows) {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = ['row,reason', ...rows.map((r) => `${escape(r.row)},${escape(r.reason)}`)].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Parses one normalized (lowercase-keyed) sheet row into our internal shape,
// running all the same-shape checks the backend will re-run (never trust
// the client, but doing it here gives the admin instant, specific feedback).
function parseRow(map, rowNumber, categories) {
  const name = (map.name ?? '').toString().trim();
  const categoryName = (map.category ?? '').toString().trim();
  const description = (map.description ?? '').toString().trim();
  const priceRaw = map.price;
  const imagesRaw = (map.images ?? '').toString().trim();
  const variantsRaw = (map.variants ?? '').toString().trim();

  const blocking = [];

  if (!name) blocking.push('Missing name');

  if (!categoryName) blocking.push('Missing category');

  let priceNum = null;
  if (priceRaw === '' || priceRaw === undefined || priceRaw === null) {
    blocking.push('Missing price');
  } else {
    priceNum = Number(priceRaw);
    if (Number.isNaN(priceNum) || priceNum < 0) blocking.push(`Unparsable price: "${priceRaw}"`);
  }

  const images = imagesRaw ? imagesRaw.split('|').map((s) => s.trim()).filter(Boolean) : [];

  let variants = [];
  if (!variantsRaw) {
    blocking.push('Missing variants');
  } else {
    const seen = new Set();
    let variantError = null;
    for (const part of variantsRaw.split(';').map((s) => s.trim()).filter(Boolean)) {
      const bits = part.split(':').map((s) => s.trim());
      if (bits.length !== 3 || !bits[0] || !bits[1] || bits[2] === '') {
        variantError = `Malformed variant "${part}" (expected size:color:stock)`;
        break;
      }
      const stock = Number(bits[2]);
      if (!Number.isInteger(stock) || stock < 0) {
        variantError = `Invalid stock quantity in variant "${part}"`;
        break;
      }
      const key = `${bits[0]}::${bits[1]}`.toLowerCase();
      if (seen.has(key)) {
        variantError = `Duplicate size+color in variants: ${bits[0]}:${bits[1]}`;
        break;
      }
      seen.add(key);
      variants.push({ size: bits[0], color: bits[1], stockQuantity: stock });
    }
    if (variantError) blocking.push(variantError);
    else if (variants.length === 0) blocking.push('At least one variant is required');
  }

  const matchedCategory = categoryName
    ? categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase())
    : null;

  let status = 'valid';
  let reasons = [];
  if (blocking.length > 0) {
    status = 'error';
    reasons = blocking;
  } else if (!matchedCategory) {
    status = 'warning';
    reasons = [`Category "${categoryName}" not found`];
  }

  return {
    rowNumber,
    name,
    categoryName,
    description,
    priceNum,
    images,
    variants,
    matchedCategory: !!matchedCategory,
    status,
    reasons,
  };
}

const STATUS_ICON = {
  valid: <CheckCircle2 size={16} className="text-success shrink-0" />,
  warning: <AlertTriangle size={16} className="text-warning shrink-0" />,
  error: <XCircle size={16} className="text-error shrink-0" />,
};

export default function BulkImportModal({ open, onClose, categories, onImported }) {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [rows, setRows] = useState([]);
  const [autoCreateCategories, setAutoCreateCategories] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null); // { created, skipped: [{row, reason}] }

  const counts = useMemo(() => {
    const valid = rows.filter((r) => r.status === 'valid').length;
    const warning = rows.filter((r) => r.status === 'warning').length;
    const error = rows.filter((r) => r.status === 'error').length;
    return { valid, warning, error, total: rows.length };
  }, [rows]);

  const includedRows = useMemo(
    () => rows.filter((r) => r.status === 'valid' || (r.status === 'warning' && autoCreateCategories)),
    [rows, autoCreateCategories]
  );
  const excludedRows = useMemo(
    () => rows.filter((r) => !(r.status === 'valid' || (r.status === 'warning' && autoCreateCategories))),
    [rows, autoCreateCategories]
  );

  function reset() {
    setStep(1);
    setFileName('');
    setParsing(false);
    setParseError('');
    setRows([]);
    setAutoCreateCategories(false);
    setImporting(false);
    setResult(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;

    setFileName(file.name);
    setParseError('');
    setParsing(true);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      const parsed = raw
        .map((obj, i) => {
          const map = {};
          for (const k of Object.keys(obj)) map[k.trim().toLowerCase()] = obj[k];
          return { map, rowNumber: i + 2 }; // header is row 1
        })
        .filter(({ map }) => Object.values(map).some((v) => String(v).trim() !== ''))
        .map(({ map, rowNumber }) => parseRow(map, rowNumber, categories));

      if (parsed.length === 0) {
        setParseError('No data rows found in this file.');
        setRows([]);
      } else {
        setRows(parsed);
        setStep(2);
      }
    } catch (err) {
      console.error('Template parse error:', err);
      setParseError('Could not read this file. Make sure it is a valid .xlsx file.');
    } finally {
      setParsing(false);
    }
  }

  async function handleConfirmImport() {
    if (includedRows.length === 0) return;
    setImporting(true);
    try {
      const payload = includedRows.map((r) => ({
        _row: r.rowNumber,
        name: r.name,
        category: r.categoryName,
        description: r.description || undefined,
        price: r.priceNum,
        images: r.images,
        variants: r.variants,
      }));

      const data = await apiClient.post(
        '/products/bulk-import',
        { rows: payload, autoCreateCategories },
        { token }
      );

      const combinedSkipped = [
        ...excludedRows.map((r) => ({ row: r.rowNumber, reason: r.reasons.join('; ') })),
        ...(data.skipped || []),
      ].sort((a, b) => (Number(a.row) || 0) - (Number(b.row) || 0));

      setResult({ created: data.created, skipped: combinedSkipped });
      setStep(3);
      if (data.created > 0) onImported?.();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setImporting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px]"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Import products from Excel"
        className="relative bg-surface border border-gray-200 rounded-[var(--radius-lg)] shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-5 h-14 border-b border-gray-200 shrink-0">
          <span className="text-sm font-semibold text-gray-900">Import products from Excel</span>
          <button
            onClick={handleClose}
            className="focus-ring press-scale p-1.5 -mr-1.5 rounded-[var(--radius-sm)] text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2 px-5 pt-4 shrink-0">
          {STEP_LABELS.map((label, i) => {
            const s = i + 1;
            const active = s === step;
            const done = s < step;
            return (
              <div key={label} className="flex items-center gap-2">
                <span
                  className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-medium ${
                    active ? 'bg-primary-500 text-white' : done ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {s}
                </span>
                <span className={`text-xs font-medium ${active ? 'text-gray-900' : 'text-gray-500'}`}>{label}</span>
                {i < STEP_LABELS.length - 1 && <div className="w-6 h-px bg-gray-200 mx-1" />}
              </div>
            );
          })}
        </div>

        <div className="overflow-y-auto px-5 py-4 flex-1">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-700 mb-2">
                  Download the template, fill in one row per product, then upload it below.
                </p>
                <button
                  onClick={downloadTemplate}
                  className="focus-ring press-scale inline-flex items-center gap-2 px-3.5 py-2 border border-gray-300 rounded-[var(--radius-sm)] text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                >
                  <Download size={15} /> Download template (.xlsx)
                </button>
              </div>

              <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-[var(--radius-sm)] px-3 py-2.5 space-y-1">
                <p><span className="font-medium text-gray-700">name, category, price, variants</span> are required.</p>
                <p><span className="font-medium text-gray-700">images</span>: pipe-separated URLs, e.g. <code>https://a.jpg|https://b.jpg</code></p>
                <p><span className="font-medium text-gray-700">variants</span>: semicolon-separated <code>size:color:stock</code> triples, e.g. <code>S:Black:10;M:Black:5</code></p>
              </div>

              <label className="focus-ring flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-[var(--radius-md)] px-4 py-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors duration-150">
                <Upload size={20} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  {parsing ? 'Parsing…' : fileName || 'Click to upload your filled-in .xlsx file'}
                </span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={parsing}
                />
              </label>

              {parseError && <p className="text-xs text-error">{parseError}</p>}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5 text-gray-700">
                  <CheckCircle2 size={14} className="text-success" /> {counts.valid} ready
                </span>
                <span className="inline-flex items-center gap-1.5 text-gray-700">
                  <AlertTriangle size={14} className="text-warning" /> {counts.warning} warning
                </span>
                <span className="inline-flex items-center gap-1.5 text-gray-700">
                  <XCircle size={14} className="text-error" /> {counts.error} will be skipped
                </span>
              </div>

              <div className="border border-gray-200 rounded-[var(--radius-md)] overflow-hidden overflow-x-auto max-h-72">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr className="text-left uppercase tracking-wider text-gray-500">
                      <th className="px-3 py-2 font-medium">Row</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Name</th>
                      <th className="px-3 py-2 font-medium">Category</th>
                      <th className="px-3 py-2 font-medium">Price</th>
                      <th className="px-3 py-2 font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.rowNumber} className="border-t border-gray-200">
                        <td className="px-3 py-2 text-gray-500">{r.rowNumber}</td>
                        <td className="px-3 py-2">{STATUS_ICON[r.status]}</td>
                        <td className="px-3 py-2 text-gray-900">{r.name || '—'}</td>
                        <td className="px-3 py-2 text-gray-700">{r.categoryName || '—'}</td>
                        <td className="px-3 py-2 text-gray-700">
                          {r.priceNum !== null && !Number.isNaN(r.priceNum) ? `$${r.priceNum.toFixed(2)}` : '—'}
                        </td>
                        <td className="px-3 py-2 text-gray-500">
                          {r.status === 'valid' ? '—' : r.reasons.join('; ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <label className="flex items-start gap-2.5 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={autoCreateCategories}
                  onChange={(e) => setAutoCreateCategories(e.target.checked)}
                  className="focus-ring h-4 w-4 mt-0.5 accent-primary-500"
                />
                <span>
                  Auto-create categories that don't exist yet
                  <span className="block text-xs text-gray-500">
                    Off by default — rows with an unrecognized category are skipped until you turn this on, so a typo doesn't silently create a junk category.
                  </span>
                </span>
              </label>

              <p className="text-xs text-gray-500">
                {includedRows.length} of {counts.total} row{counts.total === 1 ? '' : 's'} will be imported.
              </p>
            </div>
          )}

          {step === 3 && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 text-sm text-gray-900">
                <CheckCircle2 size={18} className="text-success shrink-0" />
                {result.created} product{result.created === 1 ? '' : 's'} imported successfully.
              </div>

              {result.skipped.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-700">{result.skipped.length} row{result.skipped.length === 1 ? '' : 's'} skipped.</p>
                    <button
                      onClick={() => downloadCsv('bulk-import-errors.csv', result.skipped)}
                      className="focus-ring press-scale inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700"
                    >
                      <Download size={13} /> Download error report (.csv)
                    </button>
                  </div>
                  <div className="border border-gray-200 rounded-[var(--radius-md)] overflow-hidden overflow-x-auto max-h-56">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr className="text-left uppercase tracking-wider text-gray-500">
                          <th className="px-3 py-2 font-medium">Row</th>
                          <th className="px-3 py-2 font-medium">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.skipped.map((s, i) => (
                          <tr key={i} className="border-t border-gray-200">
                            <td className="px-3 py-2 text-gray-500">{s.row}</td>
                            <td className="px-3 py-2 text-gray-700">{s.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-200 shrink-0 flex items-center justify-end gap-3">
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              disabled={importing}
              className="focus-ring press-scale px-3.5 py-2 rounded-[var(--radius-sm)] text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-150 disabled:opacity-40"
            >
              Back
            </button>
          )}
          {step === 2 && (
            <button
              onClick={handleConfirmImport}
              disabled={importing || includedRows.length === 0}
              className="focus-ring press-scale inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white text-sm font-medium rounded-[var(--radius-md)] shadow-xs hover:bg-primary-600 transition-colors duration-150 disabled:opacity-50"
            >
              {importing && <Loader2 size={15} className="animate-spin" />}
              Import {includedRows.length} product{includedRows.length === 1 ? '' : 's'}
            </button>
          )}
          {step === 3 && (
            <button
              onClick={handleClose}
              className="focus-ring press-scale px-4 py-2.5 bg-primary-500 text-white text-sm font-medium rounded-[var(--radius-md)] shadow-xs hover:bg-primary-600 transition-colors duration-150"
            >
              Done
            </button>
          )}
          {step === 1 && (
            <button
              onClick={handleClose}
              className="focus-ring press-scale px-3.5 py-2 rounded-[var(--radius-sm)] text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-150"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
