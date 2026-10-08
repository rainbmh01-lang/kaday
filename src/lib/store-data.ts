import { supabase } from '@/lib/supabase';
import {
  categories as defaultCategories,
  products as defaultStoreProducts,
  type CatalogLink,
  type Product,
} from '@/data/store';

export const isValidUuid = (val?: string | null): boolean =>
  Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

export interface DbCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
}

// Fetch categories from Supabase with fallback
export async function getDbCategories(): Promise<DbCategory[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
      console.warn('Falling back to static categories:', error?.message);
      return defaultCategories.map((c, idx) => ({
        id: c.slug,
        name: c.label,
        slug: c.slug,
        description: c.sub,
        image_url: '',
        sort_order: idx + 1,
        is_active: true,
      }));
    }

    return data;
  } catch (err) {
    console.error('Error fetching categories:', err);
    return defaultCategories.map((c, idx) => ({
      id: c.slug,
      name: c.label,
      slug: c.slug,
      description: c.sub,
      image_url: '',
      sort_order: idx + 1,
      is_active: true,
    }));
  }
}

// Upload category image to Supabase Storage
export async function uploadCategoryImage(file: File, slug: string): Promise<string> {
  const fileExt = file.name.split('.').pop() || 'png';
  const fileName = `categories/${slug}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('store-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Erreur lors du téléchargement de l'image: ${uploadError.message}`);
  }

  const { data } = supabase.storage
    .from('store-images')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

// Save or Update Category
export async function saveDbCategory(category: Partial<DbCategory>, imageFile?: File): Promise<DbCategory> {
  let imageUrl = category.image_url;

  if (imageFile && category.slug) {
    imageUrl = await uploadCategoryImage(imageFile, category.slug);
  }

  const payload: any = {
    name: category.name,
    slug: category.slug,
    description: category.description || '',
    image_url: imageUrl || null,
    sort_order: category.sort_order ?? 0,
    is_active: category.is_active ?? true,
  };

  const isUuid = category.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category.id);

  if (isUuid) {
    // Has a valid uuid
    const { data, error } = await supabase
      .from('categories')
      .update(payload)
      .eq('id', category.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Try update by slug if exists, or insert new
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', category.slug)
      .maybeSingle();

    if (existing?.id) {
      const { data, error } = await supabase
        .from('categories')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    // Insert new
    const { data, error } = await supabase
      .from('categories')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

// Delete Category
export async function deleteDbCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ---------------- BRANDS ----------------

export interface DbBrand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
}

const defaultBrandsList = [
  'CROWN',
  'INGCO',
  'BEETRO',
  'HONESTPRO',
  'POWERBLU',
  'FIXTOP',
  'DINGQI',
  'MODE PRO',
];

// Fetch brands from Supabase with fallback
export async function getDbBrands(): Promise<DbBrand[]> {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error || !data || data.length === 0) {
      return defaultBrandsList.map((b, idx) => ({
        id: b.toLowerCase(),
        name: b,
        slug: b.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        logo_url: '',
        sort_order: idx + 1,
        is_active: true,
      }));
    }

    return data;
  } catch (err) {
    console.error('Error fetching brands:', err);
    return defaultBrandsList.map((b, idx) => ({
      id: b.toLowerCase(),
      name: b,
      slug: b.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      logo_url: '',
      sort_order: idx + 1,
      is_active: true,
    }));
  }
}

// Upload brand logo to Supabase Storage
export async function uploadBrandLogo(file: File, slug: string): Promise<string> {
  const fileExt = file.name.split('.').pop() || 'png';
  const fileName = `brands/${slug}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('store-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Erreur lors du téléchargement du logo: ${uploadError.message}`);
  }

  const { data } = supabase.storage
    .from('store-images')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

// Save or Update Brand
export async function saveDbBrand(brand: Partial<DbBrand>, logoFile?: File): Promise<DbBrand> {
  let logoUrl = brand.logo_url;

  if (logoFile && brand.slug) {
    logoUrl = await uploadBrandLogo(logoFile, brand.slug);
  }

  const payload: any = {
    name: brand.name,
    slug: brand.slug,
    description: brand.description || '',
    logo_url: logoUrl || null,
    sort_order: brand.sort_order ?? 0,
    is_active: brand.is_active ?? true,
  };

  const isUuid = brand.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(brand.id);

  if (isUuid) {
    const { data, error } = await supabase
      .from('brands')
      .update(payload)
      .eq('id', brand.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Try update by slug if exists, or insert new
    const { data: existing } = await supabase
      .from('brands')
      .select('id')
      .eq('slug', brand.slug)
      .maybeSingle();

    if (existing?.id) {
      const { data, error } = await supabase
        .from('brands')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const { data, error } = await supabase
      .from('brands')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

// Delete Brand
export async function deleteDbBrand(id: string): Promise<void> {
  const { error } = await supabase
    .from('brands')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ---------------- PRODUCT TYPES ----------------

export interface DbProductType {
  id: string;
  name: string;
  slug: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
}

export const defaultProductTypesList: { name: string; slug: string; image_url?: string }[] = [
  { name: 'Perceuse', slug: 'perceuse', image_url: '/images/prod-12.webp' },
  { name: 'Visseuse', slug: 'visseuse', image_url: '/images/prod-2.webp' },
  { name: 'Meuleuse', slug: 'meuleuse', image_url: '/images/prod-8.webp' },
  { name: 'Niveau laser', slug: 'niveau-laser', image_url: '/images/prod-3.webp' },
  { name: 'Pompe à eau', slug: 'pompe-a-eau', image_url: '/images/prod-10.webp' },
  { name: 'Chaussures de sécurité', slug: 'chaussures-de-securite', image_url: '' },
  { name: 'Poste à souder', slug: 'poste-a-souder', image_url: '/images/prod-5.webp' },
  { name: 'Compresseur', slug: 'compresseur', image_url: '/images/prod-7.webp' },
  { name: 'Palan & levage', slug: 'palan-levage', image_url: '/images/prod-1.webp' },
  { name: 'Diagnostic auto', slug: 'diagnostic-auto', image_url: '/images/prod-9.webp' },
  { name: 'Éclairage', slug: 'eclairage', image_url: '/images/prod-4.webp' },
  { name: 'Multimètre & mesure', slug: 'multimetre-mesure', image_url: '/images/prod-6.webp' },
  { name: 'Plomberie & tuyauterie', slug: 'plomberie-tuyauterie', image_url: '' },
];

export async function getDbProductTypes(): Promise<DbProductType[]> {
  let localData: DbProductType[] = [];
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('kadya_product_types') : null;
    if (raw) {
      localData = JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading local product types:', e);
  }

  try {
    const { data, error } = await supabase
      .from('product_types')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (err) {
    // Supabase table may not exist yet, fallback gracefully
  }

  if (localData.length > 0) {
    return localData;
  }

  const initial: DbProductType[] = defaultProductTypesList.map((t, idx) => ({
    id: t.slug,
    name: t.name,
    slug: t.slug,
    image_url: t.image_url || '',
    sort_order: idx + 1,
    is_active: true,
  }));

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('kadya_product_types', JSON.stringify(initial));
    } catch (e) {}
  }

  return initial;
}

export async function uploadProductTypeImage(file: File, slug: string): Promise<string> {
  const fileExt = file.name.split('.').pop() || 'png';
  const fileName = `types/${slug}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('store-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Erreur lors du téléchargement de l'image: ${uploadError.message}`);
  }

  const { data } = supabase.storage
    .from('store-images')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

export async function saveDbProductType(
  typeData: Partial<DbProductType>,
  imageFile?: File
): Promise<DbProductType> {
  let imageUrl = typeData.image_url;
  const slug = typeData.slug || typeData.name?.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') || 'type';

  if (imageFile) {
    imageUrl = await uploadProductTypeImage(imageFile, slug);
  }

  const item: DbProductType = {
    id: typeData.id || slug,
    name: typeData.name || '',
    slug,
    image_url: imageUrl || '',
    sort_order: typeData.sort_order ?? 0,
    is_active: typeData.is_active ?? true,
  };

  try {
    const isUuid = isValidUuid(item.id);
    if (isUuid) {
      const { data, error } = await supabase
        .from('product_types')
        .update({
          name: item.name,
          slug: item.slug,
          image_url: item.image_url,
          sort_order: item.sort_order,
          is_active: item.is_active,
        })
        .eq('id', item.id)
        .select()
        .single();
      if (!error && data) return data;
    } else {
      const { data, error } = await supabase
        .from('product_types')
        .upsert(
          {
            name: item.name,
            slug: item.slug,
            image_url: item.image_url,
            sort_order: item.sort_order,
            is_active: item.is_active,
          },
          { onConflict: 'slug' }
        )
        .select()
        .single();
      if (!error && data) return data;
    }
  } catch (e) {
    // Graceful fallback to localStorage
  }

  if (typeof window !== 'undefined') {
    try {
      const existing = await getDbProductTypes();
      const updated = existing.filter((t) => t.slug !== item.slug && t.id !== item.id);
      updated.push(item);
      localStorage.setItem('kadya_product_types', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  }

  return item;
}

export async function deleteDbProductType(idOrSlug: string): Promise<void> {
  try {
    await supabase.from('product_types').delete().or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`);
  } catch (e) {
    // Ignore error
  }

  if (typeof window !== 'undefined') {
    try {
      const existing = await getDbProductTypes();
      const updated = existing.filter((t) => t.slug !== idOrSlug && t.id !== idOrSlug);
      localStorage.setItem('kadya_product_types', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  }
}

// ---------------- PRODUCTS ----------------

export interface DbProduct {
  id: string;
  name: string;
  slug: string;
  summary?: string;
  brand?: string;
  brand_name?: string;
  category_slug?: string;
  product_type?: string;
  price: number;
  old_price?: number;
  tech_summary?: string;
  specs: string[];
  images: string[];
  is_active: boolean;
  in_stock: boolean;
  sort_order?: number;
  created_at?: string;
}

export function inferProductType(name?: string, categorySlug?: string): string {
  if (!name) return '';
  const n = name.toLowerCase();
  if (n.includes('perceuse') || n.includes('مثقاب') || n.includes('perforateur')) return 'Perceuse';
  if (n.includes('visseuse') || n.includes('مفك')) return 'Visseuse';
  if (n.includes('meuleuse') || n.includes('صاروخ') || n.includes('جلاخة')) return 'Meuleuse';
  if (n.includes('laser') || n.includes('ليزر')) return 'Niveau laser';
  if (n.includes('palan') || n.includes('رافعة') || n.includes('treuil')) return 'Palan & levage';
  if (n.includes('multimètre') || n.includes('متعدد') || n.includes('testeur')) return 'Multimètre & mesure';
  if (n.includes('souder') || n.includes('لحام') || n.includes('inverter')) return 'Poste à souder';
  if (n.includes('compresseur') || n.includes('ضاغط')) return 'Compresseur';
  if (n.includes('pompe') || n.includes('مضخة')) return 'Pompe à eau';
  if (n.includes('projecteur') || n.includes('كشاف') || n.includes('led')) return 'Éclairage';
  if (n.includes('chaussure') || n.includes('حذاء') || n.includes('أحذية') || n.includes('bottes')) return 'Chaussures de sécurité';
  if (n.includes('diagnostic') || n.includes('obd') || n.includes('فحص')) return 'Diagnostic auto';
  if (categorySlug === 'plombier' || n.includes('plombier') || n.includes('سباكة')) return 'Plomberie & tuyauterie';
  return '';
}

// Fetch products from Supabase with fallback to default store products
export async function getDbProducts(includeInactive = false): Promise<DbProduct[]> {
  try {
    let query = supabase
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    if (data && data.length > 0) {
      return data.map((p: any) => ({
        ...p,
        brand: p.brand || '',
        brand_name: p.brand || '',
        category_slug: p.category_slug || '',
        product_type: p.product_type || inferProductType(p.name, p.category_slug),
        specs: Array.isArray(p.specs) ? p.specs : [],
        images: Array.isArray(p.images) ? p.images : [],
        price: Number(p.price) || 0,
        old_price: p.old_price ? Number(p.old_price) : undefined,
      }));
    }

    // Fallback: If database currently has 0 products, return default store products
    // so they are visible and manageable right away!
    return defaultStoreProducts.map((p, idx) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      summary: p.summary,
      brand: p.brand,
      brand_name: p.brand,
      category_slug: p.category,
      price: p.price,
      old_price: p.oldPrice,
      tech_summary: p.summary,
      specs: p.specs || [],
      images: p.imageUrl ? [p.imageUrl] : [],
      is_active: true,
      in_stock: p.stock === 'En stock',
      sort_order: idx + 1,
    }));
  } catch (err) {
    console.error('Error in getDbProducts:', err);
    return [];
  }
}

// Seed initial products into Supabase
export async function seedInitialProducts(): Promise<DbProduct[]> {
  const payloads = defaultStoreProducts.map((p, idx) => ({
    name: p.name,
    slug: p.slug,
    summary: p.summary || '',
    brand: p.brand,
    category_slug: p.category,
    price: p.price,
    old_price: p.oldPrice || null,
    in_stock: p.stock === 'En stock',
    images: p.imageUrl ? [p.imageUrl] : [],
    tech_summary: p.summary || '',
    specs: p.specs || [],
    is_active: true,
    sort_order: idx + 1,
  }));

  const { data, error } = await supabase
    .from('products')
    .upsert(payloads, { onConflict: 'slug' })
    .select();

  if (error) throw error;
  return (data || []).map((p: any) => ({
    ...p,
    brand: p.brand || '',
    brand_name: p.brand || '',
    specs: Array.isArray(p.specs) ? p.specs : [],
    images: Array.isArray(p.images) ? p.images : [],
    price: Number(p.price) || 0,
    old_price: p.old_price ? Number(p.old_price) : undefined,
  }));
}

// Upload product image to Supabase Storage
export async function uploadProductImage(file: File, slug: string, index: number): Promise<string> {
  const fileExt = file.name.split('.').pop() || 'png';
  const fileName = `products/${slug}-${index}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('store-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Erreur lors du téléchargement de l'image: ${uploadError.message}`);
  }

  const { data } = supabase.storage
    .from('store-images')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

// Save or update product (Strictly matching Postgres schema columns)
export async function saveDbProduct(product: Partial<DbProduct>): Promise<DbProduct> {
  const brandVal = product.brand || product.brand_name || '';

  const payload: any = {
    name: product.name,
    slug: product.slug,
    summary: product.summary || '',
    brand: brandVal || null,
    category_slug: product.category_slug || null,
    price: Number(product.price) || 0,
    old_price: product.old_price ? Number(product.old_price) : null,
    in_stock: product.in_stock ?? true,
    images: Array.isArray(product.images) ? product.images.slice(0, 5) : [],
    tech_summary: product.tech_summary || '',
    specs: Array.isArray(product.specs) ? product.specs.slice(0, 10) : [],
    is_active: product.is_active ?? true,
    sort_order: product.sort_order ?? 0,
  };

  if (product.product_type !== undefined) {
    payload.product_type = product.product_type || null;
  }

  const executeSave = async (dataPayload: any) => {
    const isUuid = isValidUuid(product.id);
    if (isUuid) {
      const { data, error } = await supabase
        .from('products')
        .update(dataPayload)
        .eq('id', product.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('slug', product.slug)
        .maybeSingle();

      if (existing?.id) {
        const { data, error } = await supabase
          .from('products')
          .update(dataPayload)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }

      const { data, error } = await supabase
        .from('products')
        .insert([dataPayload])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  };

  try {
    const saved = await executeSave(payload);
    return {
      ...saved,
      brand_name: saved.brand,
      product_type: saved.product_type || product.product_type || inferProductType(saved.name, saved.category_slug),
      specs: Array.isArray(saved.specs) ? saved.specs : [],
      images: Array.isArray(saved.images) ? saved.images : [],
    };
  } catch (err: any) {
    // If column product_type does not exist yet in Supabase, retry without it
    if (err?.message?.includes('product_type') && payload.product_type !== undefined) {
      console.warn('Column product_type does not exist in Supabase yet. Saving without it.');
      delete payload.product_type;
      const saved = await executeSave(payload);
      return {
        ...saved,
        brand_name: saved.brand,
        product_type: product.product_type || inferProductType(saved.name, saved.category_slug),
        specs: Array.isArray(saved.specs) ? saved.specs : [],
        images: Array.isArray(saved.images) ? saved.images : [],
      };
    }
    throw err;
  }
}

// Delete product
export async function deleteDbProduct(id: string): Promise<void> {
  const isUuid = isValidUuid(id);
  if (isUuid) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } else {
    // Try delete by slug if id was slug
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('slug', id);

    if (error) throw error;
  }
}
