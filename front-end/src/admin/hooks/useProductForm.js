import { useEffect, useState } from "react";
import { createProduct, getCategories } from "../../services/api";
import { initialProductForm } from "../constants/productForm";

const useProductForm = ({ onSuccess }) => {
  const [form, setForm] = useState(initialProductForm);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // =================================================
  // تغییر فیلد
  // =================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =================================================
  // دریافت دسته‌بندی‌ها
  // =================================================

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories();

        setCategories(data);
      } catch (error) {
        console.error("Categories error:", error);

        setError("خطا در دریافت دسته‌بندی‌ها");
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, []);

  // =================================================
  // ایجاد محصول
  // =================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await createProduct({
        productCode: form.productCode.trim(),
        title: form.title.trim(),
        brand: form.brand.trim(),
        count: Number(form.count),
        color: form.color.trim() || null,
        price: Number(form.price),
        description: form.description.trim() || null,
        images: form.images.filter(Boolean),
        categoryId: Number(form.categoryId),
      });

      setSuccess("محصول با موفقیت ایجاد شد.");

      onSuccess?.();
    } catch (error) {
      console.error("Create product error:", error);

      setError(error.message || "خطا در ایجاد محصول");
    } finally {
      setSaving(false);
    }
  };

  return {
    form,
    saving,
    error,
    success,
    categories,
    categoriesLoading,
    handleChange,
    handleSubmit,
    setForm,
    setError,
    setSuccess,
  };
};

export default useProductForm;
