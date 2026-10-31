const createStockError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const validateQuantity = (quantity) => {
  if (!Number.isSafeInteger(quantity) || quantity <= 0) {
    throw createStockError(400, "تعداد محصول برای تغییر موجودی معتبر نیست.");
  }
};

const hasColorStocks = async (tx, productId) => {
  const count = await tx.productColorStock.count({
    where: { productId },
  });

  return count > 0;
};

export const reserveStock = async (
  tx,
  { productId, color = "", quantity, title = "" },
) => {
  validateQuantity(quantity);

  if (!Number.isSafeInteger(productId) || productId <= 0) {
    throw createStockError(400, "شناسه محصول برای رزرو موجودی معتبر نیست.");
  }

  const usesColorStock = await hasColorStocks(tx, productId);

  if (usesColorStock) {
    if (!color) {
      throw createStockError(
        409,
        `رنگ محصول «${title}» مشخص نیست و موجودی آن قابل رزرو نیست.`,
      );
    }

    const colorUpdate = await tx.productColorStock.updateMany({
      where: {
        productId,
        color,
        count: { gte: quantity },
      },
      data: {
        count: { decrement: quantity },
      },
    });

    if (colorUpdate.count !== 1) {
      throw createStockError(
        409,
        `موجودی رنگ انتخاب‌شده برای محصول «${title}» کافی نیست یا وجود ندارد.`,
      );
    }
  }

  const productUpdate = await tx.product.updateMany({
    where: {
      id: productId,
      count: { gte: quantity },
    },
    data: {
      count: { decrement: quantity },
    },
  });

  if (productUpdate.count !== 1) {
    throw createStockError(
      409,
      `موجودی محصول «${title}» کافی نیست یا محصول وجود ندارد.`,
    );
  }

  return true;
};

export const releaseStock = async (tx, { productId, color = "", quantity }) => {
  validateQuantity(quantity);

  if (!Number.isSafeInteger(productId) || productId <= 0) {
    throw createStockError(
      400,
      "شناسه محصول برای بازگرداندن موجودی معتبر نیست.",
    );
  }

  const usesColorStock = await hasColorStocks(tx, productId);

  if (usesColorStock) {
    if (!color) {
      throw createStockError(
        409,
        "رنگ محصول برای بازگرداندن موجودی مشخص نیست.",
      );
    }

    const colorUpdate = await tx.productColorStock.updateMany({
      where: { productId, color },
      data: {
        count: { increment: quantity },
      },
    });

    if (colorUpdate.count !== 1) {
      throw createStockError(
        409,
        "موجودی رنگ محصول پیدا نشد؛ بازگرداندن موجودی کامل نشد.",
      );
    }
  }

  const productUpdate = await tx.product.updateMany({
    where: { id: productId },
    data: {
      count: { increment: quantity },
    },
  });

  if (productUpdate.count !== 1) {
    throw createStockError(409, "محصول برای بازگرداندن موجودی پیدا نشد.");
  }

  return true;
};
