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
