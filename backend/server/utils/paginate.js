module.exports = async function paginate(query, { page, limit, sort } = {}) {
  const sortObj = sort || { createdAt: -1 };

  // Normalize paging params and detect explicit pagination intent
  const hasExplicitPaging = (page !== undefined) || (limit !== undefined);
  const p = Number.isFinite(parseInt(page ?? 0, 10)) ? Math.max(parseInt(page ?? 0, 10), 0) : 0;
  const l = Number.isFinite(parseInt(limit ?? 0, 10)) ? Math.max(parseInt(limit ?? 0, 10), 0) : 0;

  // Explicit pagination mode: honor page/limit as provided
  if (hasExplicitPaging) {
    // If both are 0/empty → return full list with metadata
    if (!p && !l) {
      const items = await query.sort(sortObj).lean();
      return { items, total: items.length, page: 0, pages: 1, hasMore: false };
    }
    const [items, total] = await Promise.all([
      query.sort(sortObj).skip(p * l).limit(l > 0 ? l : 0).lean(),
      query.model.countDocuments(query.getQuery()),
    ]);
    const pages = l ? Math.ceil(total / l) : 1;
    return { items, total, page: p, pages, hasMore: p + 1 < pages };
  }

  // Smart mode (no explicit page/limit):
  // - If total > 12, return first page with limit=12
  // - Otherwise return all
  const total = await query.model.countDocuments(query.getQuery());
  if (total > 12) {
    const l2 = 12;
    const items = await query.sort(sortObj).limit(l2).lean();
    const pages = Math.ceil(total / l2);
    return { items, total, page: 0, pages, hasMore: pages > 1 };
  }

  // Small datasets: return full list
  const items = await query.sort(sortObj).lean();
  return { items, total, page: 0, pages: 1, hasMore: false };
};
