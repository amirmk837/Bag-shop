import prisma from "../config/prisma.js";

const createCartError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const validateQuantity = (quantity) =>
  Number.isSafeInteger(quantity) && quantity > 0;

const normalizeColor = (value) =>
  typeof value === "string" ? value.trim() : "";

const parseColors = (value) => {
  const list = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[,،\n|]/)
      : [];

  return [
    ...new Set(list.map((color) => String(color).trim()).filter(Boolean)),
  ];
};

const hasColorStocks = (product) =>
  Array.isArray(product.colorStocks) && product.colorStocks.length > 0;

// لیست رنگ‌های معتبر محصول
const getProductColors = (product) =>
  hasColorStocks(product)
    ? product.colorStocks.map((stock) => stock.color)
    : parseColors(product.color);

// موجودی همان رنگ (یا موجودی کل برای محصول بدون رنگ‌بندی)
const getStockForColor = (product, color) => {
  if (!hasColorStocks(product)) {
    return Math.max(Number(product.count) || 0, 0);
  }

  const stock = product.colorStocks.find((item) => item.color === color);

  return Math.max(Number(stock?.count) || 0, 0);
};

const getCartData = (cart) => {
  const items = cart?.items || [];

  const formattedItems = items.map((item) => {
    const stock = getStockForColor(item.product, item.color);

    return {
      id: item.id,
      productCode: item.product.productCode,
      title: item.product.title,
      price: item.product.discountedPrice ?? item.product.price,
      originalPrice: item.product.discountedPrice ? item.product.price : null,
      discountPercent: item.product.discountedPrice ? Math.round((1 - item.product.discountedPrice / item.product.price) * 100) : null,
      images: item.product.images,
      availableQuantity: stock,
      maxQuantity: stock,
      quantity: item.quantity,
      color: item.color,
      subtotal: (item.product.discountedPrice ?? item.product.price) * item.quantity,
    };
  });

  return {
    id: cart?.id || null,
    items: formattedItems,
    totalItems: formattedItems.reduce(
      (total, item) => total + item.quantity,
      0,
    ),
    subtotal: formattedItems.reduce((total, item) => total + item.subtotal, 0),
  };
};

const getCartInclude = {
  items: {
    orderBy: { createdAt: "asc" },
    include: {
      product: {
        select: {
          id: true,
          productCode: true,
          title: true,
          price: true,
          discountedPrice: true,
          images: true,
          count: true,
          color: true,
          colorStocks: {
            select: { color: true, count: true },
          },
        },
      },
    },
  },
};

const getOrCreateCart = async (tx, userId) =>
  tx.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    select: { id: true },
  });

const validateProductColor = (availableColors, selectedColor) => {
  const color = normalizeColor(selectedColor);

  if (availableColors.length > 0 && !color) {
    throw createCartError(400, "لطفاً رنگ محصول را انتخاب کنید.");
  }

  if (availableColors.length > 0 && !availableColors.includes(color)) {
    throw createCartError(400, "رنگ انتخاب‌شده برای این محصول معتبر نیست.");
  }

  if (availableColors.length === 0 && color) {
    throw createCartError(400, "این محصول رنگ قابل انتخاب ندارد.");
  }

  return color;
};

export const getCart = async (userId) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: getCartInclude,
  });

  return getCartData(cart);
};

export const addCartItem = async (
  userId,
  productCode,
  quantity,
  selectedColor = "",
) => {
  if (!productCode || !validateQuantity(quantity)) {
    throw createCartError(400, "کد محصول و تعداد معتبر الزامی است.");
  }

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await prisma
        .$transaction(
          async (tx) => {
            const product = await tx.product.findUnique({
              where: { productCode },
              select: {
                id: true,
                count: true,
                color: true,
                colorStocks: {
                  select: { color: true, count: true },
                },
              },
            });

            if (!product) {
              throw createCartError(404, "محصول پیدا نشد.");
            }

            const color = validateProductColor(
              getProductColors(product),
              selectedColor,
            );

            const stock = getStockForColor(product, color);

            if (stock < 1) {
              throw createCartError(
                409,
                hasColorStocks(product)
                  ? "این رنگ در حال حاضر ناموجود است."
                  : "این محصول در حال حاضر ناموجود است.",
              );
            }

            const cart = await getOrCreateCart(tx, userId);

            const existingItem = await tx.cartItem.findFirst({
              where: {
                cartId: cart.id,
                productId: product.id,
                color,
              },
              select: { id: true, quantity: true },
            });

            const currentQuantity = existingItem?.quantity || 0;
            const remaining = stock - currentQuantity;

            if (quantity > remaining) {
              throw createCartError(
                409,
                remaining <= 0
                  ? "تمام موجودی این محصول در سبد خرید شما قرار دارد."
                  : `فقط ${remaining} عدد دیگر از این ${
                      hasColorStocks(product) ? "رنگ" : "محصول"
                    } قابل افزودن است.`,
              );
            }

            if (existingItem) {
              await tx.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: currentQuantity + quantity },
              });
            } else {
              await tx.cartItem.create({
                data: {
                  cartId: cart.id,
                  productId: product.id,
                  quantity,
                  color,
                },
              });
            }

            return tx.cart.findUnique({
              where: { id: cart.id },
              include: getCartInclude,
            });
          },
          { isolationLevel: "Serializable" },
        )
        .then(getCartData);
    } catch (error) {
      if (error?.code === "P2034" && attempt < 3) {
        continue;
      }

      throw error;
    }
  }

  throw createCartError(
    409,
    "افزودن به سبد به دلیل تداخل هم‌زمان انجام نشد. دوباره تلاش کنید.",
  );
};

export const updateCartItem = async (
  userId,
  productCode,
  quantity,
  selectedColor = "",
) => {
  if (!productCode || !validateQuantity(quantity)) {
    throw createCartError(400, "کد محصول و تعداد معتبر الزامی است.");
  }

  const color = normalizeColor(selectedColor);

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await prisma.$transaction(
        async (tx) => {
          const cart = await tx.cart.findUnique({
            where: { userId },
            select: { id: true },
          });

          if (!cart) {
            throw createCartError(404, "سبد خرید پیدا نشد.");
          }

          const product = await tx.product.findUnique({
            where: { productCode },
            select: {
              id: true,
              count: true,
              color: true,
              colorStocks: {
                select: { color: true, count: true },
              },
            },
          });

          if (!product) {
            throw createCartError(404, "محصول پیدا نشد.");
          }

          const item = await tx.cartItem.findFirst({
            where: {
              cartId: cart.id,
              productId: product.id,
              color,
            },
            select: { id: true },
          });

          if (!item) {
            throw createCartError(404, "این رنگ از محصول در سبد خرید نیست.");
          }

          const stock = getStockForColor(product, color);

          if (quantity > stock) {
            throw createCartError(
              409,
              hasColorStocks(product)
                ? `حداکثر تعداد این رنگ ${stock} عدد است.`
                : `حداکثر تعداد قابل انتخاب ${stock} عدد است.`,
            );
          }

          await tx.cartItem.update({
            where: { id: item.id },
            data: { quantity },
          });
        },
        { isolationLevel: "Serializable" },
      );

      return getCart(userId);
    } catch (error) {
      if (error?.code === "P2034" && attempt < 3) {
        continue;
      }

      throw error;
    }
  }

  throw createCartError(
    409,
    "به‌روزرسانی سبد به دلیل تداخل هم‌زمان انجام نشد. دوباره تلاش کنید.",
  );
};

export const removeCartItem = async (
  userId,
  productCode,
  selectedColor = "",
) => {
  const color = normalizeColor(selectedColor);

  const cart = await prisma.cart.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!cart) return getCart(userId);

  const product = await prisma.product.findUnique({
    where: { productCode },
    select: { id: true },
  });

  if (!product) {
    throw createCartError(404, "محصول پیدا نشد.");
  }

  await prisma.cartItem.deleteMany({
    where: {
      cartId: cart.id,
      productId: product.id,
      color,
    },
  });

  return getCart(userId);
};

export const clearCart = async (userId) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!cart) return getCart(userId);

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });

  return getCart(userId);
};
