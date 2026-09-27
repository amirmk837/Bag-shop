import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteProduct, getProducts } from "../../services/api";

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState("");

  // =================================================
  // دریافت محصولات
  // =================================================

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getProducts();

        setProducts(data);
      } catch (error) {
        console.error("Admin products error:", error);
        setError("خطا در دریافت محصولات");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // =================================================
  // حذف محصول
  // =================================================

  const handleDelete = async (productCode) => {
    const confirmed = window.confirm(
      `آیا از حذف محصول ${productCode} مطمئن هستید؟`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(productCode);

      await deleteProduct(productCode);

      setProducts((prev) =>
        prev.filter((product) => product.productCode !== productCode),
      );
    } catch (error) {
      console.error("Delete product error:", error);

      window.alert(error.message || "خطا در حذف محصول");
    } finally {
      setDeleting("");
    }
  };

  // =================================================
  // Loading
  // =================================================

  if (loading) {
    return (
      <div className="py-10 text-center text-zinc-400">
        در حال دریافت محصولات...
      </div>
    );
  }

  // =================================================
  // Error
  // =================================================

  if (error) {
    return <div className="py-10 text-center text-red-400">{error}</div>;
  }

  // =================================================
  // Render
  // =================================================

  return (
    <div dir="rtl">
      {/* ================================================= */}
      {/* Header */}
      {/* ================================================= */}

      <div
        className="
          mb-6
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div>
          <h2 className="text-2xl font-bold">مدیریت محصولات</h2>

          <p className="mt-2 text-sm text-zinc-400">{products.length} محصول</p>
        </div>

        {/* افزودن محصول */}

        <Link
          to="/admin/products/create"
          className="
            inline-flex
            items-center
            justify-center
            rounded-xl
            bg-white
            px-5
            py-3
            text-sm
            font-bold
            text-zinc-900
            transition
            hover:bg-zinc-200
          "
        >
          افزودن محصول
        </Link>
      </div>

      {/* ================================================= */}
      {/* Empty */}
      {/* ================================================= */}

      {products.length === 0 ? (
        <div
          className="
            rounded-2xl
            border
            border-zinc-800
            bg-zinc-900
            p-10
            text-center
            text-zinc-500
          "
        >
          هیچ محصولی وجود ندارد.
        </div>
      ) : (
        /* ================================================= */
        /* Table */
        /* ================================================= */

        <div
          className="
            overflow-x-auto
            rounded-2xl
            border
            border-zinc-800
            bg-zinc-900
          "
        >
          <table className="w-full min-w-[950px] text-right">
            <thead className="bg-zinc-800/60">
              <tr>
                <th className="px-4 py-4">کد محصول</th>

                <th className="px-4 py-4">عنوان</th>

                <th className="px-4 py-4">برند</th>

                <th className="px-4 py-4">موجودی</th>

                <th className="px-4 py-4">قیمت</th>

                <th className="px-4 py-4">عملیات</th>
              </tr>
            </thead>

            <tbody>
              {products.map((product) => (
                <tr
                  key={product.productCode}
                  className="
                    border-t
                    border-zinc-800
                    transition
                    hover:bg-zinc-800/30
                  "
                >
                  {/* کد */}

                  <td className="px-4 py-4 font-medium">
                    {product.productCode}
                  </td>

                  {/* عنوان */}

                  <td className="max-w-[280px] px-4 py-4">
                    <span
                      className="
                        block
                        truncate
                        text-zinc-300
                      "
                      title={product.title || product.productCode}
                    >
                      {product.title || product.productCode}
                    </span>
                  </td>

                  {/* برند */}

                  <td className="px-4 py-4 text-zinc-400">{product.brand}</td>

                  {/* موجودی */}

                  <td className="px-4 py-4">{product.count}</td>

                  {/* قیمت */}

                  <td className="px-4 py-4">
                    {Number(product.price || 0).toLocaleString("fa-IR")} تومان
                  </td>

                  {/* عملیات */}

                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {/* ویرایش */}

                      <Link
                        to={`/admin/products/${product.productCode}/edit`}
                        className="
                          inline-flex
                          items-center
                          justify-center
                          rounded-lg
                          bg-zinc-800
                          px-3
                          py-2
                          text-sm
                          font-medium
                          text-white
                          transition
                          hover:bg-zinc-700
                        "
                      >
                        ویرایش
                      </Link>

                      {/* حذف */}

                      <button
                        type="button"
                        disabled={deleting === product.productCode}
                        onClick={() => handleDelete(product.productCode)}
                        className="
                          rounded-lg
                          bg-red-950/50
                          px-3
                          py-2
                          text-sm
                          font-medium
                          text-red-400
                          transition
                          hover:bg-red-950
                          disabled:cursor-not-allowed
                          disabled:opacity-50
                        "
                      >
                        {deleting === product.productCode
                          ? "در حال حذف..."
                          : "حذف"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
