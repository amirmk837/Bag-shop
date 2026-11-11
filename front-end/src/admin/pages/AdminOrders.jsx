import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FiRefreshCw, FiSearch, FiArchive, FiRotateCcw } from "react-icons/fi";

import {
  archiveAdminOrder,
  restoreAdminOrder,
  updateAdminOrderItemInventoryReturn,
  resolveInventoryReturnIssue,
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
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const period = searchParams.get("period") || (from && to ? "custom" : "all");
  const searchParamsKey = searchParams.toString();
  const [previousSearchParamsKey, setPreviousSearchParamsKey] = useState(searchParamsKey);

  if (previousSearchParamsKey !== searchParamsKey) {
    setPreviousSearchParamsKey(searchParamsKey);
    setPagination((current) => ({ ...current, page: 1 }));
  }

  const [modalOpen, setModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [statusDraft, setStatusDraft] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusSuccess, setStatusSuccess] = useState("");

  const [archiveMode, setArchiveMode] = useState("active");
  const [archivingOrderId, setArchivingOrderId] = useState(null);
  const [restoringOrderId, setRestoringOrderId] = useState(null);
  const [inventoryUpdatingId, setInventoryUpdatingId] = useState(null);
  const [resolvingIssueId, setResolvingIssueId] = useState(null);

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
          from,
          to,
          period,
          sortBy,
          sortOrder: "desc",
          archiveMode,
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

    void Promise.resolve().then(loadOrders);

    return () => {
      ignore = true;
    };
  }, [pagination.page, pagination.pageSize, search, status, from, to, period, sortBy, archiveMode, refreshKey]);

  const openOrder = useCallback(async (orderId) => {
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
  }, []);

  useEffect(() => {
    const orderId = searchParams.get("orderId");
    if (orderId) void Promise.resolve().then(() => openOrder(orderId));
  }, [searchParams, openOrder]);

  const closeModal = () => {
    if (updatingStatus || updatingShipping || archivingOrderId !== null || restoringOrderId !== null || inventoryUpdatingId !== null || resolvingIssueId !== null) {
      return;
    }

    setModalOpen(false);
    setSelectedOrder(null);
    if (searchParams.has("orderId")) setSearchParams({}, { replace: true });
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

  const handleArchiveOrder = async (order) => {
    if (!order || archivingOrderId !== null) return;
    if (!window.confirm("آیا از انتقال سفارش شماره " + order.id + " به آرشیو مطمئن هستید؟ سوابق مالی و سفارش حفظ می‌شوند.")) return;
    const reason = window.prompt("علت آرشیو سفارش را وارد کنید (حداقل ۵ نویسه):", "");
    if (!reason || reason.trim().length < 5) {
      setError("برای آرشیو سفارش، علت معتبر الزامی است.");
      return;
    }
    let returnStock = false;
    if (!["SHIPPED", "DELIVERED"].includes(order.status)) {
      returnStock = window.confirm("آیا موجودی رزروشده این سفارش نیز به انبار برگردد؟ اگر «خیر» را بزنید، رزرو موجودی حفظ می‌شود.");
    }
    try {
      setArchivingOrderId(order.id);
      setError("");
      setDetailError("");
      const result = await archiveAdminOrder(order.id, { reason: reason.trim(), returnStock });
      if (selectedOrder?.id === order.id) setSelectedOrder(result.order);
      setNotice(result.message || "سفارش به آرشیو منتقل شد.");
      setRefreshKey((current) => current + 1);
    } catch (err) {
      const message = err.message || "آرشیو سفارش ناموفق بود.";
      setError(message);
      setDetailError(message);
    } finally {
      setArchivingOrderId(null);
    }
  };

  const handleRestoreOrder = async (order) => {
    if (!order || restoringOrderId !== null) return;
    if (!window.confirm("سفارش شماره " + order.id + " از آرشیو خارج شود؟ اگر موجودی قبلاً آزاد شده باشد، سرور ابتدا رزرو مجدد را کنترل می‌کند.")) return;
    try {
      setRestoringOrderId(order.id);
      setError("");
      setDetailError("");
      const result = await restoreAdminOrder(order.id);
      if (selectedOrder?.id === order.id) setSelectedOrder(result.order);
      setNotice(result.message || "سفارش بازیابی شد.");
      setRefreshKey((current) => current + 1);
    } catch (err) {
      const message = err.message || "بازیابی سفارش ناموفق بود.";
      setError(message);
      setDetailError(message);
    } finally {
      setRestoringOrderId(null);
    }
  };

  const handleInventoryReturn = async (item) => {
    if (!selectedOrder || inventoryUpdatingId !== null) return;
    const received = window.confirm("آیا این کالا به‌صورت فیزیکی به فروشگاه برگشته است؟");
    const saleable = received && window.confirm("آیا کالا سالم و قابل فروش مجدد است؟");
    let reason = "";
    if (!received || !saleable) {
      reason = window.prompt("علت دریافت‌نشدن یا غیرقابل‌فروش بودن کالا را وارد کنید:", "") || "";
      if (reason.trim().length < 5) {
        setDetailError("برای ثبت کالای نیازمند بررسی، علت حداقل ۵ نویسه‌ای الزامی است.");
        return;
      }
    }
    try {
      setInventoryUpdatingId(item.id);
      setDetailError("");
      const result = await updateAdminOrderItemInventoryReturn(selectedOrder.id, item.id, {
        received, saleable, reason: reason.trim(),
      });
      setSelectedOrder(result.order);
      setStatusSuccess(result.message || "وضعیت بازگشت کالا ثبت شد.");
      setRefreshKey((current) => current + 1);
    } catch (err) {
      setDetailError(err.message || "ثبت بازگشت موجودی ناموفق بود.");
    } finally {
      setInventoryUpdatingId(null);
    }
  };

  const handleResolveInventoryIssue = async (issue) => {
    if (!issue || resolvingIssueId !== null) return;
    const returnStock = window.confirm("آیا مشکل برطرف شده و کالا اکنون سالم، قابل فروش و آماده بازگشت به موجودی است؟ با انتخاب «خیر»، مشکل بدون تغییر موجودی بسته می‌شود.");
    const resolutionNote = window.prompt("توضیح تصمیم مدیر (حداقل ۳ نویسه):", "") || "";
    if (resolutionNote.trim().length < 3) {
      setDetailError("توضیح تعیین‌تکلیف باید حداقل ۳ نویسه باشد.");
      return;
    }
    try {
      setResolvingIssueId(issue.id);
      setDetailError("");
      const result = await resolveInventoryReturnIssue(issue.id, {
        action: returnStock ? "RETURN_STOCK" : "DISMISS",
        resolutionNote: resolutionNote.trim(),
      });
      const refreshed = await getAdminOrderDetail(selectedOrder.id);
      setSelectedOrder(refreshed);
      setStatusSuccess(result.message || "مشکل بازگشت موجودی تعیین‌تکلیف شد.");
      setRefreshKey((current) => current + 1);
    } catch (err) {
      setDetailError(err.message || "تعیین‌تکلیف مشکل ناموفق بود.");
    } finally {
      setResolvingIssueId(null);
    }
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

      <div className="mb-6 grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 md:grid-cols-[minmax(0,1fr)_180px_180px_180px_200px]">
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
          value={period}
          onChange={(event) => {
            const value = event.target.value;
            setSearchParams(value === "all" ? {} : { period: value }, { replace: true });
            setPagination((current) => ({ ...current, page: 1 }));
          }}
          className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none"
        >
          <option value="month">یک ماه اخیر</option>
          <option value="3months">سه ماه اخیر</option>
          <option value="12months">۱۲ ماه اخیر</option>
          <option value="all">تمام سفارش‌ها</option>
          {period === "custom" && <option value="custom">ماه انتخاب‌شده در نمودار</option>}
        </select>
        <select
          value={archiveMode}
          onChange={(event) => {
            setArchiveMode(event.target.value);
            setPagination((current) => ({ ...current, page: 1 }));
          }}
          aria-label="فیلتر آرشیو سفارش‌ها"
          className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none"
        >
          <option value="active">سفارش‌های فعال</option>
          <option value="archived">سفارش‌های آرشیوشده</option>
          <option value="all">همه سفارش‌ها</option>
        </select>

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
        <select
          value={sortBy}
          onChange={(event) => {
            setSortBy(event.target.value);
            setPagination((current) => ({ ...current, page: 1 }));
          }}
          aria-label="مرتب‌سازی سفارش‌ها"
          className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none"
        >
          <option value="createdAt">جدیدترین سفارش‌ها</option>
          <option value="totalAmount">گران‌ترین سفارش‌ها</option>
          <option value="itemQuantity">بیشترین تعداد محصول</option>
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
                  const isArchived = Boolean(order.archivedAt);

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
                          {isArchived ? (
                            <button type="button" onClick={() => handleRestoreOrder(order)}
                              disabled={restoringOrderId === order.id}
                              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-emerald-800/70 px-3 py-2 text-sm text-emerald-300 transition hover:bg-emerald-950/40 disabled:opacity-40">
                              <FiRotateCcw />
                              {restoringOrderId === order.id ? "در حال بازیابی..." : "بازیابی"}
                            </button>
                          ) : (
                            <button type="button" onClick={() => handleArchiveOrder(order)}
                              disabled={archivingOrderId === order.id}
                              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-amber-800/70 px-3 py-2 text-sm text-amber-300 transition hover:bg-amber-950/40 disabled:opacity-40">
                              <FiArchive />
                              {archivingOrderId === order.id ? "در حال آرشیو..." : "آرشیو"}
                            </button>
                          )}
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
                    {selectedOrder.archivedAt && (
                      <p className="mt-2 rounded-lg border border-amber-900/50 bg-amber-950/20 p-3 text-xs leading-6 text-amber-200">
                        این سفارش در تاریخ {formatDate(selectedOrder.archivedAt)} آرشیو شده است.
                        {selectedOrder.archiveReason ? ` علت: ${selectedOrder.archiveReason}` : ""}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={
                      updatingStatus ||
                      updatingShipping ||
                      archivingOrderId === selectedOrder.id || restoringOrderId === selectedOrder.id || inventoryUpdatingId !== null || resolvingIssueId !== null
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
                          Boolean(selectedOrder.archivedAt) ||
                          updatingStatus ||
                          !(ALLOWED_NEXT_STATUSES[selectedOrder.status] || []).length
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
                          Boolean(selectedOrder.archivedAt) ||
                          updatingStatus ||
                          statusDraft === selectedOrder.status ||
                          !(ALLOWED_NEXT_STATUSES[selectedOrder.status] || []).length
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

                  {selectedOrder.status === "PROCESSING" && !selectedOrder.archivedAt ? (
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
                              "بازگشت موجودی",
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
                              <td className="px-3 py-4">
                                <div className="flex min-w-[180px] flex-col items-start gap-2">
                                  <span className={item.inventoryReturnStatus === "RETURNED" ? "text-xs font-bold text-emerald-300" : item.inventoryReturnStatus === "NEEDS_REVIEW" ? "text-xs font-bold text-amber-300" : "text-xs text-zinc-500"}>
                                    {item.inventoryReturnStatus === "RETURNED" ? "موجودی برگشت داده شد" : item.inventoryReturnStatus === "NEEDS_REVIEW" ? "نیازمند بررسی" : "برگشت داده نشده"}
                                  </span>
                                  {["SHIPPED", "DELIVERED"].includes(selectedOrder.status) && item.inventoryReturnStatus !== "RETURNED" && (
                                    <button type="button" onClick={() => handleInventoryReturn(item)}
                                      disabled={inventoryUpdatingId === item.id}
                                      className="rounded-lg border border-cyan-800/70 px-2.5 py-1.5 text-xs text-cyan-300 hover:bg-cyan-950/40 disabled:opacity-40">
                                      {inventoryUpdatingId === item.id ? "در حال ثبت..." : "بررسی دریافت کالا"}
                                    </button>
                                  )}
                                  {(item.inventoryReturnIssues || []).filter((issue) => issue.status === "OPEN").map((issue) => (
                                    <div key={issue.id} className="w-full rounded-lg border border-amber-900/50 bg-amber-950/20 p-2">
                                      <p className="text-[11px] leading-5 text-amber-200">{issue.reason}</p>
                                      <button type="button" onClick={() => handleResolveInventoryIssue(issue)}
                                        disabled={resolvingIssueId === issue.id}
                                        className="mt-2 rounded-md border border-amber-800/70 px-2 py-1 text-[11px] text-amber-200 disabled:opacity-40">
                                        {resolvingIssueId === issue.id ? "در حال ثبت..." : "تعیین‌تکلیف مشکل"}
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <div className="mt-5 flex flex-wrap justify-end gap-3">
                  {selectedOrder.archivedAt ? (
                    <button type="button" onClick={() => handleRestoreOrder(selectedOrder)}
                      disabled={restoringOrderId === selectedOrder.id}
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-800/70 px-5 py-3 text-sm text-emerald-300 transition hover:bg-emerald-950/40 disabled:opacity-40">
                      <FiRotateCcw />
                      {restoringOrderId === selectedOrder.id ? "در حال بازیابی..." : "بازیابی سفارش"}
                    </button>
                  ) : (
                    <button type="button" onClick={() => handleArchiveOrder(selectedOrder)}
                      disabled={archivingOrderId === selectedOrder.id}
                      className="inline-flex items-center gap-2 rounded-xl border border-amber-800/70 px-5 py-3 text-sm text-amber-300 transition hover:bg-amber-950/40 disabled:opacity-40">
                      <FiArchive />
                      {archivingOrderId === selectedOrder.id ? "در حال آرشیو..." : "آرشیو سفارش"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={
                      updatingStatus ||
                      updatingShipping ||
                      archivingOrderId === selectedOrder.id || restoringOrderId === selectedOrder.id || inventoryUpdatingId !== null || resolvingIssueId !== null
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

    </div>
  );
};

export default AdminOrders;
