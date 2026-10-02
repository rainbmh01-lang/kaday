/**
 * Meta Pixel & Conversions API (CAPI) client integration
 * Deduplicates events between Browser Pixel and Server CAPI via matching eventID.
 */

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : undefined;
}

export function getMetaCookies(): { fbp?: string; fbc?: string } {
  if (typeof window === 'undefined') return {};

  const fbp = getCookie('_fbp');
  let fbc = getCookie('_fbc');

  if (!fbc && window.location.search) {
    const params = new URLSearchParams(window.location.search);
    const fbclid = params.get('fbclid');
    if (fbclid) {
      fbc = `fb.1.${Date.now()}.${fbclid}`;
    }
  }

  return { fbp, fbc };
}

export interface MetaEventUserData {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  country?: string;
  fbp?: string;
  fbc?: string;
}

export interface MetaEventCustomData {
  currency?: string;
  value?: number;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  contents?: Array<{ id: string; quantity: number; item_price: number }>;
  num_items?: number;
  [key: string]: any;
}

export async function sendMetaEvent(
  eventName: string,
  customData: MetaEventCustomData = {},
  userData: MetaEventUserData = {},
  customEventId?: string,
): Promise<string> {
  const eventId = customEventId || generateEventId();
  const eventTime = Math.floor(Date.now() / 1000);
  const eventSourceUrl = typeof window !== 'undefined' ? window.location.href : '';
  const { fbp, fbc } = getMetaCookies();

  const finalUserData: MetaEventUserData = {
    ...userData,
    fbp: userData.fbp || fbp,
    fbc: userData.fbc || fbc,
  };

  // 1. Browser Meta Pixel
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    try {
      window.fbq('track', eventName, customData, { eventID: eventId });
    } catch (err) {
      console.warn('[Meta Pixel] track failed:', err);
    }
  }

  // 2. Server-side Conversions API (CAPI)
  try {
    const testEventCode =
      (import.meta.env?.VITE_META_TEST_EVENT_CODE as string) || undefined;

    fetch('/api/capi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventName,
        eventId,
        eventTime,
        eventSourceUrl,
        userData: {
          ...finalUserData,
          client_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        },
        customData,
        testEventCode,
      }),
    }).catch((err) => {
      console.warn('[Meta CAPI] POST /api/capi error:', err);
    });
  } catch (err) {
    console.warn('[Meta CAPI] Dispatch exception:', err);
  }

  return eventId;
}

// Convenience helpers
export function trackPageView(url?: string) {
  return sendMetaEvent('PageView', {}, {}, undefined);
}

export function trackViewContent(item: {
  id: string;
  name: string;
  price: number;
  categoryLabel?: string;
}) {
  return sendMetaEvent('ViewContent', {
    content_name: item.name,
    content_category: item.categoryLabel,
    content_ids: [item.id],
    content_type: 'product',
    value: item.price,
    currency: 'DZD',
  });
}

export function trackAddToCart(item: { id: string; name: string; price: number }, quantity = 1) {
  return sendMetaEvent('AddToCart', {
    content_name: item.name,
    content_ids: [item.id],
    content_type: 'product',
    value: item.price * quantity,
    currency: 'DZD',
    num_items: quantity,
  });
}

export function trackInitiateCheckout(items: Array<{ product: { id: string; name: string; price: number }; quantity: number }>, total: number) {
  return sendMetaEvent('InitiateCheckout', {
    content_type: 'product',
    content_ids: items.map((i) => i.product.id),
    contents: items.map((i) => ({
      id: i.product.id,
      quantity: i.quantity,
      item_price: i.product.price,
    })),
    num_items: items.reduce((sum, i) => sum + i.quantity, 0),
    value: total,
    currency: 'DZD',
  });
}

export function trackPurchase(data: {
  fullName: string;
  phone: string;
  wilaya?: string;
  productName?: string;
  total: number;
  orderId?: string;
}) {
  const eventId = data.orderId || generateEventId();
  return sendMetaEvent(
    'Purchase',
    {
      content_name: data.productName || 'Commande KADYA DZ',
      value: data.total,
      currency: 'DZD',
      content_type: 'product',
    },
    {
      fullName: data.fullName,
      phone: data.phone,
      state: data.wilaya,
      country: 'dz',
    },
    eventId,
  );
}

export function trackLead(data: {
  fullName: string;
  phone: string;
  wilaya?: string;
  total?: number;
}) {
  return sendMetaEvent(
    'Lead',
    {
      value: data.total,
      currency: 'DZD',
    },
    {
      fullName: data.fullName,
      phone: data.phone,
      state: data.wilaya,
      country: 'dz',
    },
  );
}
