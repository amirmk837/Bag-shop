import { useState } from "react";
import { deleteUser, updateUser } from "../../services/adminUserApi";
import { IoClose } from "react-icons/io5";

const permissionLabels = {
  MANAGE_PRODUCTS: "مدیریت محصولات",
  MANAGE_CATEGORIES: "مدیریت دسته‌بندی‌ها",
  VIEW_ORDERS: "مشاهده سفارش‌ها",
  MANAGE_ORDERS: "مدیریت سفارش‌ها",
  MANAGE_USERS: "مدیریت کاربران",
};

const formatDate = (date) => {
  if (!date) return "ثبت نشده";

  const parsed = new Date(date);

  return Number.isNaN(parsed.getTime())
    ? "ثبت نشده"
    : parsed.toLocaleDateString("fa-IR");
};

const formatPrice = (value) => Number(value || 0).toLocaleString("fa-IR");

const AdminUserModal = ({ data, onClose, onChanged }) => {
  const { user, orders } = data;

  const orderItems = orders?.items || [];

  const [role, setRole] = useState(user.role);
  const [permissions, setPermissions] = useState(user.permissions || []);
  const [isActive, setIsActive] = useState(user.isActive);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmUsername, setConfirmUsername] = useState("");
  const [error, setError] = useState("");

  // =========================================
  // PERMISSION
  // =========================================

  const togglePermission = (permission) => {
    setPermissions((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission],
    );
  };

  // =========================================
  // SAVE
  // =========================================

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      await updateUser(user.id, {
        role,
        permissions: role === "ADMIN" ? [] : permissions,
        isActive,
      });

      await onChanged();
    } catch (requestError) {
      setError(requestError.message || "ذخیره تغییرات ناموفق بود.");
    } finally {
      setSaving(false);
    }
  };

  // =========================================
  // DELETE
  // =========================================

  const handleDelete = async () => {
    if (confirmUsername !== user.username) {
      setError("نام کاربری واردشده صحیح نیست.");
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await deleteUser(user.id);

      await onChanged();
    } catch (requestError) {
      setError(requestError.message || "حذف دائمی کاربر ناموفق بود.");
    } finally {
      setDeleting(false);
    }
  };

  // =========================================
  // MODAL
  // =========================================

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-black/75 p-4
      "
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-user-modal-title"
        className="
          max-h-[92vh] w-full max-w-4xl
          overflow-y-auto overscroll-contain
          rounded-2xl border border-zinc-800
          bg-zinc-900 p-5 shadow-2xl sm:p-7
        "
        dir="rtl"
      >
        {/* HEADER */}

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 id="admin-user-modal-title" className="text-xl font-bold">
              {user.username}
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              عضویت از {formatDate(user.createdAt)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="بستن جزئیات کاربر"
            className="
              flex h-10 w-10 shrink-0
              items-center justify-center rounded-xl
              transition hover:bg-zinc-800
            "
          >
            <IoClose className="text-red-400" size={28} />
          </button>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* USER INFO */}

        <div className="grid gap-3 text-white sm:grid-cols-2 lg:grid-cols-4">
          <Info label="شماره موبایل" value={user.phone || "ثبت نشده"} />

          <Info
            label="تعداد سفارش تأییدشده"
            value={Number(user.orderCount || 0).toLocaleString("fa-IR")}
          />

          <Info
            label="بیشترین مبلغ سفارش"
            value={`${formatPrice(user.maxOrderAmount)} تومان`}
          />

          <Info
            label="مجموع خرید"
            value={`${formatPrice(user.totalSpent)} تومان`}
          />
        </div>

        {/* CUSTOMER ADDRESS */}

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
          <h4 className="font-bold text-emerald-300">آدرس ذخیره‌شده مشتری</h4>

          {user.address ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Info
                label="نام گیرنده"
                value={user.address.recipientName || "ثبت نشده"}
              />

              <Info
                label="شماره تماس گیرنده"
                value={user.address.recipientPhone || "ثبت نشده"}
              />

              <Info label="استان" value={user.address.province || "ثبت نشده"} />

              <Info label="شهر" value={user.address.city || "ثبت نشده"} />

              <Info
                label="کد پستی"
                value={user.address.postalCode || "ثبت نشده"}
              />

              <Info
                label="پلاک"
                value={user.address.plateNumber || "ثبت نشده"}
              />

              <Info
                label="واحد"
                value={user.address.unitNumber || "ثبت نشده"}
              />

              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:col-span-2 lg:col-span-3">
                <p className="text-xs text-zinc-500">نشانی کامل</p>

                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-zinc-200">
                  {user.address.addressLine || "ثبت نشده"}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">
              این مشتری هنوز آدرسی ثبت نکرده است.
            </p>
          )}
        </section>

        {/* ACCESS AND ACCOUNT STATUS */}

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
          <h4 className="font-bold text-amber-300">دسترسی و وضعیت حساب</h4>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-zinc-400">نقش</label>

              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="
                  w-full rounded-xl border border-zinc-700
                  bg-zinc-900 px-4 py-3 text-white outline-none
                "
              >
                <option value="USER">کاربر معمولی</option>
                <option value="ADMIN">مدیر</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                وضعیت حساب
              </label>

              <select
                value={isActive ? "active" : "inactive"}
                onChange={(event) =>
                  setIsActive(event.target.value === "active")
                }
                className="
                  w-full rounded-xl border border-zinc-700
                  bg-zinc-900 px-4 py-3 text-white outline-none
                "
              >
                <option value="active">فعال</option>
                <option value="inactive">غیرفعال</option>
              </select>
            </div>
          </div>

          {/* PERMISSIONS */}

          <div className="mt-6">
            <p className="mb-3 text-sm text-zinc-400">مجوزها</p>

            {role === "ADMIN" ? (
              <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4 text-sm text-amber-300">
                مدیر به تمام بخش‌های مدیریتی دسترسی دارد و نیازی به مجوز جداگانه
                ندارد.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(permissionLabels).map(([permission, label]) => (
                  <label
                    key={permission}
                    className="
                        flex cursor-pointer items-center gap-3
                        rounded-xl border border-zinc-800
                        bg-zinc-900 p-3
                      "
                  >
                    <input
                      type="checkbox"
                      checked={permissions.includes(permission)}
                      onChange={() => togglePermission(permission)}
                      className="h-4 w-4"
                    />

                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="
              mt-6 w-full rounded-xl
              bg-white/90 px-4 py-3
              font-bold text-zinc-900
              transition hover:bg-zinc-200
              disabled:cursor-not-allowed disabled:opacity-50
            "
          >
            {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </button>
        </section>

        {/* ORDERS */}

        <section className="mt-6">
          <h4 className="mb-3 font-bold text-blue-400">
            سابقه سفارش‌های تأییدشده
          </h4>

          {orderItems.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 text-sm text-zinc-400">
              این کاربر هنوز سفارش تأییدشده‌ای ندارد.
            </div>
          ) : (
            <div className="space-y-3">
              {orderItems.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">سفارش #{order.id}</p>

                      <p className="mt-1 text-xs text-zinc-500">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <p className="font-bold">
                      {formatPrice(order.totalAmount)} تومان
                    </p>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-zinc-500">
                    {(order.items || []).map((item) => (
                      <p key={item.id}>
                        {item.title}
                        {" × "}
                        {Number(item.quantity).toLocaleString("fa-IR")}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* DELETE USER */}

        <section className="mt-8 border-t border-zinc-800 pt-6">
          <button
            type="button"
            onClick={() => {
              setConfirmDelete(true);
              setConfirmUsername("");
              setError("");
            }}
            className="
              w-full rounded-xl border border-red-900/70
              bg-red-950/20 px-4 py-3
              font-semibold text-red-400
              transition hover:bg-red-950/40
            "
          >
            حذف کاربر
          </button>
        </section>

        {/* DELETE CONFIRMATION */}

        {confirmDelete && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="w-full max-w-md rounded-2xl border border-red-900/60 bg-zinc-950 p-6 shadow-2xl">
              <h4 className="text-xl font-bold text-red-400">حذف کاربر</h4>

              <p className="mt-3 text-sm leading-7 text-zinc-400">
                این عملیات برگشت‌ناپذیر است و حساب، اطلاعات ورود، آدرس و سبد خرید
                کاربر را کاملاً حذف می‌کند. سوابق مالی سفارش‌ها باقی می‌مانند،
                اما اطلاعات شخصی گیرنده از سفارش‌های قبلی پاک می‌شود.
              </p>

              <p className="mt-4 text-sm text-white">
                برای ادامه، نام کاربری زیر را دقیق وارد کن:
              </p>

              <div className="mt-2 rounded-lg bg-zinc-900 px-3 py-2 text-center font-bold">
                {user.username}
              </div>

              <input
                value={confirmUsername}
                onChange={(event) => setConfirmUsername(event.target.value)}
                placeholder="نام کاربری را دقیق وارد کنید"
                className="
                  mt-4 w-full rounded-xl border border-zinc-700
                  bg-zinc-900 px-4 py-3 text-white outline-none
                  focus:border-red-700
                "
              />

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="
                    rounded-xl bg-zinc-800 px-4 py-3
                    transition hover:bg-zinc-700
                  "
                >
                  انصراف
                </button>

                <button
                  type="button"
                  disabled={deleting || confirmUsername !== user.username}
                  onClick={handleDelete}
                  className="
                    rounded-xl bg-red-600 px-4 py-3
                    font-bold text-white transition hover:bg-red-700
                    disabled:cursor-not-allowed disabled:opacity-40
                  "
                >
                  {deleting ? "در حال حذف..." : "تأیید حذف"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Info = ({ label, value }) => (
  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
    <p className="text-xs text-zinc-500">{label}</p>

    <p className="mt-2 break-words font-semibold">{value}</p>
  </div>
);

export default AdminUserModal;
