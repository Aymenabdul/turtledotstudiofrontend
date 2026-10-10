import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import {
  Settings as SettingsIcon,
  Building,
  Globe,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Clock,
  HardDrive,
  Save,
  CheckCircle,
  AlertCircle,
  Camera,
  Upload,
  FileText,
  Receipt,
  Shield,
  Lock,
  EyeOff,
  ShieldCheck
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import turtledotLogo from '../../img/turtledot_app_icon_color.png';
import { getDefaultExchangeRate, getCurrencySymbol } from '../../utils/currency';
import { useAlert } from '../../context/AlertContext';
import { CustomSelect } from '../../components/CustomSelect';

export default function Settings() {
  const queryClient = useQueryClient();
  const alert = useAlert();
  const { user, setUser } = useAuthStore();
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [timezone, setTimezone] = useState('UTC');
  const [maxUploadSizeMb, setMaxUploadSizeMb] = useState(500);
  const [convertAmounts, setConvertAmounts] = useState(true);
  const [customRate, setCustomRate] = useState('');
  const [gstin, setGstin] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [stateName, setStateName] = useState('Maharashtra');
  const [stateCode, setStateCode] = useState('27');
  const [gstRatePercent, setGstRatePercent] = useState('18.00');

  // Fetch current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['studioSettings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data.data;
    },
  });

  useEffect(() => {
    if (settings) {
      setName(settings.name || '');
      setSlug(settings.slug || '');
      setLogoUrl(settings.logoUrl || '');
      setPhone(settings.phone || '');
      setEmail(settings.email || '');
      setAddress(settings.address || '');
      setWebsite(settings.website || '');
      setCurrency(settings.currency || 'USD');
      setTimezone(settings.timezone || 'UTC');
      setMaxUploadSizeMb(settings.maxUploadSizeMb || 500);
      setGstin(settings.gstin || '');
      setPanNumber(settings.panNumber || '');
      setStateName(settings.stateName || 'Maharashtra');
      setStateCode(settings.stateCode || '27');
      setGstRatePercent(settings.gstRatePercent ? String(settings.gstRatePercent) : '18.00');
    }
  }, [settings]);

  // Update mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.put('/settings', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['studioSettings']);
      queryClient.invalidateQueries(['adminDashboardStats']);
      queryClient.invalidateQueries(['adminMonthlyRevenue']);
      queryClient.invalidateQueries(['studioClients']);
      queryClient.invalidateQueries(['studioPayments']);
      if (user) {
        setUser({
          ...user,
          studioName: name.trim(),
          studioLogoUrl: logoUrl.trim() || '/turtledot_app_icon_color.png',
          studioCurrency: currency,
        });
      }
      alert.success('Studio configuration, currency, and settings updated successfully!', 'Settings Saved');
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Failed to update settings';
      alert.error(msg, 'Update Error');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    const rateToUse = customRate ? Number(customRate) : getDefaultExchangeRate(settings?.currency || 'USD', currency);
    updateSettingsMutation.mutate({
      name: name.trim(),
      slug,
      logoUrl: logoUrl.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      website: website.trim(),
      currency,
      timezone,
      maxUploadSizeMb: Number(maxUploadSizeMb),
      convertAmounts: currency !== (settings?.currency || 'USD') ? convertAmounts : false,
      exchangeRate: rateToUse,
      gstin: gstin.trim().toUpperCase(),
      panNumber: panNumber.trim().toUpperCase(),
      stateName: stateName.trim(),
      stateCode: stateCode.trim(),
      gstRatePercent: Number(gstRatePercent || 18.0),
    });
  };

  return (
    <div className="space-y-6 sm:space-y-7 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight drop-shadow-xs">Studio Settings & Branding</h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          Customize your photography studio identity, public gallery branding, currency, and file size limits.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center text-stone-400 text-xs">Loading studio configuration...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Section 1: Studio Identity & Branding */}
          <div className="neu-glass-panel p-6 sm:p-7 rounded-3xl space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-stone-200/60">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
                <Building className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-stone-900">Studio Profile & Branding</h3>
                <p className="text-xs text-stone-500">Displayed on client QR delivery galleries and receipts</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-stone-700 font-bold mb-1.5">Studio Business Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full neu-glass-input rounded-2xl px-4 py-2.5 text-stone-900 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1.5">Studio URL Identifier (Slug)</label>
                <input
                  type="text"
                  value={slug}
                  disabled
                  className="w-full neu-glass-input rounded-2xl px-4 py-2.5 text-stone-500 font-mono cursor-not-allowed opacity-75"
                />
              </div>
            </div>

            {/* Logo URL with Live Preview */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-stone-700 font-bold">Studio Logo URL / Path</label>
                <button
                  type="button"
                  onClick={() => setLogoUrl('/turtledot_app_icon_color.png')}
                  className="text-xs text-amber-700 hover:text-amber-800 font-bold underline cursor-pointer"
                >
                  Use Turtledot Default Logo
                </button>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="/turtledot_app_icon_color.png or https://your-studio.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="flex-1 neu-glass-input rounded-2xl px-4 py-2.5 text-stone-900"
                />
                <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 p-1.5 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                  <img src={logoUrl || turtledotLogo} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-stone-700 font-bold mb-1.5">Official Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full neu-glass-input rounded-2xl px-4 py-2.5 text-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1.5">Studio Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full neu-glass-input rounded-2xl px-4 py-2.5 text-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1.5">Studio Website</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full neu-glass-input rounded-2xl px-4 py-2.5 text-stone-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1.5">Physical Studio Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full neu-glass-input rounded-2xl px-4 py-2.5 text-stone-900"
              />
            </div>
          </div>

          {/* Section 2: Financial & Localization Preferences */}
          <div className="neu-glass-panel p-6 sm:p-7 rounded-3xl space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-stone-200/60">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
                <DollarSign className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-stone-900">Financial & Regional Preferences</h3>
                <p className="text-xs text-stone-500">Configure studio billing currency and operating timezone</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-stone-700 font-bold mb-1.5">Default Currency</label>
                <CustomSelect
                  value={currency}
                  onChange={(val) => setCurrency(val)}
                  options={[
                    { value: 'USD', label: 'USD ($ - US Dollar)' },
                    { value: 'EUR', label: 'EUR (€ - Euro)' },
                    { value: 'GBP', label: 'GBP (£ - British Pound)' },
                    { value: 'INR', label: 'INR (₹ - Indian Rupee)' },
                    { value: 'CAD', label: 'CAD ($ - Canadian Dollar)' },
                    { value: 'AUD', label: 'AUD ($ - Australian Dollar)' },
                  ]}
                  className="w-full neu-glass-input rounded-2xl px-4 py-2.5 text-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1.5">Operating Timezone</label>
                <CustomSelect
                  value={timezone}
                  onChange={(val) => setTimezone(val)}
                  options={[
                    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
                    { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
                    { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT)' },
                    { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
                    { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
                    { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
                  ]}
                  className="w-full neu-glass-input rounded-2xl px-4 py-2.5 text-stone-900"
                />
              </div>
            </div>

            {currency !== (settings?.currency || 'USD') && (
              <div className="mt-4 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="convertAmountsCheckbox"
                    checked={convertAmounts}
                    onChange={(e) => setConvertAmounts(e.target.checked)}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <label htmlFor="convertAmountsCheckbox" className="text-xs text-stone-800 font-bold cursor-pointer">
                    Convert existing client package quotes and recorded payments to {currency} ({getCurrencySymbol(currency)})
                  </label>
                </div>
                {convertAmounts && (
                  <div className="pl-6 flex items-center gap-2 text-xs text-stone-600">
                    <span className="font-medium">Exchange Rate: 1 {settings?.currency || 'USD'} =</span>
                    <input
                      type="number"
                      step="0.0001"
                      value={customRate !== '' ? customRate : getDefaultExchangeRate(settings?.currency || 'USD', currency)}
                      onChange={(e) => setCustomRate(e.target.value)}
                      className="w-28 px-3 py-1.5 neu-glass-input rounded-xl text-xs font-bold text-stone-900"
                    />
                    <span className="font-bold text-stone-800">{currency}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section: GST & Tax Invoice Configuration */}
          <div className="neu-glass-panel p-6 sm:p-7 rounded-3xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
                  <Receipt className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-stone-900">GST & Tax Invoice Configuration</h3>
                  <p className="text-xs text-stone-500">Configure your studio tax identification numbers and GST rate for official PDF invoices</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <FileText className="w-3.5 h-3.5" />
                <span>PDF Invoices Enabled</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Studio GSTIN */}
              <div>
                <label className="block text-stone-700 font-bold mb-1.5">
                  Studio GSTIN <span className="text-amber-800 font-mono text-[11px]">(15-digit)</span>
                </label>
                <input
                  type="text"
                  maxLength={15}
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="e.g. 27AAPFU0939F1ZV"
                  className="w-full neu-glass-input rounded-2xl px-4 py-2.5 text-stone-900 font-mono text-xs uppercase font-bold"
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  Required for official GST compliance and input tax credit on services.
                </p>
              </div>

              {/* Studio PAN */}
              <div>
                <label className="block text-stone-700 font-bold mb-1.5">
                  Studio Permanent Account Number (PAN)
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. AAPFU0939F"
                  className="w-full neu-glass-input rounded-2xl px-4 py-2.5 text-stone-900 font-mono text-xs uppercase font-bold"
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  Business income tax PAN number shown on invoice headers.
                </p>
              </div>

              {/* Place of Supply / State */}
              <div>
                <label className="block text-stone-700 font-bold mb-1.5">
                  State / Place of Supply
                </label>
                <input
                  type="text"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  placeholder="e.g. Maharashtra"
                  className="w-full neu-glass-input rounded-2xl px-4 py-2.5 text-stone-900 text-xs font-semibold"
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  Operating state where photographic and media production services are rendered.
                </p>
              </div>

              {/* State Code */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-stone-700 font-bold">State Code</label>
                  <span className="text-[11px] text-stone-400">e.g. 27 for MH, 29 for KA, 07 for DL</span>
                </div>
                <input
                  type="text"
                  maxLength={5}
                  value={stateCode}
                  onChange={(e) => setStateCode(e.target.value)}
                  placeholder="e.g. 27"
                  className="w-full neu-glass-input rounded-2xl px-4 py-2.5 text-stone-900 font-mono text-xs font-bold"
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  2-digit official GST state code printed alongside place of supply.
                </p>
              </div>

              {/* GST Rate */}
              <div className="sm:col-span-2 bg-stone-50/70 border border-stone-200/80 rounded-2xl p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-stone-900 font-extrabold text-xs">Applicable GST Rate (%)</label>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Standard GST rate for Photography & Videography Services under SAC Code 998381 is 18%.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={gstRatePercent}
                      onChange={(e) => setGstRatePercent(e.target.value)}
                      className="w-24 neu-glass-input rounded-xl px-3 py-1.5 text-stone-900 font-bold text-xs text-right"
                    />
                    <span className="font-extrabold text-stone-700 text-xs">%</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-stone-200/60 text-xs text-stone-600">
                  <span className="font-semibold text-stone-500">Tax Breakdown on Invoices:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-mono text-xs font-bold">
                    CGST @ {(Number(gstRatePercent || 18) / 2).toFixed(1)}%
                  </span>
                  <span>+</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-mono text-xs font-bold">
                    SGST @ {(Number(gstRatePercent || 18) / 2).toFixed(1)}%
                  </span>
                  <span>=</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-extrabold text-xs">
                    Total GST {Number(gstRatePercent || 18).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Media Upload & Storage Quota */}
          <div className="neu-glass-panel p-6 sm:p-7 rounded-3xl space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-stone-200/60">
              <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center shadow-xs">
                <HardDrive className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-stone-900">Media Upload Limits</h3>
                <p className="text-xs text-stone-500">Controls max single file upload size for photos and high-res video clips</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-stone-700 font-bold">Max Single File Upload Size (MB)</label>
                  <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                    {(Number(maxUploadSizeMb) / 1024).toFixed(1)} GB ({maxUploadSizeMb} MB)
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="10240"
                  step="1"
                  value={maxUploadSizeMb}
                  onChange={(e) => setMaxUploadSizeMb(e.target.value)}
                  className="w-full neu-glass-input rounded-2xl px-4 py-2.5 text-stone-900 font-bold"
                />
                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                  {[
                    { label: '500 MB', val: 500 },
                    { label: '1 GB', val: 1024 },
                    { label: '2 GB', val: 2048 },
                    { label: '5 GB', val: 5120 },
                    { label: '10 GB (Max)', val: 10240 },
                  ].map((chip) => (
                    <button
                      key={chip.val}
                      type="button"
                      onClick={() => setMaxUploadSizeMb(chip.val)}
                      className={`text-xs px-3 py-1 rounded-full transition font-semibold cursor-pointer ${
                        Number(maxUploadSizeMb) === chip.val
                          ? 'neu-glass-pill active bg-amber-600 text-white shadow-xs'
                          : 'neu-glass-pill text-stone-700 hover:text-stone-900'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-stone-500 mt-2">
                  Supports up to 10 GB (10,240 MB) for high-framerate 4K video deliveries and raw photo collections.
                </p>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1.5">Storage Quota</label>
                <div className="w-full neu-glass-input rounded-2xl px-4 py-2.5 text-stone-700 font-mono font-bold">
                  100 GB High-Speed Local Storage
                </div>
                <p className="text-[11px] text-stone-500 mt-2">
                  Expandable storage capacity configured in local studio root.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: DRM & Anti-Screenshot Content Protection */}
          <div className="neu-glass-panel p-6 sm:p-7 rounded-3xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                    DRM & Anti-Screenshot Protection
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold uppercase tracking-wider">
                      Enforced & Active
                    </span>
                  </h3>
                  <p className="text-xs text-stone-500">Restricts unauthorized screenshots, screen recordings, printing, and media scraping on client delivery galleries</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="neu-glass-card p-5 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-amber-700 font-extrabold text-xs">
                  <EyeOff className="w-4 h-4 stroke-[2.5]" />
                  <span>Anti-Capture Curtain</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Automatically activates an opaque privacy shield when window focus is lost (Snipping Tool, OBS, Mac shortcuts, or external capture tools).
                </p>
                <div className="pt-2 text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  Active on Client Galleries
                </div>
              </div>

              <div className="neu-glass-card p-5 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-amber-700 font-extrabold text-xs">
                  <Lock className="w-4 h-4 stroke-[2.5]" />
                  <span>Shortcut & API Interception</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Intercepts PrintScreen, Cmd+Shift+3/4/5, Print (Ctrl+P), Save (Ctrl+S), DevTools, and disables getDisplayMedia screen recording.
                </p>
                <div className="pt-2 text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  Clipboard Sanitization Enabled
                </div>
              </div>

              <div className="neu-glass-card p-5 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-amber-700 font-extrabold text-xs">
                  <Shield className="w-4 h-4 stroke-[2.5]" />
                  <span>Full Image Blur Protection</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Fully blurs protected gallery photos with an "Image is Protected" shield to prevent screenshots and unauthorized saving.
                </p>
                <div className="pt-2 text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  Active on Client Galleries
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={updateSettingsMutation.isPending}
              className="neu-glass-btn-primary flex items-center gap-2 px-8 py-3 rounded-2xl text-white font-bold text-xs transition disabled:opacity-50 shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>{updateSettingsMutation.isPending ? 'Saving Changes...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
