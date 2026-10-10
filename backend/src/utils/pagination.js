/** Parse ?page & ?limit into skip/limit plus response meta. */
function getPagination(query, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const page = Math.max(parseInt(query.page || '1', 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit || String(defaultLimit), 10) || defaultLimit, 1), maxLimit);
  return { page, limit, skip: (page - 1) * limit };
}

/** Build the `meta` block returned with every list endpoint. */
function buildMeta(total, { page, limit }) {
  const pages = Math.ceil(total / limit) || 1;
  return { total, page, limit, pages, hasNext: page < pages, hasPrev: page > 1 };
}

module.exports = { getPagination, buildMeta };
