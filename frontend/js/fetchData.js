const API_URL = "";
import { fetchWithAuth } from './auth.js';

/* ===================== Exhibitions ===================== */

/**
 * Get exhibitions, optionally filtered by subcategory and paginated.
 */
export async function fetchExhibitions(subcategoryId, page, limit) {
  try {
    const qs = new URLSearchParams();
    if (subcategoryId) qs.set('subcategory', subcategoryId);
    if (page !== undefined) qs.set('page', page);
    if (limit !== undefined) qs.set('limit', limit);
    const res = await fetch(`/api/exhibitions${qs.toString() ? `?${qs}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch exhibitions');
    const data = await res.json();
    return Array.isArray(data)
      ? { items: data, total: data.length, page: 0, pages: 1, hasMore: false }
      : data;
  } catch (e) {
    console.error('Error fetching exhibitions:', e);
    throw e;
  }
}

/**
 * Create a new exhibition.
 */
export async function addExhibition(payload) {
  const res = await fetchWithAuth('/api/exhibitions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to add exhibition');
  return await res.json();
}

/**
 * Update an existing exhibition by ID.
 */
export async function updateExhibition(id, payload) {
  const res = await fetchWithAuth(`/api/exhibitions/${id}`, {
    method: 'PUT',
    body: payload
  });
  if (!res.ok) throw new Error('Failed to update exhibition');
  return await res.json();
}

/**
 * Delete an exhibition by ID.
 */
export async function deleteExhibition(id) {
  const res = await fetchWithAuth(`/api/exhibitions/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete exhibition');
  return await res.json();
}

/* ===================== Links ===================== */

/**
 * Get links, optionally filtered by subcategory and paginated.
 */
export async function fetchLinks(subcategoryId, page, limit) {
  try {
    const qs = new URLSearchParams();
    if (subcategoryId) qs.set('subcategory', subcategoryId);
    if (page !== undefined) qs.set('page', page);
    if (limit !== undefined) qs.set('limit', limit);
    const res = await fetch(`/api/links${qs.toString() ? `?${qs}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch links');
    const data = await res.json();
    return Array.isArray(data)
      ? { items: data, total: data.length, page: 0, pages: 1, hasMore: false }
      : data;
  } catch (e) {
    console.error('Error fetching links:', e);
    throw e;
  }
}

/**
 * Create a new link.
 */
export async function addLink(payload) {
  const res = await fetchWithAuth('/api/links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to add link');
  return await res.json();
}

/**
 * Update an existing link by ID.
 */
export async function updateLink(id, payload) {
  const res = await fetchWithAuth(`/api/links/${id}`, { method: 'PUT', body: payload });
  if (!res.ok) throw new Error('Failed to update link');
  return await res.json();
}

/**
 * Delete a link by ID.
 */
export async function deleteLink(id) {
  const res = await fetchWithAuth(`/api/links/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete link');
  return await res.json();
}

/* ===================== Categories ===================== */

/**
 * Get all categories.
 */
export async function fetchCategories() {
  const res = await fetch('/api/categories');
  if (!res.ok) throw new Error('Failed to fetch categories');
  return await res.json();
}

/**
 * Create a new category.
 */
export async function addCategory(payload) {
  const res = await fetchWithAuth('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to add category');
  return await res.json();
}

/**
 * Update an existing category.
 */
export async function updateCategory(id, payload) {
  const res = await fetchWithAuth(`/api/categories/${id}`, { method: 'PUT', body: payload });
  if (!res.ok) throw new Error('Failed to update category');
  return await res.json();
}

/**
 * Delete a category by ID.
 */
export async function deleteCategory(id) {
  const res = await fetchWithAuth(`/api/categories/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete category');
  return await res.json();
}

/* ===================== Subcategories ===================== */

/**
 * Get all subcategories of a given category.
 */
export async function fetchSubcategories(categoryId) {
  if (!categoryId) return [];
  const res = await fetch(`/api/categories/${categoryId}/subcategories`);
  if (!res.ok) throw new Error('Failed to fetch subcategories');
  return await res.json();
}

/**
 * Create a new subcategory under a category.
 */
export async function addSubcategory(categoryId, payload) {
  const res = await fetchWithAuth(`/api/categories/${categoryId}/subcategories`, {
    method: 'POST',
    body: payload
  });
  if (!res.ok) throw new Error('Failed to add subcategory');
  return await res.json();
}

/**
 * Update a subcategory by ID.
 */
export async function updateSubcategory(id, payload) {
  const res = await fetchWithAuth(`/api/categories/subcategories/${id}`, {
    method: 'PUT',
    body: payload
  });
  if (!res.ok) throw new Error('Failed to update subcategory');
  return await res.json();
}

/**
 * Delete a subcategory by ID.
 */
export async function deleteSubcategory(id) {
  const res = await fetchWithAuth(`/api/categories/subcategories/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete subcategory');
  return await res.json();
}

/* ===================== Biography ===================== */

/**
 * Get biography content for a specific subcategory.
 */
export async function getBiography(subcategoryId) {
  const res = await fetch(`/api/biography/${subcategoryId}`);
  if (!res.ok) throw new Error('Failed to fetch biography');
  return await res.json();
}

/**
 * Save or update biography content.
 */
export async function saveBiography(subcategoryId, payload) {
  const res = await fetchWithAuth(`/api/biography/${subcategoryId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // backend expects an object with a contentHtml field
    body: JSON.stringify({ contentHtml: payload })
  });
  if (!res.ok) throw new Error('Failed to save biography');
  return await res.json();
}

/* ===================== Paintings ===================== */

/**
 * Get paintings by subcategory, optionally paginated.
 */
export async function listPaintings(subcategoryId, page, limit) {
  const qs = new URLSearchParams();
  if (page !== undefined) qs.set('page', page);
  if (limit !== undefined) qs.set('limit', limit);
  const url = `/api/paintings/${subcategoryId}${qs.toString() ? `?${qs}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch paintings');
  const data = await res.json();
  return Array.isArray(data)
    ? { items: data, total: data.length, page: 0, pages: 1, hasMore: false }
    : data;
}

/**
 * Upload one or more paintings (images) for a subcategory.
 */
export async function uploadPaintings(subcategoryId, files, descriptions = []) {
  const form = new FormData();
  for (const f of files) form.append('images', f);
  form.append('descriptions', JSON.stringify(descriptions));
  const res = await fetchWithAuth(`/api/paintings/upload/${subcategoryId}`, {
    method: 'POST',
    body: form
  });
  if (!res.ok) throw new Error('Failed to upload paintings');
  return await res.json();
}
/**
 * Delete a painting by ID.
 */
export async function deletePainting(id) {
  const res = await fetchWithAuth(`/api/paintings/item/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete painting');
  return await res.json();
}
