import { supabase } from '@/lib/supabase';
import { categories as defaultCategories, type CatalogLink } from '@/data/store';

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

// ---------------- PRODUCTS ----------------

export interface DbProduct {
  id: string;
  name: string;
  slug: string;
  summary?: string;
  brand_id?: string;
  category_id?: string;
  brand_name?: string;
  category_slug?: string;
  price: number;
  old_price?: number;
  tech_summary?: string;
  specs: string[];
  images: string[];
  is_active: boolean;
  in_stock: boolean;
  created_at?: string;
  updated_at?: string;
}

// Fetch products from Supabase
export async function getDbProducts(includeInactive = false): Promise<DbProduct[]> {
  try {
    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }
    return (data || []).map((p: any) => ({
      ...p,
      specs: Array.isArray(p.specs) ? p.specs : [],
      images: Array.isArray(p.images) ? p.images : [],
      price: Number(p.price) || 0,
      old_price: p.old_price ? Number(p.old_price) : undefined,
    }));
  } catch (err) {
    console.error('Error in getDbProducts:', err);
    return [];
  }
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

// Save or update product
export async function saveDbProduct(product: Partial<DbProduct>): Promise<DbProduct> {
  const payload: any = {
    name: product.name,
    slug: product.slug,
    summary: product.summary || '',
    brand_id: product.brand_id || null,
    category_id: product.category_id || null,
    brand_name: product.brand_name || null,
    category_slug: product.category_slug || null,
    price: Number(product.price) || 0,
    old_price: product.old_price ? Number(product.old_price) : null,
    tech_summary: product.tech_summary || '',
    specs: Array.isArray(product.specs) ? product.specs.slice(0, 10) : [],
    images: Array.isArray(product.images) ? product.images.slice(0, 5) : [],
    is_active: product.is_active ?? true,
    in_stock: product.in_stock ?? true,
    updated_at: new Date().toISOString(),
  };

  const isUuid = product.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(product.id);

  if (isUuid) {
    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', product.id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      specs: Array.isArray(data.specs) ? data.specs : [],
      images: Array.isArray(data.images) ? data.images : [],
    };
  } else {
    // Check if exists by slug
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('slug', product.slug)
      .maybeSingle();

    if (existing?.id) {
      const { data, error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return {
        ...data,
        specs: Array.isArray(data.specs) ? data.specs : [],
        images: Array.isArray(data.images) ? data.images : [],
      };
    }

    // Insert new
    const { data, error } = await supabase
      .from('products')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      specs: Array.isArray(data.specs) ? data.specs : [],
      images: Array.isArray(data.images) ? data.images : [],
    };
  }
}

// Delete product
export async function deleteDbProduct(id: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
