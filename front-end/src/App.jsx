import Header from "./layouts/header/Header";

import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";

import { lazy, Suspense, useEffect } from "react";
import { trackPageView } from "./services/siteAnalyticsApi";
import DeferredMount from "./components/DeferredMount";
import SupportWidget from "./components/SupportWidget";

const Footer = lazy(() => import("./layouts/footer/Footer"));

import ProtectedRoute from "./routes/ProtectedRoute";
import CustomerOnlyRoute from "./routes/CustomerOnlyRoute";

const Content = lazy(() => import("./layouts/content/Content"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const FaqPage = lazy(() => import("./pages/FaqPage"));
const AdminFaqPage = lazy(() => import("./admin/pages/AdminFaqPage"));
const AdminAboutPage = lazy(() => import("./admin/pages/AdminAboutPage"));
const ProductInfo = lazy(() => import("./pages/productInfo/ProductInfo"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminLayout = lazy(() => import("./admin/layouts/AdminLayout"));
const AdminDashboard = lazy(() => import("./admin/pages/AdminDashboard"));
const AdminProducts = lazy(() => import("./admin/pages/AdminProducts"));
const AdminDiscounts = lazy(() => import("./admin/pages/AdminDiscounts"));
const DiscountProducts = lazy(() => import("./pages/DiscountProducts"));
const AdminProductCreate = lazy(
  () => import("./admin/pages/AdminProductCreate"),
);
const AdminProductEdit = lazy(() => import("./admin/pages/AdminProductEdit"));
const AdminCategories = lazy(() => import("./admin/pages/AdminCategories"));
const AdminCategoryProducts = lazy(
  () => import("./admin/pages/AdminCategoryProducts"),
);
const AdminOrders = lazy(() => import("./admin/pages/AdminOrders"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const CategoryProducts = lazy(() => import("./components/CategoryProducts"));
const CustomerLogin = lazy(() => import("./pages/auth/CustomerLogin"));
const CustomerRegister = lazy(() => import("./pages/auth/CustomerRegister"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Account = lazy(() => import("./pages/account/Account"));
const AdminBanners = lazy(() => import("./admin/pages/AdminBanners"));
const AdminSocialLinks = lazy(() => import("./admin/pages/AdminSocialLinks"));
const AdminFooterTrustBadges = lazy(() => import("./admin/pages/AdminFooterTrustBadges"));
const AdminSiteSettings = lazy(() => import("./admin/pages/AdminSiteSettings"));
const AdminPaymentSettings = lazy(
  () => import("./admin/pages/AdminPaymentSettings"),
);
const PaymentResult = lazy(() => import("./pages/payment/PaymentResult"));
const MyOrders = lazy(() => import("./pages/account/MyOrders"));
const AdminShippingMethods = lazy(
  () => import("./admin/pages/AdminShippingMethods"),
);
const AdminAnalytics = lazy(() => import("./admin/pages/AdminAnalytics"));
const AdminProductComments = lazy(
  () => import("./admin/pages/AdminProductComments"),
);
const AdminSupport = lazy(() => import("./admin/pages/AdminSupport"));
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
    path: "/about",
    element: <AboutPage />,
  },
  {
    path: "/faq",
    element: <FaqPage />,
  },
  {
    path: "/discounts",
    element: <DiscountProducts />,
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
    path: "/admin/discounts",
    element: (
      <ProtectedRoute>
        <AdminLayout>
          <AdminDiscounts />
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

  // Product feedback moderation
  {
    path: "/admin/product-comments",
    element: (
      <ProtectedRoute>
        <AdminLayout>
          <AdminProductComments />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/support",
    element: (
      <ProtectedRoute>
        <AdminLayout>
          <AdminSupport />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },

  // Admin analytics
  {
    path: "/admin/analytics",
    element: (
      <ProtectedRoute>
        <AdminLayout>
          <AdminAnalytics />
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
    path: "/admin/footer-trust-badges",
    element: (
      <ProtectedRoute>
        <AdminLayout>
          <AdminFooterTrustBadges />
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
    path: "/admin/faq",
    element: (
      <ProtectedRoute>
        <AdminLayout>
          <AdminFaqPage />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/about",
    element: (
      <ProtectedRoute>
        <AdminLayout>
          <AdminAboutPage />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/site-settings",
    element: (
      <ProtectedRoute>
        <AdminLayout>
          <AdminSiteSettings />
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
      <div
        dir="rtl"
        className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center text-white"
      >
        <p className="text-2xl font-black">صفحه پیدا نشد</p>
        <p className="text-sm text-zinc-400">
          آدرس واردشده معتبر نیست یا این صفحه وجود ندارد.
        </p>
        <Link
          to="/"
          className="rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
        >
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

  useEffect(() => {
    if (!location.pathname.startsWith("/admin"))
      trackPageView(location.pathname);
  }, [location.pathname]);

  const isAdminArea = location.pathname.startsWith("/admin");

  return (
    <div
      dir="rtl"
      className="app-shell relative isolate flex min-h-screen flex-col overflow-hidden bg-[#080c13] text-white"
    >
      <div
        aria-hidden="true"
        className="app-background-glow pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -right-48 top-20 h-[28rem] w-[28rem] rounded-full bg-cyan-500/[0.07] blur-[130px]" />
        <div className="absolute -left-48 top-[38rem] h-[32rem] w-[32rem] rounded-full bg-violet-500/[0.07] blur-[140px]" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.22)_1px,transparent_1px)] [background-size:54px_54px]" />
      </div>

      {!isAdminArea && <Header />}

      <main className="relative z-0 min-w-0 flex-1">
        <Suspense
          fallback={
            <div
              className="mx-auto min-h-[50vh] w-full max-w-7xl px-4 py-10"
              aria-busy="true"
            >
              <div className="mx-auto mb-8 h-8 w-40 animate-pulse rounded-lg bg-zinc-700/60" />
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }, (_, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-zinc-700/60 bg-zinc-900 p-2"
                  >
                    <div className="h-48 animate-pulse rounded-xl bg-zinc-700/60" />
                    <div className="mt-4 h-4 w-3/4 animate-pulse rounded bg-zinc-700/60" />
                    <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-zinc-800" />
                  </div>
                ))}
              </div>
            </div>
          }
        >
          <Routes>
            {routes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={route.element}
              />
            ))}
          </Routes>
        </Suspense>
      </main>

      {!isAdminArea && <SupportWidget />}

      {!isAdminArea && (
        <DeferredMount rootMargin="700px 0px" minHeight={300}>
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
        </DeferredMount>
      )}
    </div>
  );
};

export default App;
