import { useEffect, useState } from "react";

import {
  FiAlertTriangle,
  FiDollarSign,
  FiPackage,
  FiRefreshCw,
  FiShoppingBag,
  FiUsers,
} from "react-icons/fi";

import { getAdminDashboard } from "../../services/adminDashboardApi";

// =========================================
// HELPERS
// =========================================

const formatPrice = (value) =>
  `${Number(value || 0).toLocaleString("fa-IR")} تومان`;

const formatNumber = (value) => Number(value || 0).toLocaleString("fa-IR");

const formatDate = (value) => {
  if (!value) return "ثبت نشده";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "ثبت نشده";
  }

  return date.toLocaleDateString("fa-IR");
};

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

// =========================================
// SHARED COMPONENTS
// =========================================

const Section = ({ title, description, children }) => (
  <section className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
    <div className="mb-5">
      <h3 className="text-lg font-bold text-white">{title}</h3>

      {description && (
        <p className="mt-1 text-sm leading-6 text-zinc-500">{description}</p>
      )}
    </div>

    {children}
  </section>
);

const OrderStatus = ({ status }) => (
  <span
    className={`
      inline-flex whitespace-nowrap rounded-lg
      px-2.5 py-1.5 text-xs font-bold
      ${STATUS_CLASSES[status] || "bg-zinc-800 text-zinc-300"}
    `}
  >
    {STATUS_LABELS[status] || status}
  </span>
);

const StatCard = ({ title, value, description, icon: Icon }) => (
  <div
    className="
      min-w-0 rounded-2xl border border-zinc-800
      bg-zinc-900 p-5 transition
      hover:border-zinc-700
    "
  >
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-zinc-400">{title}</p>

      <div className="shrink-0 rounded-xl bg-zinc-800 p-3 text-zinc-200">
        <Icon size={20} />
      </div>
    </div>

    <p className="mt-5 break-words text-xl font-black text-white sm:text-2xl">
      {value}
    </p>

    <p className="mt-2 text-xs leading-5 text-zinc-500">{description}</p>
  </div>
);

// =========================================
// SALES CHART
// =========================================

const SalesChart = ({ months }) => {
  const maxSales = Math.max(...months.map((month) => Number(month.total) || 0), 0);

  if (months.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500">
        اطلاعات فروش برای نمایش وجود ندارد.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-2">
        <div>
          <p className="text-xs text-zinc-500">مجموع فروش ۱۲ ماه</p>
          <p className="mt-1 text-lg font-black text-white">
            {formatPrice(months.reduce((sum, month) => sum + Number(month.total || 0), 0))}
          </p>
        </div>
        <span className="rounded-lg bg-zinc-800 px-2 py-1 text-[10px] text-zinc-400">
          ماهانه
        </span>
      </div>

      <div dir="ltr" className="grid h-36 grid-cols-12 items-end gap-1.5 border-b border-zinc-800 pb-2">
        {months.map((month) => {
          const total = Number(month.total) || 0;
          const height = maxSales > 0 ? (total / maxSales) * 100 : 0;

          return (
            <div
              key={month.key}
              className="flex h-full min-w-0 flex-col items-center justify-end"
              title={`${month.label}: ${formatPrice(total)} · ${formatNumber(month.orderCount)} سفارش`}
            >
              <div className="flex h-full w-full items-end justify-center">
                <div
                  className="w-full max-w-4 rounded-t-sm bg-cyan-300/80 transition-all duration-300 hover:bg-cyan-200"
                  style={{
                    height: `${height}%`,
                    minHeight: total > 0 ? "3px" : "0",
                  }}
                />
              </div>
              <span dir="rtl" className="mt-2 text-[9px] leading-3 text-zinc-500">
                {month.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500">
        <span>کمترین فروش</span>
        <span>بیشترین فروش</span>
      </div>
    </div>
  );
};

// =========================================
// RECENT ORDERS
// =========================================

const RecentOrders = ({ orders }) => (
  <div className="space-y-3">
    {orders.length === 0 ? (
      <p className="py-8 text-center text-sm text-zinc-500">
        هنوز سفارشی ثبت نشده است.
      </p>
    ) : (
      orders.map((order) => {
        const itemCount = (order.items || []).reduce(
          (total, item) => total + Number(item.quantity || 0),
          0,
        );

        return (
          <div
            key={order.id}
            className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold text-white">
                  سفارش #{formatNumber(order.id)}
                </p>

                <p className="mt-1 text-sm text-zinc-400">
                  {order.user?.username || "کاربر حذف‌شده"}
                </p>
              </div>

              <OrderStatus status={order.status} />
            </div>

            <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-zinc-800 pt-3">
              <div>
                <p className="text-xs text-zinc-500">تاریخ ثبت</p>

                <p className="mt-1 text-sm text-zinc-300">
                  {formatDate(order.createdAt)}
                </p>
              </div>

              <div className="text-left">
                <p className="font-bold text-white">
                  {formatPrice(order.totalAmount)}
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  {formatNumber(itemCount)} عدد کالا
                </p>
              </div>
            </div>
          </div>
        );
      })
    )}
  </div>
);

// =========================================
// TOP CUSTOMERS
// =========================================

const TopCustomers = ({ customers }) => (
  <div className="overflow-x-auto">
    {customers.length === 0 ? (
      <p className="py-8 text-center text-sm text-zinc-500">
        هنوز خرید تأییدشده‌ای برای رتبه‌بندی وجود ندارد.
      </p>
    ) : (
      <table className="w-full min-w-[440px] text-right">
        <thead>
          <tr className="border-b border-zinc-800 text-xs text-zinc-500">
            <th className="pb-3 pl-3">مشتری</th>
            <th className="px-3 pb-3">تعداد خرید</th>
            <th className="pb-3 pr-3">مجموع خرید</th>
          </tr>
        </thead>

        <tbody>
          {customers.map((customer, index) => (
            <tr
              key={customer.userId}
              className="border-b border-zinc-800/70 last:border-0"
            >
              <td className="py-4 pl-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold">
                    {formatNumber(index + 1)}
                  </span>

                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-white">
                      {customer.username}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {customer.phone || "شماره ثبت نشده"}
                    </p>
                  </div>
                </div>
              </td>

              <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-300">
                {formatNumber(customer.orderCount)} سفارش
              </td>

              <td className="whitespace-nowrap py-4 pr-3 text-sm font-bold text-white">
                {formatPrice(customer.totalSpent)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

// =========================================
// STOCK PRODUCT LIST
// =========================================

const StockProductList = ({ products, emptyMessage, lowStock = false }) => (
  <div className="space-y-3">
    {products.length === 0 ? (
      <p className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm leading-6 text-zinc-500">
        {emptyMessage}
      </p>
    ) : (
      products.map((product) => (
        <div
          key={product.id}
          className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3"
        >
          <div className="min-w-0">
            <p className="break-words text-sm font-semibold text-white">
              {product.title || product.productCode}
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              {product.brand || "بدون برند"} · {product.productCode}
            </p>
          </div>

          <span
            className={`
              shrink-0 whitespace-nowrap rounded-lg
              px-2.5 py-1.5 text-xs font-bold
              ${
                lowStock
                  ? "bg-amber-950/40 text-amber-300"
                  : "bg-red-950/40 text-red-300"
              }
            `}
          >
            {lowStock ? "۱ عدد" : "ناموجود"}
          </span>
        </div>
      ))
    )}
  </div>
);

// =========================================
// BEST-SELLING PRODUCTS
// =========================================

const BestSellingProducts = ({ products }) => {
  const maxQuantity = Math.max(
    ...products.map((product) => product.quantitySold),
    0,
  );

  if (products.length === 0) {
    return (
      <p className="py-8 text-center text-sm leading-6 text-zinc-500">
        هنوز فروش تأییدشده‌ای برای محاسبه پرفروش‌ترین محصولات وجود ندارد.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {products.map((product, index) => {
        const width =
          maxQuantity > 0 ? (product.quantitySold / maxQuantity) * 100 : 0;

        return (
          <div key={`${product.productCode}-${product.title}`}>
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words text-sm font-semibold text-white">
                  {formatNumber(index + 1)}. {product.title}
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  کد: {product.productCode}
                </p>
              </div>

              <div className="shrink-0 text-left">
                <p className="text-sm font-bold text-white">
                  {formatNumber(product.quantitySold)} عدد
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  {formatPrice(product.revenue)}
                </p>
              </div>
            </div>

            <div
              dir="ltr"
              className="h-2 overflow-hidden rounded-full bg-zinc-800"
            >
              <div
                className="h-full rounded-full bg-zinc-300 transition-all"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// =========================================
// ADMIN DASHBOARD
// =========================================

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // =========================================
  // FETCH REAL ANALYTICS
  // =========================================

  useEffect(() => {
    let ignore = false;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await getAdminDashboard();

        if (ignore) return;

        setData(result);
      } catch (requestError) {
        if (ignore) return;

        setError(requestError.message || "دریافت آمار داشبورد ناموفق بود.");
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  // =========================================
  // INITIAL LOADING
  // =========================================

  if (loading && !data) {
    return (
      <div dir="rtl" className="py-16 text-center text-sm text-zinc-400">
        در حال دریافت آمار واقعی فروشگاه...
      </div>
    );
  }

  // =========================================
  // UI
  // =========================================

  const summary = data?.summary || {};
  const stock = data?.stock || {};

  return (
    <div dir="rtl" className="space-y-6 text-white">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-black">داشبورد مدیریت</h2>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            نمای کلی از فروش، سفارش‌ها، مشتریان و موجودی فروشگاه
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRefreshKey((current) => current + 1)}
          disabled={loading}
          className="
            inline-flex items-center justify-center gap-2
            rounded-xl border border-zinc-700
            bg-zinc-900 px-4 py-3 text-sm
            transition hover:bg-zinc-800
            disabled:cursor-not-allowed disabled:opacity-50
          "
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} />

          {loading ? "در حال به‌روزرسانی..." : "به‌روزرسانی آمار"}
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm leading-6 text-red-400">
          {error}
        </div>
      )}

      {!data ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-zinc-300">دریافت اطلاعات داشبورد ناموفق بود.</p>

          <p className="mt-2 text-sm text-zinc-500">
            اتصال بک‌اند و وضعیت ورود ادمین را بررسی کن.
          </p>
        </div>
      ) : (
        <>
          {/* SUMMARY CARDS */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              title="فروش ماه جاری"
              value={formatPrice(summary.currentMonthSales)}
              description="فروش سفارش‌های واجد شرایط در ماه جاری"
              icon={FiDollarSign}
            />

            <StatCard
              title="فروش ۱۲ ماه اخیر"
              value={formatPrice(summary.salesLast12Months)}
              description="مجموع فروش در ۱۲ ماه تقویمی اخیر"
              icon={FiShoppingBag}
            />

            <StatCard
              title="سفارش‌های فروش"
              value={formatNumber(summary.salesOrderCountLast12Months)}
              description="سفارش‌های فروش در ۱۲ ماه اخیر"
              icon={FiUsers}
            />

            <StatCard
              title="کل محصولات"
              value={formatNumber(summary.totalProducts)}
              description="تعداد محصولات ثبت‌شده در دیتابیس"
              icon={FiPackage}
            />

            <StatCard
              title="کل سفارش‌ها"
              value={formatNumber(summary.totalOrders)}
              description="شامل همه وضعیت‌ها، حتی سفارش‌های لغوشده"
              icon={FiAlertTriangle}
            />
          </div>

          {/* SALES CHART + RECENT ORDERS */}

          <div className="grid min-w-0 gap-6 xl:grid-cols-3">
            <Section
              title="روند فروش"
              description="۱۲ ماه اخیر؛ فقط سفارش‌های پرداخت‌شده و مراحل بعدی"
            >
              <SalesChart months={data.monthlySales || []} />
            </Section>

            <div className="min-w-0 xl:col-span-2">
              <Section
                title="آخرین سفارش‌ها"
                description="سه سفارش ثبت‌شده اخیر، با هر وضعیت"
              >
                <RecentOrders orders={data.recentOrders || []} />
              </Section>
            </div>
          </div>

          {/* TOP CUSTOMERS */}

          <Section
            title="مشتریان برتر"
            description="رتبه‌بندی بر اساس تعداد خرید؛ مبلغ کل خرید نیز نمایش داده می‌شود."
          >
            <TopCustomers customers={data.topCustomers || []} />
          </Section>

          {/* STOCK */}

          <div className="grid min-w-0 gap-6 xl:grid-cols-2">
            <Section
              title="محصولات ناموجود"
              description={`تعداد کل ناموجودها: ${formatNumber(stock.outOfStockCount)}`}
            >
              <StockProductList
                products={stock.outOfStockProducts || []}
                emptyMessage="در حال حاضر محصول ناموجودی وجود ندارد."
              />

              {stock.outOfStockCount >
                (stock.outOfStockProducts || []).length && (
                <p className="mt-3 text-xs text-zinc-500">
                  شش محصول اخیر نمایش داده می‌شوند؛ برای دیدن بقیه، بخش محصولات
                  را باز کن.
                </p>
              )}
            </Section>

            <Section
              title="موجودی بحرانی"
              description={`محصولات با دقیقاً یک عدد موجودی: ${formatNumber(stock.lowStockCount)}`}
            >
              <StockProductList
                products={stock.lowStockProducts || []}
                lowStock
                emptyMessage="محصولی با موجودی دقیقاً یک عدد وجود ندارد."
              />

              {stock.lowStockCount > (stock.lowStockProducts || []).length && (
                <p className="mt-3 text-xs text-zinc-500">
                  شش محصول اخیر نمایش داده می‌شوند؛ برای دیدن بقیه، بخش محصولات
                  را باز کن.
                </p>
              )}
            </Section>
          </div>

          {/* BEST SELLERS */}

          <Section
            title="پرفروش‌ترین محصولات"
            description="پنج محصول برتر بر اساس تعداد واقعی فروخته‌شده؛ مبلغ فروش هر محصول هم نمایش داده می‌شود."
          >
            <BestSellingProducts products={data.bestSellingProducts || []} />
          </Section>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
