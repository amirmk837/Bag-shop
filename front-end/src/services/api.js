const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

const API_ORIGIN = API_URL.startsWith("http") ? new URL(API_URL).origin : "";

// =================================================
// مدیریت پاسخ سرور
// =================================================

const request = async (path, options = {}) => {
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

  return result;
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

export const getProducts = async () => {
  const result = await request("/products");
  const data = getData(result);

  if (!Array.isArray(data)) {
    throw new Error("ساختار فهرست محصولات معتبر نیست.");
  }

  return data.map(normalizeProduct);
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
    },
  );

  return getData(result);
};
