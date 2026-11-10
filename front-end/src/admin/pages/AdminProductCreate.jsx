import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { createProduct } from "../../services/api";

import AdminProductForm from "../components/AdminProductForm";

const AdminProductCreate = () => {
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =================================================
  // ایجاد محصول
  // =================================================

  const handleSubmit = async (data) => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const createdProduct = await createProduct({
        productCode: data.productCode,
        title: data.title,
        categoryId: data.categoryId,
        count: data.count,
        color: data.color,
        price: data.price,
        discountedPrice: data.discountedPrice,
        description: data.description,
        images: data.images,
      });

      if ((createdProduct.discountedPrice ?? null) !== data.discountedPrice) {
        throw new Error("سرور قیمت پس از تخفیف را با مقدار ثبت‌شده برنگرداند؛ ذخیره را بررسی کنید.");
      }

      setSuccess("محصول با موفقیت ایجاد شد.");

      setTimeout(() => {
        navigate("/admin/products");
      }, 800);
    } catch (error) {
      console.error("Create product error:", error);

      setError(error.message || "خطا در ایجاد محصول");

      throw error;
    } finally {
      setSaving(false);
    }
  };

  return (
    <div dir="rtl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">افزودن محصول</h2>

        <p className="mt-2 text-sm text-zinc-400">
          اطلاعات محصول جدید را وارد کنید.
        </p>
      </div>

      <AdminProductForm
        onSubmit={handleSubmit}
        submitText="ایجاد محصول"
        saving={saving}
        error={error}
        success={success}
      />
    </div>
  );
};

export default AdminProductCreate;
