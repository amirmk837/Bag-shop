import {
  addCartItem,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "../services/cart.service.js";

const getQuantity = (value) => {
  const quantity = Number(value);

  return Number.isSafeInteger(quantity) && quantity > 0 ? quantity : null;
};

const handleError = (res, error, action) => {
  console.error(`${action} error:`, error);

  return res.status(error.status || 500).json({
    message: error.status ? error.message : "خطا در پردازش سبد خرید.",
  });
};

export const getCartController = async (req, res) => {
  try {
    return res.status(200).json(await getCart(req.user.id));
  } catch (error) {
    return handleError(res, error, "Get cart");
  }
};

export const addCartItemController = async (req, res) => {
  try {
    const { productCode, color = "" } = req.body;
    const quantity = getQuantity(req.body.quantity);

    const cart = await addCartItem(req.user.id, productCode, quantity, color);

    return res.status(200).json(cart);
  } catch (error) {
    return handleError(res, error, "Add cart item");
  }
};

export const updateCartItemController = async (req, res) => {
  try {
    const { productCode } = req.params;
    const color = typeof req.query.color === "string" ? req.query.color : "";
    const quantity = getQuantity(req.body.quantity);

    const cart = await updateCartItem(
      req.user.id,
      productCode,
      quantity,
      color,
    );

    return res.status(200).json(cart);
  } catch (error) {
    return handleError(res, error, "Update cart item");
  }
};

export const removeCartItemController = async (req, res) => {
  try {
    const { productCode } = req.params;
    const color = typeof req.query.color === "string" ? req.query.color : "";

    const cart = await removeCartItem(req.user.id, productCode, color);

    return res.status(200).json(cart);
  } catch (error) {
    return handleError(res, error, "Remove cart item");
  }
};

export const clearCartController = async (req, res) => {
  try {
    return res.status(200).json(await clearCart(req.user.id));
  } catch (error) {
    return handleError(res, error, "Clear cart");
  }
};
