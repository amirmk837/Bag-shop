import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
const loadCartApi = () => import("../services/cartApi");
import { useAuth } from "./useAuth";

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
  const [initialized, setInitialized] = useState(false);
  const [loadError, setLoadError] = useState("");

  // دریافت سبد فقط هنگام ورود به صفحه سبد/تسویه یا درخواست صریح.
  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(emptyCart);
      setInitialized(true);
      setLoadError("");
      return emptyCart;
    }

    try {
      setLoading(true);
      const { getCart } = await loadCartApi();
      const data = await getCart();
      setCart(data);
      setLoadError("");
      return data;
    } catch (error) {
      console.error("Refresh cart error:", error);
      setLoadError(error?.message || "دریافت سبد خرید ناموفق بود.");
      throw error;
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [isAuthenticated]);

  const addToCart = async (productCode, quantity = 1, color = "") => {
    const { addToCart } = await loadCartApi();
    const data = await addToCart(productCode, quantity, color);
    setCart(data);
    setInitialized(true);
    setLoadError("");
    return data;
  };

  const updateCartItem = async (productCode, quantity, color = "") => {
    const { updateCartItem } = await loadCartApi();
    const data = await updateCartItem(productCode, quantity, color);
    setCart(data);
    setInitialized(true);
    setLoadError("");
    return data;
  };

  const removeCartItem = async (productCode, color = "") => {
    const { removeCartItem } = await loadCartApi();
    const data = await removeCartItem(productCode, color);
    setCart(data);
    setInitialized(true);
    setLoadError("");
    return data;
  };

  const clearCart = async () => {
    const { clearCart } = await loadCartApi();
    const data = await clearCart();
    setCart(data);
    setInitialized(true);
    setLoadError("");
    return data;
  };

  const visibleCart = isAuthenticated ? cart : emptyCart;
  const value = {
    cart: visibleCart,
    items: Array.isArray(visibleCart.items) ? visibleCart.items : [],
    loading: isAuthenticated ? loading : false,
    initialized: isAuthenticated ? initialized : false,
    loadError: isAuthenticated ? loadError : "",
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    refreshCart,
    totalItems: Number(visibleCart.totalItems || 0),
    subtotal: Number(visibleCart.subtotal || 0),
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
