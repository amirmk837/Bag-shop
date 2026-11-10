const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

const API_ORIGIN = API_URL.startsWith("http") ? new URL(API_URL).origin : "";

// =================================================
// مدیریت پاسخ سرور
// =================================================

const GET_CACHE_TTL = 15_000;
const responseCache = new Map();
const inFlightGetRequests = new Map();

const invalidateReadCache = (path) => {
  if (path.startsWith("/products")) {
    for (const key of responseCache.keys()) {
      if (key.startsWith("/products")) responseCache.delete(key);
    }
  }

  if (path.startsWith("/categories")) {
    responseCache.clear();
  }
};

const request = async (path, options = {}) => {
  const method = (options.method || "GET").toUpperCase();
  const cacheable =
    method === "GET" && /^\/(products|categories)(\?|$)/.test(path);

  if (cacheable) {
    const cached = responseCache.get(path);
    if (cached && cached.expiresAt > Date.now()) return cached.value;
    if (cached) responseCache.delete(path);

    const pending = inFlightGetRequests.get(path);
    if (pending) return pending;
  }

  const execute = async () => {
    const response = await fetch(`${API_URL}${path}`, options);
    const contentType = response.headers.get("content-type") || "";

    let result = null;

    if (contentType.includes("application/json")) {
      try {
        result = await response.json();
      } catch {
        throw new Error("پاسخ JSON سرور معتبر نیست.");
      }
    } else {
      const text = await response.text();

      if (!response.ok) {
        throw new Error(
          `خطای سرور (${response.status})${text ? `: ${text.slice(0, 150)}` : ""}`,
        );
      }

      if (text.trim()) {
        throw new Error("سرور پاسخ غیرمنتظره‌ای برگرداند.");
      }
    }

    if (!response.ok) {
      const error = new Error(
        result?.message || `خطای سرور (${response.status})`,
      );

      error.status = response.status;
      error.productCount = result?.productCount;
      throw error;
    }

    if (method !== "GET") invalidateReadCache(path);
    return result;
  };

  if (!cacheable) return execute();

  const pending = execute();
  inFlightGetRequests.set(path, pending);

  try {
    const result = await pending;
    responseCache.set(path, {
      value: result,
      expiresAt: Date.now() + GET_CACHE_TTL,
    });
    return result;
  } finally {
    inFlightGetRequests.delete(path);
  }
};

const getData = (result) => result?.data ?? result;

// =================================================
// مدیریت آدرس تصاویر
// =================================================

const normalizeImageUrl = (url) => {
  if (typeof url !== "string" || !url) return url;

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  // تصاویر آپلودشده روی بک‌اند
  if (url.startsWith("/uploads/")) {
    return `${API_ORIGIN}${url}`;
  }

  return url;
};

// =================================================
// تبدیل محصول بک‌اند به ساختار فرانت‌اند
// =================================================

const normalizeProduct = (product) => {
  if (!product || typeof product !== "object") {
    throw new Error("ساختار اطلاعات محصول معتبر نیست.");
  }

  const images = Array.isArray(product.images)
    ? product.images
    : product.images
      ? [product.images]
      : [];

  return {
    ...product,

    id: product.productCode,

    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
          image: product.category.image,
        }
      : null,

    url: images.map(normalizeImageUrl),
  };
};

// =================================================
// GET /api/products
// =================================================

export const getProducts = async ({ categorySlug } = {}) => {
  const query = categorySlug
    ? `?categorySlug=${encodeURIComponent(categorySlug)}`
    : "";
  const result = await request(`/products${query}`);
  const data = getData(result);

  if (!Array.isArray(data)) {
    throw new Error("ساختار فهرست محصولات معتبر نیست.");
  }

  return data.map(normalizeProduct);
};

// دریافت صفحه‌ای محصولات برای فهرست‌های طولانی
export const getProductsPage = async ({
  categorySlug,
  page = 1,
  limit = 12,
  discountedOnly = false,
  search = "",
} = {}) => {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (categorySlug) query.set("categorySlug", categorySlug);
  if (discountedOnly) query.set("discountedOnly", "true");
  if (search.trim()) query.set("search", search.trim());

  const result = await request(`/products?${query.toString()}`);
  const data = getData(result);

  if (!Array.isArray(data) || !result?.pagination) {
    throw new Error("ساختار پاسخ صفحه محصولات معتبر نیست.");
  }

  return {
    products: data.map(normalizeProduct),
    pagination: result.pagination,
  };
};

// =================================================
// GET /api/products/:productCode
// =================================================

export const getProductByCode = async (productCode) => {
  if (!productCode) {
    throw new Error("کد محصول مشخص نشده است.");
  }

  try {
    const result = await request(
      `/products/${encodeURIComponent(productCode)}`,
    );

    const data = getData(result);

    return data ? normalizeProduct(data) : null;
  } catch (error) {
    if (error.status === 404) {
      return null;
    }

    throw error;
  }
};

// =================================================
// POST /api/products
// =================================================

export const createProduct = async (product) => {
  const result = await request("/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(product),
  });

  return normalizeProduct(getData(result));
};

// =================================================
// PATCH /api/products/:productCode
// =================================================

export const updateProduct = async (productCode, data) => {
  const result = await request(`/products/${encodeURIComponent(productCode)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  return normalizeProduct(getData(result));
};

// =================================================
// DELETE /api/products/:productCode
// =================================================

export const deleteProduct = async (productCode) => {
  const result = await request(`/products/${encodeURIComponent(productCode)}`, {
    method: "DELETE",
    credentials: "include",
  });

  return getData(result);
};

// =================================================
// POST /api/upload/product-image
// =================================================

export const uploadProductImage = async (file) => {
  if (!(file instanceof File)) {
    throw new Error("فایل تصویر معتبر نیست.");
  }

  const formData = new FormData();
  formData.append("image", file);

  const result = await request("/upload/product-image", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const data = getData(result);

  if (!data?.url) {
    throw new Error("آدرس تصویر در پاسخ سرور وجود ندارد.");
  }

  return {
    ...data,
    url: normalizeImageUrl(data.url),
  };
};

// =================================================
// GET /api/categories
// =================================================

export const getCategories = async () => {
  const result = await request("/categories");
  const data = getData(result);

  if (!Array.isArray(data)) {
    throw new Error("ساختار دسته‌بندی‌ها معتبر نیست.");
  }

  return data;
};

// =================================================
// POST /api/categories
// =================================================

export const createCategory = async (data) => {
  const result = await request("/categories", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  return getData(result);
};

// =================================================
// PATCH /api/categories/:categoryId
// =================================================

export const updateCategory = async (categoryId, data) => {
  const result = await request(
    `/categories/${encodeURIComponent(categoryId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    },
  );

  return getData(result);
};

// =================================================
// DELETE /api/categories/:categoryId
// =================================================

export const deleteCategory = async (categoryId, force = false) => {
  const query = force ? "?force=true" : "";

  const result = await request(
    `/categories/${encodeURIComponent(categoryId)}${query}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  return getData(result);
};
