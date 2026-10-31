import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Backpage from "../components/ui/Backpage";
import { getCategories, getProducts } from "../../services/api";

const AdminCategoryProducts = () => {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [categoriesData, productsData] = await Promise.all([
          getCategories(),
          getProducts(),
        ]);

        const foundCategory = categoriesData.find((item) => item.slug === slug);

        if (!foundCategory) {
          setError("دسته‌بندی پیدا نشد");
          return;
        }

        const filteredProducts = productsData.filter(
          (product) => product.category?.id === foundCategory.id,
        );

        setCategory(foundCategory);
        setProducts(filteredProducts);
      } catch (error) {
        console.error("Admin category products error:", error);

        setError("خطا در دریافت محصولات دسته‌بندی");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-zinc-400">
        در حال دریافت محصولات...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div dir="rtl">
      <div className="mb-8 flex justify-between">
        <div>
          <h2 className="text-2xl font-bold">محصولات {category.name}</h2>
          <p className="mt-2 text-sm text-zinc-400">
            تعداد محصولات: {products.length}
          </p>
        </div>
        <Backpage />
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-500">
          محصولی در این دسته‌بندی وجود ندارد.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-right">
              <thead className="border-b border-zinc-800 bg-zinc-950">
                <tr>
                  <th className="px-5 py-4">کد محصول</th>
                  <th className="px-5 py-4">عنوان</th>
                  <th className="px-5 py-4">موجودی</th>
                  <th className="px-5 py-4">قیمت</th>
                  <th className="px-5 py-4">عملیات</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.productCode}
                    className="border-b border-zinc-800 last:border-b-0"
                  >
                    <td className="px-5 py-4">{product.productCode}</td>

                    <td className="px-5 py-4">{product.title}</td>

                    <td className="px-5 py-4">{product.count}</td>

                    <td className="px-5 py-4">
                      {product.price?.toLocaleString("fa-IR")} تومان
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/admin/products/${product.productCode}/edit`,
                          )
                        }
                        className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white transition hover:bg-zinc-700"
                      >
                        ویرایش
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategoryProducts;
