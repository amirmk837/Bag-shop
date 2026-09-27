const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
// =================================================
// تبدیل Product از Backend به ساختار Frontend
// =================================================

const normalizeProduct = (product) => {
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

    url: Array.isArray(product.images)
      ? product.images
      : product.images
        ? [product.images]
        : [],
  };
};

// =================================================
// GET /api/products
// =================================================

export const getProducts = async () => {
  const response = await fetch(`${API_URL}/products`);

  if (!response.ok) {
    throw new Error("خطا در دریافت محصولات");
  }

  const result = await response.json();

  return result.data.map(normalizeProduct);
};

// =================================================
// GET /api/products/:productCode
// =================================================

export const getProductByCode = async (productCode) => {
  const response = await fetch(`${API_URL}/products/${productCode}`);

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }

    throw new Error("خطا در دریافت محصول");
  }

  const result = await response.json();

  return normalizeProduct(result.data);
};

// =================================================
// POST /api/products
// =================================================

export const createProduct = async (product) => {
  const response = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(product),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "خطا در ایجاد محصول");
  }

  return normalizeProduct(result.data);
};

// =================================================
// PATCH /api/products/:productCode
// =================================================

export const updateProduct = async (productCode, data) => {
  const response = await fetch(`${API_URL}/products/${productCode}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "خطا در ویرایش محصول");
  }

  return normalizeProduct(result.data);
};

// =================================================
// DELETE /api/products/:productCode
// =================================================

export const deleteProduct = async (productCode) => {
  const response = await fetch(`${API_URL}/products/${productCode}`, {
    method: "DELETE",
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "خطا در حذف محصول");
  }

  return result;
};

export const uploadProductImage = async (file) => {
  const formData = new FormData();

  formData.append("image", file);

  const response = await fetch(`${API_URL}/upload/product-image`, {
    method: "POST",
    body: formData,
  });

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const text = await response.text();

    console.error("Upload returned non-JSON response:", text);

    throw new Error("سرور پاسخ نامعتبر برای آپلود تصویر برگرداند.");
  }

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "خطا در آپلود تصویر");
  }

  return {
    ...result.data,
    url: `${API_URL.replace("/api", "")}${result.data.url}`,
  };
};

// =================================================
// GET /api/categories
// =================================================

export const getCategories = async () => {
  const response = await fetch(`${API_URL}/categories`);

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "خطا در دریافت دسته‌بندی‌ها");
  }

  return result.data;
};

export const createCategory = async (data) => {
  const response = await fetch(`${API_URL}/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "خطا در ایجاد دسته‌بندی");
  }

  return result.data;
};
