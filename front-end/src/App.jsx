import Footer from "./layouts/footer/Footer";
import Header from "./layouts/header/Header";

import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";

import Content from "./layouts/content/Content";
import ProductInfo from "./pages/productInfo/ProductInfo";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./admin/layouts/AdminLayout";

import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminProducts from "./admin/pages/AdminProducts";
import AdminProductCreate from "./admin/pages/AdminProductCreate";
import AdminProductEdit from "./admin/pages/AdminProductEdit";
import AdminCategories from "./admin/pages/AdminCategories";
import AdminCategoryProducts from "./admin/pages/AdminCategoryProducts";
import AdminOrders from "./admin/pages/AdminOrders";

import AdminUsers from "./pages/admin/AdminUsers";
import CategoryProducts from "./components/CategoryProducts";

import ProtectedRoute from "./routes/ProtectedRoute";
import CustomerOnlyRoute from "./routes/CustomerOnlyRoute";

import CustomerLogin from "./pages/auth/CustomerLogin";
import CustomerRegister from "./pages/auth/CustomerRegister";

import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Account from "./pages/account/Account";
import AdminBanners from "./admin/pages/AdminBanners";
import AdminSocialLinks from "./admin/pages/AdminSocialLinks";
import AdminSiteSettings from "./admin/pages/AdminSiteSettings";

import AdminPaymentSettings from "./admin/pages/AdminPaymentSettings";
import PaymentResult from "./pages/payment/PaymentResult";

import MyOrders from "./pages/account/MyOrders";
import AdminShippingMethods from "./admin/pages/AdminShippingMethods";
// =========================================
// ROUTES
// =========================================

const routes = [
  {
    path: "/",
    element: <Content />,
  },
  {
    path: "/category/:slug",
    element: <CategoryProducts />,
  },
  {
    path: "/product/:id",
    element: <ProductInfo />,
  },

  // Legacy routes
  {
    path: "/CatProducts",
    element: <Navigate to="/category/cat" replace />,
  },
  {
    path: "/TargusProduct",
    element: <Navigate to="/category/targus" replace />,
  },
  {
    path: "/ForwardProduct",
    element: <Navigate to="/category/forward" replace />,
  },
  {
    path: "/AlexaProduct",
    element: <Navigate to="/category/alexa" replace />,
  },
  {
    path: "/LexinProduct",
    element: <Navigate to="/category/lexin" replace />,
  },
  {
    path: "/GlossyProduct",
    element: <Navigate to="/category/glossy" replace />,
  },

  // Customer authentication
  {
    path: "/login",
    element: <CustomerLogin />,
  },
  {
    path: "/register",
    element: <CustomerRegister />,
  },

  // Customer account
  {
    path: "/account",
    element: (
      <CustomerOnlyRoute>
        <Account />
      </CustomerOnlyRoute>
    ),
  },
  {
    path: "/cart",
    element: (
      <CustomerOnlyRoute allowGuest>
        <Cart />
      </CustomerOnlyRoute>
    ),
  },
  {
    path: "/checkout",
    element: (
      <CustomerOnlyRoute>
        <Checkout />
      </CustomerOnlyRoute>
    ),
  },

  // Admin authentication
  {
    path: "/admin/login",
    element: <AdminLogin />,
  },

  // Admin dashboard
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <AdminLayout>
          <AdminDashboard />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },

  // Admin products
  {
    path: "/admin/products",
    element: (
      <ProtectedRoute>
        <AdminLayout>
          <AdminProducts />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/products/create",
    element: (
      <ProtectedRoute>
        <AdminLayout>
          <AdminProductCreate />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/products/:productCode/edit",
    element: (
      <ProtectedRoute>
        <AdminLayout>
          <AdminProductEdit />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },

  // Admin categories
  {
    path: "/admin/categories",
    element: (
      <ProtectedRoute>
        <AdminLayout>
          <AdminCategories />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/categories/:slug",
    element: (
      <ProtectedRoute>
        <AdminLayout>
          <AdminCategoryProducts />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },

  // Admin orders
  {
    path: "/admin/orders",
    element: (
      <ProtectedRoute>
        <AdminLayout>
          <AdminOrders />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },

  // Admin users
  {
    path: "/admin/users",
    element: (
      <ProtectedRoute>
        <AdminLayout>
          <AdminUsers />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },

  {
    path: "/admin/banners",
    element: (
      <ProtectedRoute>
        <AdminLayout>
          <AdminBanners />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },

  {
    path: "/admin/social-links",
    element: (
      <ProtectedRoute>
        <AdminLayout>
          <AdminSocialLinks />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },

  {
    path: "/admin/payment-settings",
    element: (
      <ProtectedRoute>
        <AdminLayout>
          <AdminPaymentSettings />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },

  {
    path: "/payment/result",
    element: (
      <CustomerOnlyRoute>
        <PaymentResult />
      </CustomerOnlyRoute>
    ),
  },

  {
    path: "/account/orders",
    element: (
      <CustomerOnlyRoute>
        <MyOrders />
      </CustomerOnlyRoute>
    ),
  },
  {
    path: "/admin/shipping-methods",
    element: (
      <ProtectedRoute>
        <AdminLayout>
          <AdminShippingMethods />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: (
      <div dir="rtl" className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center text-white">
        <p className="text-2xl font-black">صفحه پیدا نشد</p>
        <p className="text-sm text-zinc-400">آدرس واردشده معتبر نیست یا این صفحه وجود ندارد.</p>
        <Link to="/" className="rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-400">
          بازگشت به فروشگاه
        </Link>
      </div>
    ),
  },
];

// =========================================
// APP
// =========================================

const App = () => {
  const location = useLocation();

  const isProductPage = location.pathname.startsWith("/product/");
  const isAdminArea = location.pathname.startsWith("/admin");

  return (
    <div
      dir="rtl"
      className={
        isProductPage
          ? "min-h-screen bg-zinc-950"
          : "min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-black"
      }
    >
      {!isAdminArea && <Header />}

      <main className="min-h-screen">
        <Routes>
          {routes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Routes>
      </main>

      {!isAdminArea && <Footer />}
    </div>
  );
};

export default App;
