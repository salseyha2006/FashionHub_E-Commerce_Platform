// src/pages/admin/AdminSettings.jsx
import { useEffect, useState } from 'react';
import {
  Store, Percent, Wallet, User, KeyRound, ChevronLeft, ChevronRight, Palette,
  Tags, LayoutGrid, Plus, X, ChevronUp, ChevronDown, Eye, EyeOff, Users, Shield,
  Search, Bell, Globe, Download, Upload, History,
  FolderTree, Image, Pencil, Trash2, ArrowUp, ArrowDown, Check,
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { generateColorScale } from '../../utils/theme';

const inputClass = 'focus-ring w-full border border-gray-300 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm text-gray-900 bg-surface focus:border-primary-500 transition-colors duration-150';

// Grouped like Facebook's Settings & privacy list — section header + tappable rows
const SECTIONS = [
  {
    heading: 'Store',
    subheading: 'Manage how your store looks and operates.',
    items: [
      { id: 'store', label: 'Store info', icon: Store, permission: 'manage_settings' },
      { id: 'branding', label: 'Branding & theme', icon: Palette, permission: 'manage_settings' },
      { id: 'categories', label: 'Categories', icon: FolderTree, permission: 'manage_categories' },
      { id: 'presets', label: 'Product presets', icon: Tags, permission: 'manage_settings' },
      { id: 'layout', label: 'Homepage layout', icon: LayoutGrid, permission: 'manage_settings' },
      { id: 'banners', label: 'Banners', icon: Image, permission: 'manage_banners' },
      { id: 'tax', label: 'Tax & shipping', icon: Percent, permission: 'manage_settings' },
      { id: 'payment', label: 'Payment methods', icon: Wallet, permission: 'manage_settings' },
      { id: 'seo', label: 'SEO', icon: Search, permission: 'manage_settings' },
      { id: 'notifications', label: 'Notifications', icon: Bell, permission: 'manage_settings' },
      { id: 'system', label: 'System & data', icon: Globe, permission: 'manage_settings' },
    ],
  },
  {
    heading: 'Account',
    subheading: 'Manage your own admin login.',
    items: [
      { id: 'account', label: 'My account', icon: User },
      { id: 'password', label: 'Password', icon: KeyRound },
    ],
  },
];

const TEAM_SECTION = {
  heading: 'Team',
  subheading: 'Invite staff and control exactly what they can access. Owner-only.',
  items: [
    { id: 'team', label: 'Team & roles', icon: Users },
    { id: 'audit', label: 'Audit log', icon: History },
  ],
};

const PERMISSION_LABELS = {
  manage_products: 'Manage products',
  manage_categories: 'Manage categories',
  manage_orders: 'Manage orders',
  manage_banners: 'Manage banners',
  manage_settings: 'Manage settings (this page)',
  view_dashboard: 'View dashboard',
  use_pos: 'Use POS',
};

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      {children}
    </label>
  );
}

function SaveButton({ saving, children = 'Save changes' }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="focus-ring press-scale self-start px-5 py-2.5 bg-primary-500 text-white text-sm font-medium rounded-[var(--radius-md)] shadow-xs hover:bg-primary-600 transition-colors duration-150 disabled:opacity-40"
    >
      {saving ? 'Saving…' : children}
    </button>
  );
}

function FormSkeleton() {
  return (
    <div className="max-w-2xl">
      <div className="h-6 w-48 rounded animate-shimmer mb-6" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 rounded-[var(--radius-md)] animate-shimmer" />
        ))}
      </div>
    </div>
  );
}

const RADIUS_OPTIONS = [
  { value: 'rounded', label: 'Rounded', sample: '10px' },
  { value: 'sharp', label: 'Sharp', sample: '4px' },
  { value: 'pill', label: 'Pill', sample: '16px' },
];

const FONT_OPTIONS = [
  { value: 'inter', label: 'Inter (default)' },
  { value: 'kantumruy', label: 'Kantumruy Pro (Khmer-first)' },
  { value: 'system', label: 'System UI' },
];

export default function AdminSettings() {
  const { token, user, updateUser, isAdmin, hasPermission } = useAuth();
  const { showToast } = useToast();
  const { refreshTheme } = useTheme();

  // null = list view. Otherwise the id of the item currently drilled into.
  const [view, setView] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [accountName, setAccountName] = useState(user?.name || '');
  const [accountEmail, setAccountEmail] = useState(user?.email || '');
  const [savingAccount, setSavingAccount] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [storeName, setStoreName] = useState('');
  const [storeLogoUrl, setStoreLogoUrl] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [defaultTaxRate, setDefaultTaxRate] = useState('0');
  const [shippingFee, setShippingFee] = useState('0');
  const [freeShippingMin, setFreeShippingMin] = useState('');
  const [codEnabled, setCodEnabled] = useState(true);
  const [bankTransferEnabled, setBankTransferEnabled] = useState(true);
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankQrImageUrl, setBankQrImageUrl] = useState('');

  const [themePrimaryColor, setThemePrimaryColor] = useState('#f4297d');
  const [themeRadiusStyle, setThemeRadiusStyle] = useState('rounded');
  const [themeFont, setThemeFont] = useState('inter');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [savingTheme, setSavingTheme] = useState(false);

  const [colorPresets, setColorPresets] = useState([]);
  const [sizePresets, setSizePresets] = useState([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetHex, setNewPresetHex] = useState('#000000');
  const [newSizeName, setNewSizeName] = useState('');
  const [savingPresets, setSavingPresets] = useState(false);

  const [homepageSections, setHomepageSections] = useState([]);
  const [savingLayout, setSavingLayout] = useState(false);
  // Categories tab (moved in from the standalone /admin/categories page)
  const [categories, setCategories] = useState([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [categoryBusyId, setCategoryBusyId] = useState(null);

  // Banners tab (moved in from the standalone /admin/banners(+/new,+/:id/edit) pages)
  const [banners, setBanners] = useState([]);
  const [bannersLoaded, setBannersLoaded] = useState(false);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [bannerBusyId, setBannerBusyId] = useState(null);
  const [bannerFormMode, setBannerFormMode] = useState(null); // null = list, 'new', or a banner id (edit)
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerCtaText, setBannerCtaText] = useState('Shop now');
  const [bannerCtaLink, setBannerCtaLink] = useState('/shop');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [bannerGradientFrom, setBannerGradientFrom] = useState('rose');
  const [bannerIsActive, setBannerIsActive] = useState(true);
  const [savingBannerForm, setSavingBannerForm] = useState(false);

  const [teamMembers, setTeamMembers] = useState([]);
  const [invitingMember, setInvitingMember] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [invitePermissions, setInvitePermissions] = useState([]);
  const [savingMemberId, setSavingMemberId] = useState(null);

  // Phase 13 — SEO, Notifications & System
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [ogImageUrl, setOgImageUrl] = useState('');
  const [gaId, setGaId] = useState('');
  const [savingSeo, setSavingSeo] = useState(false);

  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpPasswordSet, setSmtpPasswordSet] = useState(false);
  const [notificationEmailFrom, setNotificationEmailFrom] = useState('');
  const [savingNotifications, setSavingNotifications] = useState(false);

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [defaultLanguage, setDefaultLanguage] = useState('en');
  const [timezone, setTimezone] = useState('Asia/Phnom_Penh');
  const [savingSystem, setSavingSystem] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  // Phase 14 — Audit log
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoaded, setAuditLoaded] = useState(false);

  useEffect(() => {
    if (!isAdmin || !token || view !== 'audit' || auditLoaded) return;
    apiClient.get('/admin/settings/audit-log', { token })
      .then((d) => { setAuditLogs(d.logs || []); setAuditLoaded(true); })
      .catch(() => { /* non-fatal: audit tab just shows empty */ });
  }, [isAdmin, token, view, auditLoaded]);

  useEffect(() => {
    if (!isAdmin || !token) return;
    apiClient.get('/admin/team', { token })
      .then((d) => setTeamMembers(d.members || []))
      .catch(() => { /* non-fatal: Team tab just shows empty */ });
  }, [isAdmin, token]);

  useEffect(() => {
    if (view !== 'categories' || categoriesLoaded) return;
    setCategoriesLoading(true);
    apiClient.get('/categories')
      .then((data) => { setCategories(data); setCategoriesLoaded(true); })
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setCategoriesLoading(false));
  }, [view, categoriesLoaded, showToast]);

  useEffect(() => {
    if (view !== 'banners' || bannersLoaded || !token) return;
    setBannersLoading(true);
    apiClient.get('/admin/banners', { token })
      .then((data) => { setBanners(data); setBannersLoaded(true); })
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setBannersLoading(false));
  }, [view, bannersLoaded, token, showToast]);

  useEffect(() => {
    apiClient.get('/admin/settings', { token })
      .then((s) => {
        setStoreName(s.storeName || '');
        setStoreLogoUrl(s.storeLogoUrl || '');
        setContactPhone(s.contactPhone || '');
        setContactEmail(s.contactEmail || '');
        setStoreAddress(s.storeAddress || '');
        setCurrencySymbol(s.currencySymbol || '$');
        setDefaultTaxRate(String(s.defaultTaxRate ?? 0));
        setShippingFee(String(s.shippingFee ?? 0));
        setFreeShippingMin(s.freeShippingMin != null ? String(s.freeShippingMin) : '');
        setCodEnabled(s.codEnabled ?? true);
        setBankTransferEnabled(s.bankTransferEnabled ?? true);
        setBankName(s.bankName || '');
        setBankAccountNumber(s.bankAccountNumber || '');
        setBankAccountName(s.bankAccountName || '');
        setBankQrImageUrl(s.bankQrImageUrl || '');
        setThemePrimaryColor(s.themePrimaryColor || '#f4297d');
        setThemeRadiusStyle(s.themeRadiusStyle || 'rounded');
        setThemeFont(s.themeFont || 'inter');
        setFaviconUrl(s.faviconUrl || '');
        setColorPresets(Array.isArray(s.colorPresets) ? s.colorPresets : []);
        setSizePresets(Array.isArray(s.sizePresets) ? s.sizePresets : []);
        setHomepageSections(Array.isArray(s.homepageSections) ? s.homepageSections : []);
        setSeoTitle(s.seoTitle || '');
        setSeoDescription(s.seoDescription || '');
        setOgImageUrl(s.ogImageUrl || '');
        setGaId(s.gaId || '');
        setSmtpHost(s.smtpHost || '');
        setSmtpPort(s.smtpPort != null ? String(s.smtpPort) : '');
        setSmtpUser(s.smtpUser || '');
        setSmtpPasswordSet(!!s.smtpPasswordSet);
        setNotificationEmailFrom(s.notificationEmailFrom || '');
        setMaintenanceMode(!!s.maintenanceMode);
        setDefaultLanguage(s.defaultLanguage || 'en');
        setTimezone(s.timezone || 'Asia/Phnom_Penh');
      })
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [token, showToast]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        storeName,
        storeLogoUrl: storeLogoUrl || null,
        contactPhone: contactPhone || null,
        contactEmail: contactEmail || null,
        storeAddress: storeAddress || null,
        currencySymbol,
        defaultTaxRate: Number(defaultTaxRate),
        shippingFee: Number(shippingFee),
        freeShippingMin: freeShippingMin === '' ? null : Number(freeShippingMin),
        codEnabled,
        bankTransferEnabled,
        bankName: bankName || null,
        bankAccountNumber: bankAccountNumber || null,
        bankAccountName: bankAccountName || null,
        bankQrImageUrl: bankQrImageUrl || null,
      };
      await apiClient.put('/admin/settings', payload, { token });
      showToast('Settings saved.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleThemeSubmit(e) {
    e.preventDefault();
    setSavingTheme(true);
    try {
      await apiClient.put('/admin/settings', {
        themePrimaryColor,
        themeRadiusStyle,
        themeFont,
        faviconUrl: faviconUrl || null,
      }, { token });
      await refreshTheme(); // re-paint immediately, no reload needed
      showToast('Theme updated.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingTheme(false);
    }
  }

  function addColorPreset() {
    const name = newPresetName.trim();
    if (!name) return;
    if (colorPresets.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      showToast('That color name already exists.', 'error');
      return;
    }
    setColorPresets((prev) => [...prev, { name, hex: newPresetHex }]);
    setNewPresetName('');
  }
  function removeColorPreset(name) {
    setColorPresets((prev) => prev.filter((p) => p.name !== name));
  }

  function addSizePreset() {
    const name = newSizeName.trim();
    if (!name) return;
    if (sizePresets.some((s) => s.toLowerCase() === name.toLowerCase())) {
      showToast('That size already exists.', 'error');
      return;
    }
    setSizePresets((prev) => [...prev, name]);
    setNewSizeName('');
  }
  function removeSizePreset(name) {
    setSizePresets((prev) => prev.filter((s) => s !== name));
  }

  async function handlePresetsSubmit(e) {
    e.preventDefault();
    setSavingPresets(true);
    try {
      await apiClient.put('/admin/settings', { colorPresets, sizePresets }, { token });
      showToast('Presets saved.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingPresets(false);
    }
  }

  function moveSection(index, direction) {
    setHomepageSections((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }
  function toggleSectionVisible(index) {
    setHomepageSections((prev) => prev.map((s, i) => (i === index ? { ...s, visible: !s.visible } : s)));
  }

  async function handleLayoutSubmit(e) {
    e.preventDefault();
    setSavingLayout(true);
    try {
      await apiClient.put('/admin/settings', { homepageSections }, { token });
      showToast('Homepage layout saved.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingLayout(false);
    }
  }

  // ── Categories tab handlers ──────────────────────────────────────────
  async function handleCreateCategory(e) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setCreatingCategory(true);
    try {
      const category = await apiClient.post('/categories', { name: newCategoryName.trim() }, { token });
      setCategories((prev) => [...prev, category]);
      setNewCategoryName('');
      showToast('Category created.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCreatingCategory(false);
    }
  }

  function startEditCategory(cat) {
    setEditingCategoryId(cat.id);
    setEditingCategoryName(cat.name);
  }
  function cancelEditCategory() {
    setEditingCategoryId(null);
    setEditingCategoryName('');
  }
  async function saveEditCategory(id) {
    if (!editingCategoryName.trim()) return;
    setCategoryBusyId(id);
    try {
      const updated = await apiClient.put(`/categories/${id}`, { name: editingCategoryName.trim() }, { token });
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      showToast('Category updated.', 'success');
      cancelEditCategory();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCategoryBusyId(null);
    }
  }
  async function handleDeleteCategory(id, name) {
    if (!window.confirm(`Delete category "${name}"?`)) return;
    setCategoryBusyId(id);
    try {
      await apiClient.delete(`/categories/${id}`, { token });
      setCategories((prev) => prev.filter((c) => c.id !== id));
      showToast('Category deleted.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCategoryBusyId(null);
    }
  }
  async function handleReorderCategory(id, direction) {
    setCategoryBusyId(id);
    try {
      const updated = await apiClient.put(`/categories/${id}/reorder`, { direction }, { token });
      setCategories(updated);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCategoryBusyId(null);
    }
  }

  // ── Banners tab handlers ─────────────────────────────────────────────
  function openNewBannerForm() {
    setBannerTitle('');
    setBannerSubtitle('');
    setBannerCtaText('Shop now');
    setBannerCtaLink('/shop');
    setBannerImageUrl('');
    setBannerGradientFrom('rose');
    setBannerIsActive(true);
    setBannerFormMode('new');
  }
  function openEditBannerForm(b) {
    setBannerTitle(b.title);
    setBannerSubtitle(b.subtitle || '');
    setBannerCtaText(b.ctaText);
    setBannerCtaLink(b.ctaLink);
    setBannerImageUrl(b.imageUrl || '');
    setBannerGradientFrom(b.gradientFrom);
    setBannerIsActive(b.isActive);
    setBannerFormMode(b.id);
  }
  function closeBannerForm() {
    setBannerFormMode(null);
  }
  async function handleBannerFormSubmit(e) {
    e.preventDefault();
    setSavingBannerForm(true);
    try {
      const payload = {
        title: bannerTitle,
        subtitle: bannerSubtitle || null,
        ctaText: bannerCtaText,
        ctaLink: bannerCtaLink,
        imageUrl: bannerImageUrl || null,
        gradientFrom: bannerGradientFrom,
        gradientTo: bannerGradientFrom === 'rose' ? 'rose-dark' : bannerGradientFrom === 'ink' ? 'stone-dark' : 'ink',
        isActive: bannerIsActive,
      };
      const isEdit = bannerFormMode !== 'new';
      if (isEdit) {
        const updated = await apiClient.put(`/admin/banners/${bannerFormMode}`, payload, { token });
        setBanners((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
        showToast('Banner updated.', 'success');
      } else {
        const created = await apiClient.post('/admin/banners', payload, { token });
        setBanners((prev) => [...prev, created]);
        showToast('Banner created.', 'success');
      }
      setBannerFormMode(null);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingBannerForm(false);
    }
  }
  async function handleDeleteBanner(id, title) {
    if (!window.confirm(`Delete banner "${title}"? This cannot be undone.`)) return;
    setBannerBusyId(id);
    try {
      await apiClient.delete(`/admin/banners/${id}`, { token });
      setBanners((prev) => prev.filter((b) => b.id !== id));
      showToast('Banner deleted.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBannerBusyId(null);
    }
  }
  async function handleToggleBannerActive(banner) {
    setBannerBusyId(banner.id);
    try {
      const updated = await apiClient.put(`/admin/banners/${banner.id}`, { isActive: !banner.isActive }, { token });
      setBanners((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBannerBusyId(null);
    }
  }
  async function handleReorderBanner(id, direction) {
    setBannerBusyId(id);
    try {
      const updated = await apiClient.put(`/admin/banners/${id}/reorder`, { direction }, { token });
      setBanners(updated);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBannerBusyId(null);
    }
  }

  async function handleInviteSubmit(e) {
    e.preventDefault();
    setInvitingMember(true);
    try {
      const data = await apiClient.post('/admin/team', {
        name: inviteName, email: inviteEmail, password: invitePassword, permissions: invitePermissions,
      }, { token });
      setTeamMembers((prev) => [...prev, data.member]);
      setInviteName(''); setInviteEmail(''); setInvitePassword(''); setInvitePermissions([]);
      showToast('Staff member invited.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setInvitingMember(false);
    }
  }

  function toggleInvitePermission(key) {
    setInvitePermissions((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  }

  function toggleMemberPermission(member, key) {
    const next = member.permissions.includes(key)
      ? member.permissions.filter((p) => p !== key)
      : [...member.permissions, key];
    setTeamMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, permissions: next } : m)));
  }

  async function saveMember(member) {
    setSavingMemberId(member.id);
    try {
      const data = await apiClient.put(`/admin/team/${member.id}`, {
        permissions: member.permissions, isActive: member.isActive,
      }, { token });
      setTeamMembers((prev) => prev.map((m) => (m.id === member.id ? data.member : m)));
      showToast('Staff member updated.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingMemberId(null);
    }
  }

  function toggleMemberActive(member) {
    setTeamMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, isActive: !m.isActive } : m)));
  }

  async function handleSeoSubmit(e) {
    e.preventDefault();
    setSavingSeo(true);
    try {
      await apiClient.put('/admin/settings', {
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        ogImageUrl: ogImageUrl || null,
        gaId: gaId || null,
      }, { token });
      showToast('SEO settings saved.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingSeo(false);
    }
  }

  async function handleNotificationsSubmit(e) {
    e.preventDefault();
    setSavingNotifications(true);
    try {
      const payload = {
        smtpHost: smtpHost || null,
        smtpPort: smtpPort === '' ? null : Number(smtpPort),
        smtpUser: smtpUser || null,
        notificationEmailFrom: notificationEmailFrom || null,
      };
      // Only send smtpPassword if the admin actually typed a new one —
      // leaving the field blank keeps whatever is already stored.
      if (smtpPassword !== '') payload.smtpPassword = smtpPassword;
      const data = await apiClient.put('/admin/settings', payload, { token });
      setSmtpPasswordSet(!!data.smtpPasswordSet);
      setSmtpPassword('');
      showToast('Notification settings saved.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingNotifications(false);
    }
  }

  async function handleClearSmtpPassword() {
    try {
      const data = await apiClient.put('/admin/settings', { smtpPassword: '' }, { token });
      setSmtpPasswordSet(!!data.smtpPasswordSet);
      showToast('SMTP password cleared.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleSystemSubmit(e) {
    e.preventDefault();
    setSavingSystem(true);
    try {
      await apiClient.put('/admin/settings', { maintenanceMode, defaultLanguage, timezone }, { token });
      showToast('System settings saved.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingSystem(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const data = await apiClient.get('/admin/settings/export', { token });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `settings-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setExporting(false);
    }
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await apiClient.put('/admin/settings/import', parsed, { token });
      showToast('Settings imported. Reloading…', 'success');
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      showToast(err.message || 'That file could not be imported.', 'error');
    } finally {
      setImporting(false);
    }
  }

  async function handleAccountSubmit(e) {
    e.preventDefault();
    setSavingAccount(true);
    try {
      const { user: updatedUser } = await apiClient.put(
        '/auth/me',
        { name: accountName, email: accountEmail },
        { token }
      );
      updateUser(updatedUser);
      showToast('Account updated.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingAccount(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    setSavingPassword(true);
    try {
      await apiClient.put('/auth/me/password', { currentPassword, newPassword }, { token });
      showToast('Password changed.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) return <FormSkeleton />;

  const baseSections = isAdmin ? [...SECTIONS, TEAM_SECTION] : SECTIONS;
  const sections = baseSections.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.permission || hasPermission(item.permission)),
  }));
  const activeItem = sections.flatMap((s) => s.items).find((i) => i.id === view);

  // ── Detail view (drilled into one item) ──────────────────────────────
  if (activeItem) {
    return (
      <div className="max-w-2xl">
        <button
          type="button"
          onClick={() => { setView(null); setBannerFormMode(null); }}
          className="focus-ring flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-5 -ml-1 px-1 py-1 rounded-[var(--radius-sm)] transition-colors duration-150"
        >
          <ChevronLeft size={16} strokeWidth={2} />
          Settings
        </button>

        <h1 className="text-lg md:text-xl font-semibold tracking-tight text-gray-900 mb-6">
          {activeItem.label}
        </h1>

        {view === 'store' && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Field label="Store name">
              <input value={storeName} onChange={(e) => setStoreName(e.target.value)} required className={inputClass} />
            </Field>

            <Field label="Store logo URL">
              <input value={storeLogoUrl} onChange={(e) => setStoreLogoUrl(e.target.value)} placeholder="https://…" className={inputClass} />
            </Field>

            {storeLogoUrl && (
              <img
                src={storeLogoUrl}
                alt="Logo preview"
                className="h-16 w-16 object-contain rounded-[var(--radius-md)] border border-gray-200 bg-gray-50"
                onError={(e) => { e.target.style.opacity = 0.3; }}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field label="Contact phone">
                <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className={inputClass} />
              </Field>
              <Field label="Contact email">
                <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className={inputClass} />
              </Field>
            </div>

            <Field label="Store address">
              <textarea value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} rows={2} className={inputClass} />
            </Field>

            <SaveButton saving={saving} />
          </form>
        )}

        {view === 'branding' && (
          <form onSubmit={handleThemeSubmit} className="flex flex-col gap-6">
            <Field label="Brand color">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={themePrimaryColor}
                  onChange={(e) => setThemePrimaryColor(e.target.value)}
                  className="focus-ring h-11 w-14 rounded-[var(--radius-sm)] border border-gray-300 bg-surface cursor-pointer p-1"
                />
                <input
                  value={themePrimaryColor}
                  onChange={(e) => setThemePrimaryColor(e.target.value)}
                  maxLength={7}
                  className={`${inputClass} font-mono uppercase`}
                />
              </div>
              <span className="text-xs text-gray-500 mt-1">
                One color is all it takes — every shade used across the site (buttons, links, badges, gradients) is generated automatically from this.
              </span>
            </Field>

            {/* Live preview of the generated 50→900 scale, so Admin sees the
                effect of their pick before saving. */}
            <div className="flex rounded-[var(--radius-sm)] overflow-hidden border border-gray-200 h-10">
              {Object.entries(generateColorScale(themePrimaryColor) || {}).map(([shade, hex]) => (
                <div key={shade} style={{ backgroundColor: hex }} className="flex-1" title={`${shade}: ${hex}`} />
              ))}
            </div>

            <Field label="Corner style">
              <div className="grid grid-cols-3 gap-3">
                {RADIUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setThemeRadiusStyle(opt.value)}
                    className={`focus-ring press-scale flex flex-col items-center gap-2 py-3 border-2 transition-colors duration-150 ${
                      themeRadiusStyle === opt.value ? 'border-primary-500' : 'border-gray-200'
                    }`}
                    style={{ borderRadius: opt.sample }}
                  >
                    <span
                      className="h-6 w-10 bg-[image:var(--gradient-primary)]"
                      style={{ borderRadius: opt.sample }}
                    />
                    <span className="text-xs font-medium text-gray-700">{opt.label}</span>
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Typography">
              <select
                value={themeFont}
                onChange={(e) => setThemeFont(e.target.value)}
                className={inputClass}
              >
                {FONT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Favicon URL">
              <input value={faviconUrl} onChange={(e) => setFaviconUrl(e.target.value)} placeholder="https://…" className={inputClass} />
            </Field>

            <SaveButton saving={savingTheme}>{savingTheme ? 'Saving…' : 'Save theme'}</SaveButton>
          </form>
        )}

        {view === 'categories' && (
          <div className="flex flex-col gap-6">
            <form onSubmit={handleCreateCategory} className="flex items-center gap-2">
              <input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="New category name"
                className={`${inputClass} flex-1`}
              />
              <button
                type="submit"
                disabled={creatingCategory || !newCategoryName.trim()}
                className="focus-ring press-scale flex items-center gap-1.5 px-4 py-2.5 bg-primary-500 text-white text-sm font-medium rounded-[var(--radius-md)] shadow-xs hover:bg-primary-600 transition-colors duration-150 disabled:opacity-40"
              >
                <Plus size={15} /> Add
              </button>
            </form>

            {categoriesLoading ? (
              <div className="rounded-[var(--radius-lg)] overflow-hidden border border-gray-200">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 animate-shimmer border-b border-gray-200 last:border-b-0" />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <div className="bg-surface border border-gray-200 rounded-[var(--radius-lg)] shadow-xs px-4 py-10 text-center">
                <p className="text-sm text-gray-500">No categories yet.</p>
              </div>
            ) : (
              <div className="bg-surface border border-gray-200 rounded-[var(--radius-lg)] shadow-xs divide-y divide-gray-200 overflow-hidden">
                {categories.map((cat, i) => (
                  <div key={cat.id} className={`flex items-center justify-between px-4 py-3 transition-opacity duration-150 ${categoryBusyId === cat.id ? 'opacity-50 pointer-events-none' : ''}`}>
                    {editingCategoryId === cat.id ? (
                      <input
                        value={editingCategoryName}
                        onChange={(e) => setEditingCategoryName(e.target.value)}
                        className={`${inputClass} flex-1 mr-3 py-1.5`}
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm text-gray-900 min-w-0 truncate">
                        {cat.name} <span className="text-xs text-gray-500">({cat.productCount} product{cat.productCount === 1 ? '' : 's'})</span>
                      </span>
                    )}

                    <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                      {editingCategoryId === cat.id ? (
                        <>
                          <button type="button" onClick={() => saveEditCategory(cat.id)} className="focus-ring w-11 h-11 sm:w-auto sm:h-auto flex items-center justify-center sm:p-1.5 rounded-[var(--radius-sm)] text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition-colors duration-150" aria-label="Save">
                            <Check size={16} />
                          </button>
                          <button type="button" onClick={cancelEditCategory} className="focus-ring w-11 h-11 sm:w-auto sm:h-auto flex items-center justify-center sm:p-1.5 rounded-[var(--radius-sm)] text-gray-500 hover:text-error hover:bg-error-light transition-colors duration-150" aria-label="Cancel">
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => handleReorderCategory(cat.id, 'up')} disabled={i === 0} className="focus-ring w-11 h-11 sm:w-auto sm:h-auto flex items-center justify-center sm:p-1.5 rounded-[var(--radius-sm)] text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-150 disabled:opacity-30" aria-label="Move up">
                            <ArrowUp size={16} />
                          </button>
                          <button type="button" onClick={() => handleReorderCategory(cat.id, 'down')} disabled={i === categories.length - 1} className="focus-ring w-11 h-11 sm:w-auto sm:h-auto flex items-center justify-center sm:p-1.5 rounded-[var(--radius-sm)] text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-150 disabled:opacity-30" aria-label="Move down">
                            <ArrowDown size={16} />
                          </button>
                          <button type="button" onClick={() => startEditCategory(cat)} className="focus-ring w-11 h-11 sm:w-auto sm:h-auto flex items-center justify-center sm:p-1.5 rounded-[var(--radius-sm)] text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-150" aria-label="Edit">
                            <Pencil size={16} />
                          </button>
                          <button type="button" onClick={() => handleDeleteCategory(cat.id, cat.name)} className="focus-ring w-11 h-11 sm:w-auto sm:h-auto flex items-center justify-center sm:p-1.5 rounded-[var(--radius-sm)] text-gray-500 hover:text-error hover:bg-error-light transition-colors duration-150" aria-label="Delete">
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'presets' && (
          <form onSubmit={handlePresetsSubmit} className="flex flex-col gap-8">
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">Color presets</p>
              <p className="text-xs text-gray-500 mb-3">
                Shown as quick-pick chips when adding product variants. Used instead of typing a color name every time.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {colorPresets.map((p) => (
                  <span key={p.name} className="flex items-center gap-1.5 pl-1 pr-1.5 py-1 text-xs rounded-full border border-gray-300 text-gray-700">
                    <span className="h-3.5 w-3.5 rounded-full border border-gray-200/60 shrink-0" style={{ backgroundColor: p.hex }} />
                    {p.name}
                    <button type="button" onClick={() => removeColorPreset(p.name)} className="focus-ring text-gray-400 hover:text-error">
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {colorPresets.length === 0 && <span className="text-xs text-gray-400">No color presets yet.</span>}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newPresetHex}
                  onChange={(e) => setNewPresetHex(e.target.value)}
                  className="focus-ring h-9 w-11 rounded-[var(--radius-sm)] border border-gray-300 bg-surface cursor-pointer p-1"
                />
                <input
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addColorPreset(); } }}
                  placeholder="e.g. Coral"
                  className={`${inputClass} text-xs py-2`}
                />
                <button type="button" onClick={addColorPreset} className="focus-ring press-scale shrink-0 p-2.5 bg-gray-100 text-gray-700 rounded-[var(--radius-sm)] hover:bg-gray-200 transition-colors duration-150">
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">Size presets</p>
              <p className="text-xs text-gray-500 mb-3">Shown as quick-pick chips when adding product variants.</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {sizePresets.map((s) => (
                  <span key={s} className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 text-xs rounded-full border border-gray-300 text-gray-700">
                    {s}
                    <button type="button" onClick={() => removeSizePreset(s)} className="focus-ring text-gray-400 hover:text-error">
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {sizePresets.length === 0 && <span className="text-xs text-gray-400">No size presets yet.</span>}
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={newSizeName}
                  onChange={(e) => setNewSizeName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSizePreset(); } }}
                  placeholder="e.g. 3XL"
                  className={`${inputClass} text-xs py-2`}
                />
                <button type="button" onClick={addSizePreset} className="focus-ring press-scale shrink-0 p-2.5 bg-gray-100 text-gray-700 rounded-[var(--radius-sm)] hover:bg-gray-200 transition-colors duration-150">
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <SaveButton saving={savingPresets} />
          </form>
        )}

        {view === 'layout' && (
          <form onSubmit={handleLayoutSubmit} className="flex flex-col gap-5">
            <p className="text-xs text-gray-500 -mt-1">
              Reorder or hide homepage blocks. Changes apply to the storefront as soon as you save.
            </p>
            <div className="rounded-[var(--radius-md)] border border-gray-200 divide-y divide-gray-100 overflow-hidden">
              {homepageSections.map((section, i) => (
                <div key={section.id} className="flex items-center gap-3 px-4 py-3 bg-surface">
                  <div className="flex flex-col -my-1">
                    <button type="button" disabled={i === 0} onClick={() => moveSection(i, -1)} className="focus-ring text-gray-400 hover:text-gray-900 disabled:opacity-30">
                      <ChevronUp size={14} />
                    </button>
                    <button type="button" disabled={i === homepageSections.length - 1} onClick={() => moveSection(i, 1)} className="focus-ring text-gray-400 hover:text-gray-900 disabled:opacity-30">
                      <ChevronDown size={14} />
                    </button>
                  </div>
                  <span className={`flex-1 text-sm font-medium ${section.visible ? 'text-gray-900' : 'text-gray-400'}`}>
                    {section.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleSectionVisible(i)}
                    className="focus-ring press-scale flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-full border border-gray-300 text-gray-600 hover:border-gray-400 transition-colors duration-150"
                  >
                    {section.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                    {section.visible ? 'Visible' : 'Hidden'}
                  </button>
                </div>
              ))}
              {homepageSections.length === 0 && (
                <p className="px-4 py-3 text-xs text-gray-400">No sections configured — the storefront will use its default layout.</p>
              )}
            </div>
            <SaveButton saving={savingLayout} />
          </form>
        )}

        {view === 'banners' && (
          <div className="flex flex-col gap-6">
            {bannerFormMode === null ? (
              <>
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={openNewBannerForm}
                    className="focus-ring press-scale flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white text-sm font-medium rounded-[var(--radius-md)] shadow-xs hover:bg-primary-600 transition-colors duration-150"
                  >
                    <Plus size={16} /> New banner
                  </button>
                </div>

                {bannersLoading ? (
                  <div className="flex flex-col gap-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-[86px] rounded-[var(--radius-lg)] animate-shimmer" />
                    ))}
                  </div>
                ) : banners.length === 0 ? (
                  <div className="bg-surface border border-gray-200 rounded-[var(--radius-lg)] shadow-xs px-4 py-10 text-center">
                    <p className="text-sm text-gray-500">No banners yet. Create one to show on the homepage.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {banners.map((b, i) => (
                      <div
                        key={b.id}
                        className={`bg-surface border border-gray-200 rounded-[var(--radius-lg)] shadow-xs p-4 flex items-center gap-4 transition-opacity duration-150 ${bannerBusyId === b.id ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <div
                          className="w-24 h-14 rounded-[var(--radius-sm)] shrink-0 bg-cover bg-center bg-gray-100"
                          style={{ backgroundImage: b.imageUrl ? `url(${b.imageUrl})` : 'var(--gradient-primary)' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">{b.title}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">{b.subtitle || '—'}</p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button type="button" onClick={() => handleReorderBanner(b.id, 'up')} disabled={i === 0} className="focus-ring p-1.5 rounded-[var(--radius-sm)] text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-150 disabled:opacity-30" aria-label="Move up">
                            <ArrowUp size={16} />
                          </button>
                          <button type="button" onClick={() => handleReorderBanner(b.id, 'down')} disabled={i === banners.length - 1} className="focus-ring p-1.5 rounded-[var(--radius-sm)] text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-150 disabled:opacity-30" aria-label="Move down">
                            <ArrowDown size={16} />
                          </button>
                          <button type="button" onClick={() => handleToggleBannerActive(b)} className="focus-ring p-1.5 rounded-[var(--radius-sm)] text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-150" aria-label={b.isActive ? 'Deactivate' : 'Activate'}>
                            {b.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                          <button type="button" onClick={() => openEditBannerForm(b)} className="focus-ring p-1.5 rounded-[var(--radius-sm)] text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-150" aria-label="Edit">
                            <Pencil size={16} />
                          </button>
                          <button type="button" onClick={() => handleDeleteBanner(b.id, b.title)} className="focus-ring p-1.5 rounded-[var(--radius-sm)] text-gray-500 hover:text-error hover:bg-error-light transition-colors duration-150" aria-label="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <form onSubmit={handleBannerFormSubmit} className="flex flex-col gap-5">
                <button
                  type="button"
                  onClick={closeBannerForm}
                  className="focus-ring flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 -ml-1 px-1 py-1 rounded-[var(--radius-sm)] transition-colors duration-150 self-start"
                >
                  <ChevronLeft size={16} strokeWidth={2} />
                  Banners
                </button>

                <p className="text-sm font-medium text-gray-900 -mb-2">
                  {bannerFormMode === 'new' ? 'New banner' : 'Edit banner'}
                </p>

                <Field label="Title">
                  <input value={bannerTitle} onChange={(e) => setBannerTitle(e.target.value)} required className={inputClass} />
                </Field>

                <Field label="Subtitle (optional)">
                  <input value={bannerSubtitle} onChange={(e) => setBannerSubtitle(e.target.value)} className={inputClass} />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Button text">
                    <input value={bannerCtaText} onChange={(e) => setBannerCtaText(e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Button link">
                    <input value={bannerCtaLink} onChange={(e) => setBannerCtaLink(e.target.value)} placeholder="/shop" className={inputClass} />
                  </Field>
                </div>

                <Field label="Background image URL (optional — leave empty to use a color gradient instead)">
                  <input value={bannerImageUrl} onChange={(e) => setBannerImageUrl(e.target.value)} placeholder="https://…" className={inputClass} />
                </Field>

                {bannerImageUrl && (
                  <img
                    src={bannerImageUrl}
                    alt="Preview"
                    className="w-full aspect-[21/9] object-cover rounded-[var(--radius-lg)] border border-gray-200 bg-gray-100"
                    onError={(e) => { e.target.style.opacity = 0.3; }}
                  />
                )}

                {!bannerImageUrl && (
                  <Field label="Gradient color (used when no image is set)">
                    <div className="flex gap-3">
                      {[
                        { value: 'rose', label: 'Rose', preview: 'var(--gradient-primary)' },
                        { value: 'ink', label: 'Ink', preview: 'linear-gradient(135deg, #1d2939, #475467)' },
                        { value: 'stone-dark', label: 'Stone', preview: 'linear-gradient(135deg, #667085, #101828)' },
                      ].map((g) => (
                        <button
                          key={g.value}
                          type="button"
                          onClick={() => setBannerGradientFrom(g.value)}
                          className={`focus-ring flex-1 h-14 rounded-[var(--radius-md)] border-2 transition-all duration-150 ${bannerGradientFrom === g.value ? 'border-primary-500 scale-105 shadow-xs' : 'border-transparent'}`}
                          style={{ background: g.preview }}
                          title={g.label}
                        />
                      ))}
                    </div>
                  </Field>
                )}

                <label className="flex items-center gap-2.5 text-sm text-gray-900">
                  <input type="checkbox" checked={bannerIsActive} onChange={(e) => setBannerIsActive(e.target.checked)} className="focus-ring h-4 w-4 accent-primary-500" />
                  Show on homepage
                </label>

                <SaveButton saving={savingBannerForm}>
                  {savingBannerForm ? 'Saving…' : bannerFormMode === 'new' ? 'Create banner' : 'Save changes'}
                </SaveButton>
              </form>
            )}
          </div>
        )}

        {view === 'team' && (
          <div className="flex flex-col gap-8">
            <div>
              <p className="text-sm font-medium text-gray-900 mb-3">Staff members</p>
              <div className="flex flex-col gap-3">
                {teamMembers.filter((m) => m.role === 'staff').map((member) => (
                  <div key={member.id} className="rounded-[var(--radius-md)] border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleMemberActive(member)}
                        className={`focus-ring press-scale shrink-0 px-2.5 py-1.5 text-xs font-medium rounded-full border transition-colors duration-150 ${
                          member.isActive ? 'border-gray-300 text-gray-600 hover:border-gray-400' : 'border-error/40 text-error bg-error/5'
                        }`}
                      >
                        {member.isActive ? 'Active' : 'Deactivated'}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                        <label key={key} className="flex items-center gap-1.5 text-xs text-gray-700 border border-gray-200 rounded-full pl-2 pr-2.5 py-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={member.permissions.includes(key)}
                            onChange={() => toggleMemberPermission(member, key)}
                            className="focus-ring accent-primary-500"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => saveMember(member)}
                      disabled={savingMemberId === member.id}
                      className="focus-ring press-scale px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-[var(--radius-sm)] disabled:opacity-50"
                    >
                      {savingMemberId === member.id ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                ))}
                {teamMembers.filter((m) => m.role === 'staff').length === 0 && (
                  <p className="text-xs text-gray-400">No staff members yet — invite one below.</p>
                )}
              </div>
            </div>

            <form onSubmit={handleInviteSubmit} className="flex flex-col gap-4 pt-2 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5"><Shield size={15} /> Invite staff</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Name">
                  <input value={inviteName} onChange={(e) => setInviteName(e.target.value)} required className={inputClass} />
                </Field>
                <Field label="Email">
                  <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required className={inputClass} />
                </Field>
              </div>
              <Field label="Temporary password">
                <input type="password" value={invitePassword} onChange={(e) => setInvitePassword(e.target.value)} required minLength={8} className={inputClass} />
              </Field>
              <div>
                <span className="text-xs font-medium text-gray-600 block mb-2">Permissions</span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-1.5 text-xs text-gray-700 border border-gray-200 rounded-full pl-2 pr-2.5 py-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={invitePermissions.includes(key)}
                        onChange={() => toggleInvitePermission(key)}
                        className="focus-ring accent-primary-500"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              <SaveButton saving={invitingMember}>{invitingMember ? 'Inviting…' : 'Send invite'}</SaveButton>
            </form>
          </div>
        )}

        {view === 'seo' && (
          <form onSubmit={handleSeoSubmit} className="flex flex-col gap-4">
            <Field label="Site title">
              <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="FashionHub — Everyday fashion, delivered" className={inputClass} />
            </Field>
            <Field label="Meta description">
              <textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} rows={3} maxLength={300} className={`${inputClass} resize-none`} />
            </Field>
            <Field label="Social preview image (OG image) URL">
              <input value={ogImageUrl} onChange={(e) => setOgImageUrl(e.target.value)} placeholder="https://…" className={inputClass} />
            </Field>
            <Field label="Google Analytics ID">
              <input value={gaId} onChange={(e) => setGaId(e.target.value)} placeholder="G-XXXXXXXXXX" className={inputClass} />
            </Field>
            <SaveButton saving={savingSeo} />
          </form>
        )}

        {view === 'notifications' && (
          <form onSubmit={handleNotificationsSubmit} className="flex flex-col gap-4">
            <p className="text-xs text-gray-500 -mt-1">Used to send order-confirmation and account emails.</p>
            <Field label="SMTP host">
              <input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.example.com" className={inputClass} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="SMTP port">
                <input type="number" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} placeholder="587" className={inputClass} />
              </Field>
              <Field label="SMTP username">
                <input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} className={inputClass} />
              </Field>
            </div>
            <Field label={smtpPasswordSet ? 'SMTP password (set — leave blank to keep it)' : 'SMTP password'}>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                  placeholder={smtpPasswordSet ? '••••••••' : ''}
                  className={inputClass}
                />
                {smtpPasswordSet && (
                  <button type="button" onClick={handleClearSmtpPassword} className="focus-ring shrink-0 px-3 text-xs font-medium text-error hover:underline">
                    Clear
                  </button>
                )}
              </div>
              <span className="text-xs text-gray-500 mt-1">Stored encrypted — never shown back once saved.</span>
            </Field>
            <Field label="“From” email address">
              <input value={notificationEmailFrom} onChange={(e) => setNotificationEmailFrom(e.target.value)} placeholder="orders@yourstore.com" className={inputClass} />
            </Field>
            <SaveButton saving={savingNotifications} />
          </form>
        )}

        {view === 'system' && (
          <div className="flex flex-col gap-8">
            <form onSubmit={handleSystemSubmit} className="flex flex-col gap-4">
              <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-gray-200 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Maintenance mode</p>
                  <p className="text-xs text-gray-500">Shows a "we'll be back" page to shoppers. You stay logged in and can keep working.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMaintenanceMode((v) => !v)}
                  className={`focus-ring press-scale shrink-0 w-11 h-6 rounded-full relative transition-colors duration-150 ${maintenanceMode ? 'bg-primary-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-150 ${maintenanceMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <Field label="Default language">
                <select value={defaultLanguage} onChange={(e) => setDefaultLanguage(e.target.value)} className={inputClass}>
                  <option value="en">English</option>
                  <option value="km">ភាសាខ្មែរ (Khmer)</option>
                </select>
              </Field>
              <Field label="Timezone">
                <input value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="Asia/Phnom_Penh" className={inputClass} />
              </Field>
              <SaveButton saving={savingSystem} />
            </form>

            <div className="pt-2 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-900 mb-1">Backup & restore</p>
              <p className="text-xs text-gray-500 mb-3">
                Export every setting on this page to a JSON file, or restore from a previous export. The SMTP password is never included — re-enter it after importing.
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={handleExport} disabled={exporting} className="focus-ring press-scale flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-gray-100 text-gray-700 rounded-[var(--radius-sm)] hover:bg-gray-200 disabled:opacity-50">
                  <Download size={14} /> {exporting ? 'Exporting…' : 'Export settings'}
                </button>
                <label className="focus-ring press-scale flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-gray-100 text-gray-700 rounded-[var(--radius-sm)] hover:bg-gray-200 cursor-pointer">
                  <Upload size={14} /> {importing ? 'Importing…' : 'Import settings'}
                  <input type="file" accept="application/json" onChange={handleImportFile} disabled={importing} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        )}

        {view === 'audit' && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-gray-500 -mt-1">Last 100 settings changes across your whole team. Sensitive values (SMTP password, bank account number) are shown as changed only, never their value.</p>
            {auditLogs.map((log) => (
              <div key={log.id} className="rounded-[var(--radius-md)] border border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-medium text-gray-900">{log.actorName} <span className="text-gray-400 font-normal">· {log.actorEmail}</span></p>
                  <p className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
                <ul className="text-xs text-gray-600 flex flex-col gap-0.5">
                  {log.changedFields.map((c, i) => (
                    <li key={i}>
                      <span className="font-medium text-gray-800">{c.field}</span>
                      {c.changed ? ' — changed' : (
                        <> : <span className="text-gray-400">{JSON.stringify(c.from)}</span> → <span className="text-gray-700">{JSON.stringify(c.to)}</span></>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {auditLoaded && auditLogs.length === 0 && <p className="text-xs text-gray-400">No changes logged yet.</p>}
          </div>
        )}

        {view === 'tax' && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Currency symbol">
                <input value={currencySymbol} onChange={(e) => setCurrencySymbol(e.target.value)} maxLength={3} className={inputClass} />
              </Field>
              <Field label="Default tax rate (%)">
                <input type="number" step="0.01" min="0" max="100" value={defaultTaxRate} onChange={(e) => setDefaultTaxRate(e.target.value)} className={inputClass} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label={`Shipping fee (${currencySymbol || '$'})`}>
                <input type="number" step="0.01" min="0" value={shippingFee} onChange={(e) => setShippingFee(e.target.value)} className={inputClass} />
              </Field>
              <Field label={`Free shipping over (${currencySymbol || '$'}) — optional`}>
                <input type="number" step="0.01" min="0" value={freeShippingMin} onChange={(e) => setFreeShippingMin(e.target.value)} placeholder="No minimum" className={inputClass} />
              </Field>
            </div>

            <SaveButton saving={saving} />
          </form>
        )}

        {view === 'payment' && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <label className="flex items-center gap-2.5 text-sm text-gray-900">
              <input
                type="checkbox"
                checked={codEnabled}
                onChange={(e) => setCodEnabled(e.target.checked)}
                className="focus-ring h-4 w-4 accent-primary-500"
              />
              Cash on delivery (COD)
            </label>

            <label className="flex items-center gap-2.5 text-sm text-gray-900">
              <input
                type="checkbox"
                checked={bankTransferEnabled}
                onChange={(e) => setBankTransferEnabled(e.target.checked)}
                className="focus-ring h-4 w-4 accent-primary-500"
              />
              Bank transfer
            </label>

            {bankTransferEnabled && (
              <div className="flex flex-col gap-5 pl-6 border-l-2 border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Bank name">
                    <input value={bankName} onChange={(e) => setBankName(e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Account number">
                    <input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} className={inputClass} />
                  </Field>
                </div>

                <Field label="Account name">
                  <input value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} className={inputClass} />
                </Field>

                <Field label="Bank QR image URL">
                  <input value={bankQrImageUrl} onChange={(e) => setBankQrImageUrl(e.target.value)} placeholder="https://…" className={inputClass} />
                </Field>

                {bankQrImageUrl && (
                  <img
                    src={bankQrImageUrl}
                    alt="Bank QR preview"
                    className="h-40 w-40 object-contain rounded-[var(--radius-md)] border border-gray-200 bg-gray-50"
                    onError={(e) => { e.target.style.opacity = 0.3; }}
                  />
                )}
              </div>
            )}

            <SaveButton saving={saving} />
          </form>
        )}

        {view === 'account' && (
          <form onSubmit={handleAccountSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Name">
                <input value={accountName} onChange={(e) => setAccountName(e.target.value)} required className={inputClass} />
              </Field>
              <Field label="Email">
                <input type="email" value={accountEmail} onChange={(e) => setAccountEmail(e.target.value)} required className={inputClass} />
              </Field>
            </div>
            <SaveButton saving={savingAccount}>{savingAccount ? 'Saving…' : 'Save profile'}</SaveButton>
          </form>
        )}

        {view === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-5">
            <Field label="Current password">
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className={inputClass} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="New password">
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} className={inputClass} />
              </Field>
              <Field label="Confirm new password">
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} className={inputClass} />
              </Field>
            </div>
            <SaveButton saving={savingPassword}>{savingPassword ? 'Saving…' : 'Change password'}</SaveButton>
          </form>
        )}
      </div>
    );
  }

  // ── List view (Facebook Settings & privacy style) ────────────────────
  return (
    <div className="max-w-2xl">
      <h1 className="text-lg md:text-xl font-semibold tracking-tight text-gray-900 mb-6">
        Settings
      </h1>

      <div className="flex flex-col gap-8">
        {sections.map((section) => (
          <div key={section.heading}>
            <p className="text-base font-semibold text-gray-900">{section.heading}</p>
            <p className="text-xs text-gray-500 mb-3">{section.subheading}</p>

            <div className="rounded-[var(--radius-md)] border border-gray-200 divide-y divide-gray-100 overflow-hidden">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setView(item.id)}
                    className="focus-ring press-scale w-full flex items-center gap-3 px-4 py-3.5 bg-surface hover:bg-gray-50 transition-colors duration-150 text-left"
                  >
                    <Icon size={18} strokeWidth={1.75} className="text-gray-700 shrink-0" />
                    <span className="flex-1 text-sm font-medium text-gray-900">{item.label}</span>
                    <ChevronRight size={16} strokeWidth={2} className="text-gray-400 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}