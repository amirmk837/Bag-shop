import { useNavigate } from "react-router-dom";

import AdminProductForm from "../components/AdminProductForm";
import { createProduct } from "../../services/api";

const AdminProductCreate = () => {
  const navigate = useNavigate();

  const handleSubmit = async (data) => {
    await createProduct(data);

    navigate("/admin/products");
  };

  return (
    <div dir="rtl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">افزودن محصول</h2>

        <p className="mt-2 text-sm text-zinc-400">
          اطلاعات محصول جدید را وارد کنید.
        </p>
      </div>

      <AdminProductForm onSubmit={handleSubmit} submitText="ایجاد محصول" />
    </div>
  );
};

export default AdminProductCreate;
