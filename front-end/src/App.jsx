import Footer from "./layouts/footer/Footer";
import Header from "./layouts/header/Header";
import { Route, Routes, useLocation } from "react-router-dom";
import Cat from "./pages/Cat";
import Targus from "./pages/Targus";
import Forward from "./pages/Forward";
import Alexa from "./pages/Alexa";
import Lexin from "./pages/Lexin";
import Content from "./layouts/content/Content";
import ProductInfo from "./pages/productInfo/ProductInfo";
import Glossy from "./pages/glossy";
import AdminLayout from "./admin/layouts/AdminLayout";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminProducts from "./admin/pages/AdminProducts";
import AdminProductCreate from "./admin/pages/AdminProductCreate";
import AdminProductEdit from "./admin/pages/AdminProductEdit";
import AdminCategories from "./admin/pages/AdminCategories";
import CategoryProducts from "./components/CategoryProducts";

const routes = [
  { path: "/", element: <Content /> },
  { path: "/CatProducts", element: <Cat /> },
  { path: "/TargusProduct", element: <Targus /> },
  { path: "/ForwardProduct", element: <Forward /> },
  { path: "/AlexaProduct", element: <Alexa /> },
  { path: "/LexinProduct", element: <Lexin /> },
  { path: "/GlossyProduct", element: <Glossy /> },
  { path: "/product/:id", element: <ProductInfo /> },
  {
    path: "/admin",
    element: (
      <AdminLayout>
        <AdminDashboard />
      </AdminLayout>
    ),
  },
  {
    path: "/admin/products",
    element: (
      <AdminLayout>
        <AdminProducts />
      </AdminLayout>
    ),
  },
  {
    path: "/admin/products/create",
    element: (
      <AdminLayout>
        <AdminProductCreate />
      </AdminLayout>
    ),
  },
  {
    path: "/admin/products/:productCode/edit",
    element: (
      <AdminLayout>
        <AdminProductEdit />
      </AdminLayout>
    ),
  },
  {
    path: "/admin/categories",
    element: (
      <AdminLayout>
        <AdminCategories />
      </AdminLayout>
    ),
  },
  { path: "/category/:slug", element: <CategoryProducts /> },
];

const App = () => {
  const location = useLocation();

  const isProductPage = location.pathname.startsWith("/product/");

  return (
    <div
      className={
        isProductPage
          ? "min-h-screen bg-zinc-950"
          : "min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-black"
      }
    >
      <Header />

      <Routes>
        {routes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Routes>

      <Footer />
    </div>
  );
};

export default App;
