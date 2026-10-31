import { createContext, useContext, useEffect, useState } from "react";
import {
  addToCart as addToCartRequest,
  clearCart as clearCartRequest,
  getCart,
  removeCartItem as removeCartItemRequest,
  updateCartItem as updateCartItemRequest,
} from "../services/cartApi";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

const emptyCart = {
  id: null,
  items: [],
  totalItems: 0,
  subtotal: 0,
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [cart, setCart] = useState(emptyCart);
  const [loading, setLoading] = useState(false);

  const refreshCart = async () => {
    try {
      setLoading(true);
      const data = await getCart();
      setCart(data);
      return data;
    } catch (error) {
      console.error("Refresh cart error:", error);
      setCart(emptyCart);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setCart(emptyCart);
      setLoading(false);
      return;
    }

    let ignore = false;

    const loadCart = async () => {
      try {
        setLoading(true);
        const data = await getCart();

        if (!ignore) setCart(data);
      } catch (error) {
        console.error("Load cart error:", error);
        if (!ignore) setCart(emptyCart);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadCart();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated, authLoading]);

  const addToCart = async (productCode, quantity = 1, color = "") => {
    const data = await addToCartRequest(productCode, quantity, color);
    setCart(data);
    return data;
  };

  const updateCartItem = async (productCode, quantity, color = "") => {
    const data = await updateCartItemRequest(productCode, quantity, color);
    setCart(data);
    return data;
  };

  const removeCartItem = async (productCode, color = "") => {
    const data = await removeCartItemRequest(productCode, color);
    setCart(data);
    return data;
  };

  const clearCart = async () => {
    const data = await clearCartRequest();
    setCart(data);
    return data;
  };

  const value = {
    cart,
    items: Array.isArray(cart.items) ? cart.items : [],
    loading,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    refreshCart,
    totalItems: Number(cart.totalItems || 0),
    subtotal: Number(cart.subtotal || 0),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart باید داخل CartProvider استفاده شود.");
  }

  return context;
};
