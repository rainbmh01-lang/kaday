import { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  Lock,
  MapPin,
  Phone,
  ShieldCheck,
  Truck,
  UserRound,
} from 'lucide-react';
import { formatDzd } from '@/data/store';
import { trackPurchase, trackLead } from '@/lib/meta-tracker';
import { saveOrder } from '@/lib/orders';
import wilayasData from '../../data/wilayas.json';

export type Wilaya = {
  id: number;
  code: string;
  nameAr: string;
  nameFr: string;
  deskPrice: number;
  homePrice: number;
  isActive: boolean;
};

const wilayas = wilayasData as Wilaya[];
const getWilaya = (code?: string) => wilayas.find((w) => w.code === code);

export type LeadFormData = {
  fullName: string;
  phone: string;
  wilayaCode: string;
  deliveryType: 'desk' | 'home';
};

interface LeadFormProps {
  productName?: string;
  unitPrice: number;
  initialQuantity?: number;
  onSuccess?: () => void;
  className?: string;
}

export function LeadForm({
  productName,
  unitPrice,
  initialQuantity = 1,
  onSuccess,
  className = '',
}: LeadFormProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [wilayaCode, setWilayaCode] = useState('16'); // Alger
  const [deliveryType, setDeliveryType] = useState<'desk' | 'home'>('desk');
  const [quantity, setQuantity] = useState(initialQuantity);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const validatePhone = (val: string): string => {
    const cleaned = val.replace(/\D/g, '');
    if (!cleaned) {
      return 'يرجى إدخال رقم الهاتف';
    }
    if (!/^0[567]/.test(cleaned)) {
      return 'رقم غير صحيح: يجب أن يبدأ بـ 05 أو 06 أو 07';
    }
    if (cleaned.length !== 10) {
      return `يجب أن يتكون رقم الهاتف من 10 أرقام تماماً (أدخلت ${cleaned.length} أرقام)`;
    }
    return '';
  };

  const selectedWilaya = getWilaya(wilayaCode) || wilayas[15];
  const shippingPrice =
    deliveryType === 'desk' ? selectedWilaya.deskPrice : selectedWilaya.homePrice;
  const subtotal = unitPrice * quantity;
  const total = subtotal + shippingPrice;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('يرجى إدخال الاسم الكامل');
      return;
    }

    const pErr = validatePhone(phone);
    if (pErr) {
      setPhoneError(pErr);
      setPhone('');
      return;
    }

    setError('');
    setPhoneError('');
    setSubmitted(true);

    // Save order locally and sync to Google Sheet
    const newOrder = saveOrder({
      fullName: fullName.trim(),
      phone: phone.trim(),
      wilaya: `${selectedWilaya.code} - ${selectedWilaya.nameAr}`,
      deliveryType,
      productName: productName || 'Commande KADYA DZ',
      quantity,
      total,
    });

    // Track Meta Purchase & Lead events (Browser Pixel + CAPI)
    trackPurchase({
      fullName: fullName.trim(),
      phone: phone.trim(),
      wilaya: `${selectedWilaya.code} - ${selectedWilaya.nameAr}`,
      productName: productName || 'Commande KADYA DZ',
      total,
      orderId: newOrder.id,
    });
    trackLead({
      fullName: fullName.trim(),
      phone: phone.trim(),
      wilaya: `${selectedWilaya.code} - ${selectedWilaya.nameAr}`,
      total,
    });

    if (onSuccess) onSuccess();
  };

  if (submitted) {
    return (
      <div
        className={`rounded-2xl border-2 border-[var(--ed-yellow)] bg-white p-6 text-center shadow-lg md:p-8 ${className}`}
      >
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 size={36} />
        </div>
        <div className="mt-4 inline-block rounded-full bg-[var(--ed-yellow)]/20 px-3 py-1 text-xs font-bold text-[var(--ed-ink)]">
          تم تسجيل طلبك بنجاح · Commande confirmée
        </div>
        <h3 className="mt-3 text-2xl font-black text-[var(--ed-ink)] md:text-3xl">
          شكراً لك، سنتصل بك قريباً
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">
          سيقوم فريق خدمة العملاء بالتواصل معك هاتفياً على الرقم{' '}
          <strong className="text-[var(--ed-ink)]">{phone}</strong> لتأكيد العنوان
          ومعلومات الشحن قبل الإرسال.
        </p>

        <div className="mt-6 rounded-xl border border-[var(--ed-line)] bg-[#faf9f6] p-4 text-xs sm:text-sm text-slate-600">
          <div className="flex justify-between py-1.5">
            <span>المنتج المطلوب:</span>
            <span className="font-bold text-[var(--ed-ink)]">
              {productName || 'منتج من الورشة'}
            </span>
          </div>
          <div className="flex justify-between py-1.5">
            <span>عنوان التوصيل:</span>
            <span className="font-bold text-[var(--ed-ink)]">
              {selectedWilaya.code} - {selectedWilaya.nameAr} ({deliveryType === 'desk' ? 'استلام من المكتب' : 'توصيل للمنزل'})
            </span>
          </div>
          <div className="mt-2 flex justify-between border-t border-[var(--ed-line)] pt-2 text-base font-black text-[var(--ed-ink)]">
            <span>المبلغ المستحق عند الاستلام:</span>
            <span className="text-[var(--ed-rust)]">{formatDzd(total)}</span>
          </div>
        </div>

        <button
          onClick={() => setSubmitted(false)}
          className="mt-6 inline-flex rounded-xl bg-[var(--ed-ink)] px-6 py-3 text-sm font-bold text-white transition-all hover:bg-[var(--ed-yellow)] hover:text-[var(--ed-ink)] shadow-sm"
        >
          طلب منتج آخر
        </button>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className={`rounded-2xl border border-[var(--ed-line)] bg-white p-5 sm:p-7 shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="border-b border-[var(--ed-line)] pb-5 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--ed-yellow)]/20 px-3.5 py-1 text-xs font-bold text-[var(--ed-ink)]">
          <ShieldCheck size={15} className="text-emerald-700" />
          <span>الدفع عند الاستلام · Paiement à la livraison</span>
        </div>
        <h2 className="mt-3 text-xl sm:text-2xl font-black text-[var(--ed-ink)]">
          أضف معلوماتك في الأسفل للطلب
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
          المرجو إدخال معلوماتك الشخصية لتأكيد إرسال الشحنة
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">
            {error}
          </div>
        )}

        {/* Full Name */}
        <div>
          <label className="mb-1.5 flex items-center justify-between text-xs sm:text-sm font-bold text-[var(--ed-ink)]">
            <span>الاسم واللقب / Prénom & Nom</span>
            <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center overflow-hidden rounded-xl border border-[var(--ed-line)] bg-[#faf9f6] transition-all focus-within:border-[var(--ed-ink)] focus-within:bg-white focus-within:ring-2 focus-within:ring-[var(--ed-yellow)]/40">
            <div className="flex h-11 w-11 items-center justify-center border-l border-[var(--ed-line)] bg-black/[0.03] text-[var(--ed-rust)] shrink-0">
              <UserRound size={18} />
            </div>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="الإسم و اللقب"
              className="w-full bg-transparent px-3.5 py-2.5 text-sm font-medium text-[var(--ed-ink)] outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="mb-1.5 flex items-center justify-between text-xs sm:text-sm font-bold text-[var(--ed-ink)]">
            <span>رقم الهاتف / Téléphone (10 أرقام)</span>
            <span className="text-rose-500">*</span>
          </label>
          <div
            className={`flex items-center overflow-hidden rounded-xl border transition-all ${
              phoneError
                ? 'border-rose-500 bg-rose-50/50 ring-2 ring-rose-200'
                : 'border-[var(--ed-line)] bg-[#faf9f6] focus-within:border-[var(--ed-ink)] focus-within:bg-white focus-within:ring-2 focus-within:ring-[var(--ed-yellow)]/40'
            }`}
          >
            <div
              className={`flex h-11 w-11 items-center justify-center border-l bg-black/[0.03] shrink-0 ${
                phoneError ? 'border-rose-200 text-rose-600' : 'border-[var(--ed-line)] text-[var(--ed-rust)]'
              }`}
            >
              <Phone size={18} />
            </div>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={10}
              autoComplete="tel"
              required
              dir="ltr"
              value={phone}
              onChange={(e) => {
                let digits = e.target.value.replace(/\D/g, '');
                if (digits.startsWith('213') && digits.length > 3) {
                  digits = '0' + digits.slice(3);
                }
                digits = digits.slice(0, 10);
                setPhone(digits);
                if (phoneError) setPhoneError('');
              }}
              onBlur={() => {
                if (phone.length > 0) {
                  const err = validatePhone(phone);
                  if (err) {
                    setPhoneError(err);
                    setPhone('');
                  }
                }
              }}
              placeholder={phoneError ? 'أعد إدخال 10 أرقام تبدأ بـ 05 / 06 / 07' : '05 / 06 / 07 XX XX XX XX'}
              className="w-full bg-transparent px-3.5 py-2.5 text-sm font-medium text-[var(--ed-ink)] outline-none text-left placeholder:text-right placeholder:text-slate-400"
            />
          </div>
          {phoneError && (
            <p className="mt-1.5 text-xs font-bold text-rose-600 flex items-center gap-1">
              ⚠️ {phoneError}
            </p>
          )}
        </div>

        {/* Wilaya Selection */}
        <div>
          <label className="mb-1.5 flex items-center justify-between text-xs sm:text-sm font-bold text-[var(--ed-ink)]">
            <span>الولاية / Wilaya</span>
            <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center overflow-hidden rounded-xl border border-[var(--ed-line)] bg-[#faf9f6] transition-all focus-within:border-[var(--ed-ink)] focus-within:bg-white focus-within:ring-2 focus-within:ring-[var(--ed-yellow)]/40">
            <div className="flex h-11 w-11 items-center justify-center border-l border-[var(--ed-line)] bg-black/[0.03] text-[var(--ed-rust)] shrink-0">
              <MapPin size={18} />
            </div>
            <select
              value={wilayaCode}
              onChange={(e) => setWilayaCode(e.target.value)}
              className="w-full appearance-none bg-transparent px-3.5 py-2.5 text-sm font-medium text-[var(--ed-ink)] outline-none cursor-pointer"
            >
              {wilayas.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.code} - {w.nameAr} ({w.nameFr})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <ChevronDown size={17} />
            </div>
          </div>
        </div>

        {/* Delivery Options - 2 side-by-side cards */}
        <div className="pt-1">
          <label className="mb-2 block text-xs sm:text-sm font-bold text-[var(--ed-ink)]">
            خيارات التوصيل / Options de livraison
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* المكتب / Stop Desk */}
            <button
              type="button"
              onClick={() => setDeliveryType('desk')}
              className={`relative flex flex-col justify-between rounded-xl border-2 p-3 sm:p-4 text-right transition-all cursor-pointer ${
                deliveryType === 'desk'
                  ? 'border-[var(--ed-ink)] bg-[#f7f5ef] shadow-xs'
                  : 'border-[var(--ed-line)] bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[var(--ed-ink)]">
                  <Building2 size={16} className="text-[var(--ed-rust)]" />
                  المكتب
                </span>
                <span
                  className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    deliveryType === 'desk'
                      ? 'border-[var(--ed-ink)] bg-[var(--ed-ink)]'
                      : 'border-slate-300'
                  }`}
                >
                  {deliveryType === 'desk' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline">
                <span className="text-sm sm:text-base font-extrabold text-[var(--ed-ink)]">
                  {formatDzd(selectedWilaya.deskPrice)}
                </span>
              </div>
            </button>

            {/* المنزل / Domicile */}
            <button
              type="button"
              onClick={() => setDeliveryType('home')}
              className={`relative flex flex-col justify-between rounded-xl border-2 p-3 sm:p-4 text-right transition-all cursor-pointer ${
                deliveryType === 'home'
                  ? 'border-[var(--ed-ink)] bg-[#f7f5ef] shadow-xs'
                  : 'border-[var(--ed-line)] bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[var(--ed-ink)]">
                  <Truck size={16} className="text-[var(--ed-rust)]" />
                  المنزل
                </span>
                <span
                  className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    deliveryType === 'home'
                      ? 'border-[var(--ed-ink)] bg-[var(--ed-ink)]'
                      : 'border-slate-300'
                  }`}
                >
                  {deliveryType === 'home' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline">
                <span className="text-sm sm:text-base font-extrabold text-[var(--ed-ink)]">
                  {formatDzd(selectedWilaya.homePrice)}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-xl border border-[var(--ed-line)] bg-[#faf9f6] p-3.5 sm:p-4 space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between text-slate-600">
            <span>سعر المنتج:</span>
            <span className="font-bold text-[var(--ed-ink)]">{formatDzd(subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>تكلفة الشحن ({deliveryType === 'desk' ? 'توصيل للمكتب' : 'توصيل للمنزل'}):</span>
            <span className="font-bold text-emerald-700">{formatDzd(shippingPrice)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-[var(--ed-line)] pt-2.5 text-sm sm:text-base font-black text-[var(--ed-ink)]">
            <span>المجموع الإجمالي للدفع:</span>
            <span className="text-lg sm:text-xl font-black text-[var(--ed-rust)]">
              {formatDzd(total)}
            </span>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--ed-yellow)] px-5 py-4 text-base font-black text-[var(--ed-ink)] shadow-md transition-all hover:bg-[var(--ed-ink)] hover:text-white active:scale-[0.99] cursor-pointer"
        >
          <Lock size={18} className="transition-transform group-hover:scale-110" />
          <span>اضغط هنا لتأكيد الطلب الآن</span>
        </button>

        {/* Trust badge */}
        <div className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 py-2 px-3 text-[11px] sm:text-xs font-semibold text-emerald-800 border border-emerald-200/50">
          <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
          <span>ضمان الدفع عند الاستلام بعد معاينة وفحص طردك</span>
        </div>
      </form>
    </div>
  );
}
