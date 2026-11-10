import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProductByCode, updateProduct } from "../../services/api";
import AdminProductForm from "../components/AdminProductForm";

const AdminProductEdit = () => {
  const { productCode } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =================================================
  // دریافت محصول
  // =================================================

  useEffect(() => {
    let ignore = false;

    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getProductByCode(productCode);

        if (!data) {
          if (!ignore) {
            setProduct(null);
            setError("محصول پیدا نشد");
          }

          return;
        }

        if (!ignore) {
          setProduct(data);
        }
      } catch (error) {
        console.error("Load product error:", error);

        if (!ignore) {
          setProduct(null);
          setError(error.message || "خطا در دریافت اطلاعات محصول");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      ignore = true;
    };
  }, [productCode]);

  // =================================================
  // ذخیره تغییرات
  // =================================================

  const handleSubmit = async (data) => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await updateProduct(productCode, {
        title: data.title,
        categoryId: data.categoryId,
        count: data.count,
        color: data.color,
        price: data.price,
        description: data.description,
        specifications: data.specifications,
        images: data.images,
      });

      setSuccess("محصول با موفقیت ویرایش شد.");

      setTimeout(() => {
        navigate("/admin/products");
      }, 800);
    } catch (error) {
      console.error("Update product error:", error);

      setError(error.message || "خطا در ویرایش محصول");

      throw error;
    } finally {
      setSaving(false);
    }
  };

  // =================================================
  // Loading
  // =================================================

  if (loading) {
    return (
      <div
        dir="rtl"
        className="
          flex min-h-[40vh]
          items-center
          justify-center
          text-zinc-400
        "
      >
        در حال دریافت محصول...
      </div>
    );
  }

  // =================================================
  // Error
  // =================================================

  if (error && !product) {
    return (
      <div
        dir="rtl"
        className="
          flex min-h-[40vh]
          items-center
          justify-center
          text-red-400
        "
      >
        {error}
      </div>
    );
  }

  if (!product) {
    return null;
  }

  // =================================================
  // Edit
  // =================================================

  return (
    <div dir="rtl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">ویرایش محصول</h2>

        <p className="mt-2 text-sm text-zinc-400">
          کد محصول: {product.productCode}
        </p>
      </div>

      <AdminProductForm
        key={product.productCode}
        initialValues={{
          productCode: product.productCode || "",
          title: product.title || "",
          categoryId: product.categoryId ?? "",
          count: product.count ?? "",
          color: product.color || "",
          price: product.price ?? "",
          description: product.description || "",
          specifications: Array.isArray(product.specifications) ? product.specifications : [],
          images: Array.isArray(product.url) ? product.url : [],
        }}
        onSubmit={handleSubmit}
        submitText="ذخیره تغییرات"
        saving={saving}
        error={error}
        success={success}
      />
    </div>
  );
};

export default AdminProductEdit;
