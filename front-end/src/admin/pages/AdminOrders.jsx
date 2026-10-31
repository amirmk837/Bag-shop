import { useEffect, useState } from "react";
import { FiRefreshCw, FiSearch, FiTrash2 } from "react-icons/fi";

import FeedbackDialog from "../components/ui/FeedbackDialog";

import {
  deleteAdminOrder,
  getAdminOrders,
  getAdminOrderDetail,
  updateAdminOrderStatus,
  updateAdminOrderShipping,
} from "../../services/adminOrderApi";

const STATUS_LABELS = {
  PENDING: "در انتظار پرداخت",
  PAID: "پرداخت‌شده",
  CONFIRMED: "تأییدشده",
  PROCESSING: "در حال پردازش",
  SHIPPED: "ارسال‌شده",
  DELIVERED: "تحویل‌شده",
  CANCELLED: "لغوشده",
};

const STATUS_CLASSES = {
  PENDING: "bg-amber-950/40 text-amber-300",
  PAID: "bg-blue-950/40 text-blue-300",
  CONFIRMED: "bg-sky-950/40 text-sky-300",
  PROCESSING: "bg-violet-950/40 text-violet-300",
  SHIPPED: "bg-cyan-950/40 text-cyan-300",
  DELIVERED: "bg-emerald-950/40 text-emerald-300",
  CANCELLED: "bg-red-950/40 text-red-300",
};

const ALLOWED_NEXT_STATUSES = {
  PENDING: ["CANCELLED"],
  PAID: ["CONFIRMED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: ["PENDING"],
};

const DELETABLE_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "CANCELLED"];

const formatPrice = (value) => Number(value || 0).toLocaleString("fa-IR");

const formatDate = (value) => {
  if (!value) return "ثبت نشده";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "ثبت نشده";

  return date.toLocaleString("fa-IR");
};

const OrderStatus = ({ status }) => (
  <span
    className={`
      inline-flex whitespace-nowrap rounded-lg
      px-3 py-1.5 text-xs font-bold
      ${STATUS_CLASSES[status] || "bg-zinc-800 text-zinc-300"}
    `}
  >
    {STATUS_LABELS[status] || status || "نامشخص"}
  </span>
);

const DetailInfo = ({ label, value }) => (
  <div className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
    <p className="text-xs text-zinc-500">{label}</p>
    <p className="mt-2 break-words text-sm font-semibold text-zinc-200">
      {value || "ثبت نشده"}
    </p>
  </div>
);

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [statusDraft, setStatusDraft] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusSuccess, setStatusSuccess] = useState("");

  const [deletingOrderId, setDeletingOrderId] = useState(null);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [deleteDialogMessage, setDeleteDialogMessage] = useState("");

  const [shippingMethod, setShippingMethod] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [updatingShipping, setUpdatingShipping] = useState(false);
  const [shippingSuccess, setShippingSuccess] = useState("");

  // جست‌وجوی تأخیری
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPagination((current) => ({ ...current, page: 1 }));
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // دریافت سفارش‌ها
  useEffect(() => {
    let ignore = false;

    const loadOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getAdminOrders({
          page: pagination.page,
          pageSize: pagination.pageSize,
          status,
          search,
        });

        if (ignore) return;

        setOrders(data.items);
        setPagination((current) => ({
          ...current,
          ...data.pagination,
        }));
      } catch (err) {
        if (!ignore) {
          setError(err.message || "دریافت سفارش‌ها ناموفق بود.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadOrders();

    return () => {
      ignore = true;
    };
  }, [pagination.page, pagination.pageSize, search, status, refreshKey]);

  const openOrder = async (orderId) => {
    setModalOpen(true);
    setSelectedOrder(null);
    setStatusDraft("");
    setDetailError("");
    setStatusSuccess("");
    setShippingSuccess("");
    setDetailLoading(true);

    try {
      const order = await getAdminOrderDetail(orderId);

      setSelectedOrder(order);
      setShippingMethod(order.shippingMethod || "");
      setTrackingCode(order.trackingCode || "");
      setStatusDraft(order.status);
    } catch (err) {
      setDetailError(err.message || "دریافت جزئیات سفارش ناموفق بود.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    if (updatingStatus || updatingShipping || deletingOrderId !== null) {
      return;
    }

    setModalOpen(false);
    setSelectedOrder(null);
    setDetailError("");
    setStatusSuccess("");
    setShippingSuccess("");
  };

  const handleStatusUpdate = async () => {
    if (
      !selectedOrder ||
      !statusDraft ||
      statusDraft === selectedOrder.status ||
      updatingStatus
    ) {
      return;
    }

    if (statusDraft === "CANCELLED") {
      if (
        !window.confirm(
          "از لغو این سفارش مطمئن هستید؟ موجودی باید طبق منطق بک‌اند مدیریت شود.",
        )
      ) {
        return;
      }
    }

    if (selectedOrder.status === "CANCELLED" && statusDraft === "PENDING") {
      if (!window.confirm("سفارش دوباره فعال می‌شود. آیا ادامه می‌دهید؟")) {
        return;
      }
    }

    try {
      setUpdatingStatus(true);
      setDetailError("");
      setStatusSuccess("");

      const result = await updateAdminOrderStatus(
        selectedOrder.id,
        statusDraft,
      );

      if (!result?.order) {
        throw new Error("پاسخ سرور برای تغییر وضعیت معتبر نیست.");
      }

      setSelectedOrder(result.order);
      setStatusDraft(result.order.status);
      setStatusSuccess(result.message || "وضعیت سفارش تغییر کرد.");
      setRefreshKey((current) => current + 1);
    } catch (err) {
      setDetailError(err.message || "تغییر وضعیت سفارش ناموفق بود.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleShippingUpdate = async () => {
    if (!selectedOrder || updatingShipping) return;

    const method = shippingMethod.trim();
    const tracking = trackingCode.trim();

    if (!method || !tracking) {
      setDetailError("روش ارسال و کد رهگیری را وارد کنید.");
      return;
    }

    if (method.length > 100 || tracking.length > 100) {
      setDetailError("هر فیلد حداکثر باید ۱۰۰ کاراکتر باشد.");
      return;
    }

    try {
      setUpdatingShipping(true);
      setDetailError("");
      setShippingSuccess("");

      const result = await updateAdminOrderShipping(selectedOrder.id, {
        shippingMethod: method,
        trackingCode: tracking,
      });

      if (!result?.order) {
        throw new Error("پاسخ سرور برای ثبت اطلاعات ارسال معتبر نیست.");
      }

      setSelectedOrder(result.order);
      setShippingMethod(result.order.shippingMethod || "");
      setTrackingCode(result.order.trackingCode || "");
      setShippingSuccess(result.message || "اطلاعات ارسال ثبت شد.");
      setRefreshKey((current) => current + 1);
    } catch (err) {
      setDetailError(err.message || "ثبت اطلاعات ارسال ناموفق بود.");
    } finally {
      setUpdatingShipping(false);
    }
  };

  const handleDeleteOrder = (order) => {
    if (!order || deletingOrderId !== null) return;

    if (!DELETABLE_STATUSES.includes(order.status)) {
      setError("حذف این سفارش با وضعیت فعلی مجاز نیست.");
      return;
    }

    const stockMessage =
      order.status === "CANCELLED"
        ? "سفارش قبلاً لغو شده است؛ وضعیت موجودی باید در بک‌اند کنترل شود."
        : "بک‌اند باید قبل از حذف، وضعیت موجودی را به‌درستی مدیریت کند.";

    setError("");
    setDeleteDialogMessage(
      `آیا از حذف دائمی سفارش شماره ${order.id} مطمئن هستید؟\n\n${stockMessage}\n\nاین عملیات قابل بازگشت نیست.`,
    );
    setOrderToDelete(order);
  };

  const confirmDeleteOrder = async () => {
    const order = orderToDelete;

    if (!order || deletingOrderId !== null) return false;

    try {
      setDeletingOrderId(order.id);
      setError("");
      setDetailError("");
      setNotice("");

      const result = await deleteAdminOrder(order.id);

      if (selectedOrder?.id === order.id) {
        setModalOpen(false);
        setSelectedOrder(null);
      }

      setNotice(result?.message || `سفارش شماره ${order.id} حذف شد.`);
      setOrderToDelete(null);
      setDeleteDialogMessage("");
      setRefreshKey((current) => current + 1);

      return true;
    } catch (err) {
      const message = err.message || "حذف سفارش ناموفق بود.";

      setError(message);
      setDetailError(message);
      setDeleteDialogMessage(
        `${message}\n\nبرای تلاش مجدد، دکمه تأیید را بزنید.`,
      );

      return false;
    } finally {
      setDeletingOrderId(null);
    }
  };

  const closeDeleteDialog = () => {
    if (deletingOrderId !== null) return;

    setOrderToDelete(null);
    setDeleteDialogMessage("");
  };

  return (
    <div dir="rtl" className="text-white">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black">مدیریت سفارش‌ها</h2>
          <p className="mt-2 text-sm text-zinc-400">
            مشاهده سفارش مشتریان و مدیریت وضعیت ارسال
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            مجموع سفارش‌ها:{" "}
            {Number(pagination.total || 0).toLocaleString("fa-IR")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setNotice("");
            setRefreshKey((current) => current + 1);
          }}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm transition hover:bg-zinc-800 disabled:opacity-50"
        >
          <FiRefreshCw />
          تازه‌سازی
        </button>
      </div>

      {notice && (
        <div className="mb-5 rounded-xl border border-emerald-900/50 bg-emerald-950/30 p-4 text-sm text-emerald-400">
          {notice}
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="mb-6 grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 md:grid-cols-[1fr_240px]">
        <div className="relative">
          <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
              setNotice("");
              setError("");
            }}
            placeholder="شماره سفارش، نام کاربری یا شماره تماس..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-3 pl-4 pr-11 text-white outline-none focus:border-zinc-400"
          />
        </div>

        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setNotice("");
            setPagination((current) => ({ ...current, page: 1 }));
          }}
          className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none"
        >
          <option value="all">همه وضعیت‌ها</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-right">
            <thead className="border-b border-zinc-800 bg-zinc-950/70">
              <tr>
                {[
                  "سفارش",
                  "مشتری",
                  "تاریخ",
                  "تعداد اقلام",
                  "مبلغ",
                  "وضعیت",
                  "عملیات",
                ].map((label) => (
                  <th key={label} className="px-4 py-4 text-sm text-zinc-400">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-zinc-500"
                  >
                    در حال دریافت سفارش‌ها...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-zinc-500"
                  >
                    سفارشی با این مشخصات پیدا نشد.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const itemCount = (order.items || []).reduce(
                    (total, item) => total + Number(item.quantity || 0),
                    0,
                  );
                  const canDelete = DELETABLE_STATUSES.includes(order.status);

                  return (
                    <tr
                      key={order.id}
                      className="border-b border-zinc-800 transition hover:bg-zinc-800/40 last:border-b-0"
                    >
                      <td className="whitespace-nowrap px-4 py-4 font-bold">
                        #{order.id}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium">
                          {order.user?.username || "کاربر حذف‌شده"}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {order.user?.phone || "شماره ثبت نشده"}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-zinc-400">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        {itemCount.toLocaleString("fa-IR")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-bold">
                        {formatPrice(order.totalAmount)} تومان
                      </td>
                      <td className="px-4 py-4">
                        <OrderStatus status={order.status} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openOrder(order.id)}
                            className="whitespace-nowrap rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800"
                          >
                            جزئیات
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(order)}
                            disabled={
                              deletingOrderId === order.id || !canDelete
                            }
                            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-red-900/60 px-3 py-2 text-sm text-red-400 transition hover:bg-red-950/50 disabled:cursor-not-allowed disabled:opacity-35"
                          >
                            <FiTrash2 />
                            {deletingOrderId === order.id
                              ? "در حال حذف..."
                              : "حذف"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && pagination.totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() =>
              setPagination((current) => ({
                ...current,
                page: current.page - 1,
              }))
            }
            className="rounded-xl bg-zinc-800 px-4 py-2 text-sm transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            قبلی
          </button>

          <span className="text-sm text-zinc-400">
            صفحه {Number(pagination.page).toLocaleString("fa-IR")} از{" "}
            {Number(pagination.totalPages).toLocaleString("fa-IR")}
          </span>

          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() =>
              setPagination((current) => ({
                ...current,
                page: current.page + 1,
              }))
            }
            className="rounded-xl bg-zinc-800 px-4 py-2 text-sm transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            بعدی
          </button>
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-detail-title"
            className="max-h-[92vh] w-full max-w-4xl overflow-y-auto overscroll-contain rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl sm:p-7"
          >
            {detailLoading ? (
              <div className="py-16 text-center text-zinc-400">
                در حال دریافت جزئیات سفارش...
              </div>
            ) : detailError && !selectedOrder ? (
              <>
                <p className="text-red-400">{detailError}</p>
                <button
                  type="button"
                  onClick={closeModal}
                  className="mt-5 rounded-xl bg-zinc-800 px-4 py-2"
                >
                  بستن
                </button>
              </>
            ) : selectedOrder ? (
              <>
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <h3
                      id="order-detail-title"
                      className="text-xl font-black sm:text-2xl"
                    >
                      جزئیات سفارش #{selectedOrder.id}
                    </h3>
                    <p className="mt-2 text-sm text-zinc-500">
                      تاریخ ثبت: {formatDate(selectedOrder.createdAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={
                      updatingStatus ||
                      updatingShipping ||
                      deletingOrderId === selectedOrder.id
                    }
                    className="rounded-xl border border-zinc-700 px-3 py-2 text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-50"
                  >
                    بستن
                  </button>
                </div>

                <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="mb-2 text-sm text-zinc-500">وضعیت فعلی</p>
                      <OrderStatus status={selectedOrder.status} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-zinc-500">مبلغ سفارش</p>
                      <p className="mt-1 text-xl font-black">
                        {formatPrice(selectedOrder.totalAmount)} تومان
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-zinc-800 pt-5">
                    <label className="mb-2 block text-sm text-zinc-400">
                      تغییر وضعیت سفارش
                    </label>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <select
                        value={statusDraft}
                        onChange={(event) => {
                          setStatusDraft(event.target.value);
                          setDetailError("");
                          setStatusSuccess("");
                        }}
                        disabled={
                          updatingStatus ||
                          !(ALLOWED_NEXT_STATUSES[selectedOrder.status] || [])
                            .length
                        }
                        className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-zinc-400 disabled:opacity-60"
                      >
                        <option value={selectedOrder.status}>
                          {STATUS_LABELS[selectedOrder.status] ||
                            selectedOrder.status}
                        </option>
                        {(
                          ALLOWED_NEXT_STATUSES[selectedOrder.status] || []
                        ).map((nextStatus) => (
                          <option key={nextStatus} value={nextStatus}>
                            {STATUS_LABELS[nextStatus]}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleStatusUpdate}
                        disabled={
                          updatingStatus ||
                          statusDraft === selectedOrder.status ||
                          !(ALLOWED_NEXT_STATUSES[selectedOrder.status] || [])
                            .length
                        }
                        className="rounded-xl bg-white px-5 py-3 font-bold text-zinc-900 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {updatingStatus ? "در حال ذخیره..." : "ذخیره وضعیت"}
                      </button>
                    </div>
                    {selectedOrder.status === "CANCELLED" && (
                      <p className="mt-3 text-xs leading-6 text-amber-300">
                        فعال‌سازی دوباره سفارش باید در بک‌اند همراه با کنترل
                        موجودی انجام شود.
                      </p>
                    )}
                    {detailError && (
                      <p className="mt-4 rounded-xl bg-red-950/30 p-3 text-sm text-red-400">
                        {detailError}
                      </p>
                    )}
                    {statusSuccess && (
                      <p className="mt-4 rounded-xl bg-emerald-950/30 p-3 text-sm text-emerald-400">
                        {statusSuccess}
                      </p>
                    )}
                  </div>
                </section>

                <section className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                  <h4 className="mb-4 font-bold text-emerald-300">
                    اطلاعات مشتری و آدرس زمان سفارش
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <DetailInfo
                      label="نام کاربری"
                      value={selectedOrder.user?.username}
                    />
                    <DetailInfo
                      label="شماره تماس حساب"
                      value={selectedOrder.user?.phone}
                    />
                    <DetailInfo
                      label="نام گیرنده"
                      value={selectedOrder.shippingRecipientName}
                    />
                    <DetailInfo
                      label="شماره تماس گیرنده"
                      value={selectedOrder.shippingRecipientPhone}
                    />
                    <DetailInfo
                      label="استان"
                      value={selectedOrder.shippingProvince}
                    />
                    <DetailInfo
                      label="شهر"
                      value={selectedOrder.shippingCity}
                    />
                    <DetailInfo
                      label="کد پستی"
                      value={selectedOrder.shippingPostalCode}
                    />
                    <DetailInfo
                      label="پلاک"
                      value={selectedOrder.shippingPlateNumber}
                    />
                    <DetailInfo
                      label="واحد"
                      value={selectedOrder.shippingUnitNumber}
                    />
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:col-span-2 lg:col-span-3">
                      <p className="text-xs text-zinc-500">نشانی کامل</p>
                      <p className="mt-2 break-words text-sm leading-7 text-zinc-200">
                        {selectedOrder.shippingAddressLine || "آدرس ثبت نشده"}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                  <h4 className="mb-4 font-bold text-cyan-300">
                    اطلاعات ارسال و پیگیری مرسوله
                  </h4>
                  <div className="mb-5 grid gap-3">
                    <DetailInfo
                      label="تاریخ ارسال"
                      value={formatDate(selectedOrder.shippedAt)}
                    />
                  </div>

                  {selectedOrder.status === "PROCESSING" ? (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="shipping-method"
                            className="mb-2 block text-sm text-zinc-400"
                          >
                            روش ارسال
                          </label>
                          <input
                            id="shipping-method"
                            type="text"
                            maxLength={100}
                            value={shippingMethod}
                            onChange={(event) => {
                              setShippingMethod(event.target.value);
                              setDetailError("");
                              setShippingSuccess("");
                            }}
                            placeholder="مثلاً پست یا تیپاکس"
                            disabled={updatingShipping}
                            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-cyan-500 disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="tracking-code"
                            className="mb-2 block text-sm text-zinc-400"
                          >
                            کد رهگیری
                          </label>
                          <input
                            id="tracking-code"
                            type="text"
                            maxLength={100}
                            value={trackingCode}
                            onChange={(event) => {
                              setTrackingCode(event.target.value);
                              setDetailError("");
                              setShippingSuccess("");
                            }}
                            placeholder="کد رهگیری مرسوله"
                            disabled={updatingShipping}
                            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-cyan-500 disabled:opacity-50"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleShippingUpdate}
                        disabled={updatingShipping}
                        className="mt-4 rounded-xl bg-cyan-600 px-5 py-3 font-bold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {updatingShipping
                          ? "در حال ذخیره..."
                          : "ثبت اطلاعات ارسال"}
                      </button>
                      <p className="mt-3 text-xs leading-6 text-zinc-500">
                        پس از ثبت اطلاعات ارسال، وضعیت سفارش را به «ارسال‌شده»
                        تغییر بده.
                      </p>
                    </>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <DetailInfo
                        label="روش ارسال"
                        value={selectedOrder.shippingMethod}
                      />
                      <DetailInfo
                        label="کد رهگیری"
                        value={selectedOrder.trackingCode}
                      />
                    </div>
                  )}

                  {shippingSuccess && (
                    <p className="mt-4 rounded-xl bg-emerald-950/30 p-3 text-sm text-emerald-400">
                      {shippingSuccess}
                    </p>
                  )}
                </section>

                <section className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                  <h4 className="mb-4 font-bold">اقلام سفارش</h4>
                  {(selectedOrder.items || []).length === 0 ? (
                    <p className="text-sm text-zinc-500">
                      کالایی در این سفارش ثبت نشده است.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[700px] text-right">
                        <thead>
                          <tr className="border-b border-zinc-800 text-sm text-zinc-500">
                            {[
                              "محصول",
                              "رنگ",
                              "کد",
                              "تعداد",
                              "قیمت واحد",
                              "جمع",
                            ].map((label) => (
                              <th key={label} className="px-3 py-3">
                                {label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.items.map((item) => (
                            <tr
                              key={item.id}
                              className="border-b border-zinc-800/70 last:border-0"
                            >
                              <td className="px-3 py-4 font-medium">
                                {item.title}
                              </td>
                              <td className="px-3 py-4 text-sm">
                                {item.color || "—"}
                              </td>
                              <td className="px-3 py-4 text-sm text-zinc-400">
                                {item.productCode}
                              </td>
                              <td className="px-3 py-4">
                                {Number(item.quantity).toLocaleString("fa-IR")}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4">
                                {formatPrice(item.unitPrice)} تومان
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 font-bold">
                                {formatPrice(item.subtotal)} تومان
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <div className="mt-5 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => handleDeleteOrder(selectedOrder)}
                    disabled={
                      !DELETABLE_STATUSES.includes(selectedOrder.status) ||
                      deletingOrderId === selectedOrder.id ||
                      updatingStatus ||
                      updatingShipping
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-red-900/60 px-5 py-3 text-sm text-red-400 transition hover:bg-red-950/50 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <FiTrash2 />
                    {deletingOrderId === selectedOrder.id
                      ? "در حال حذف..."
                      : "حذف سفارش"}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={
                      updatingStatus ||
                      updatingShipping ||
                      deletingOrderId === selectedOrder.id
                    }
                    className="rounded-xl border border-zinc-700 px-5 py-3 text-sm transition hover:bg-zinc-800 disabled:opacity-50"
                  >
                    بستن جزئیات
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      <FeedbackDialog
        open={Boolean(orderToDelete)}
        type="confirm"
        title={`حذف سفارش شماره ${orderToDelete?.id ?? ""}`}
        message={deleteDialogMessage}
        confirmText={deletingOrderId ? "در حال حذف..." : "حذف دائمی سفارش"}
        cancelText="انصراف"
        onConfirm={confirmDeleteOrder}
        onClose={closeDeleteDialog}
      />
    </div>
  );
};

export default AdminOrders;
