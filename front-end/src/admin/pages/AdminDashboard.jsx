import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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

const Section = ({ title, description, children, to }) => (
  <section className="h-fit min-w-0 rounded-xl border border-white/[0.07] bg-[#151923] p-2.5 shadow-sm">
    <div className="mb-1.5 flex items-center gap-1.5">
      <span className="h-4 w-1 shrink-0 rounded-full bg-cyan-400" />
      <div className="min-w-0">
        <h3 className="text-xs font-bold text-zinc-100">{title}</h3>
        {description && <p className="mt-0 text-[9px] leading-3 text-zinc-500">{description}</p>}
      </div>
      {to && <Link to={to} className="mr-auto shrink-0 text-[10px] font-semibold text-cyan-300 hover:text-cyan-200">مشاهده همه</Link>}
    </div>
    {children}
  </section>
);

const OrderStatus = ({ status }) => (
  <span
    className={`
      inline-flex whitespace-nowrap rounded-lg
      px-1.5 py-1 text-[10px] font-bold
      ${STATUS_CLASSES[status] || "bg-zinc-800 text-zinc-300"}
    `}
  >
    {STATUS_LABELS[status] || status}
  </span>
);

const StatCard = ({ title, value, description, icon: Icon, tone, to }) => (
  <Link to={to} className="relative block min-w-0 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#151923] p-3 transition hover:border-white/15">
    <div className={`absolute inset-x-0 top-0 h-[2px] ${tone.bar}`} />
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs font-medium text-zinc-400">{title}</p>
      <div className={`shrink-0 rounded-lg p-1.5 ${tone.icon}`}><Icon size={15} /></div>
    </div>
    <p className="mt-2 break-words text-base font-extrabold leading-6 text-white">{value}</p>
    <p className="mt-0.5 text-[10px] leading-4 text-zinc-500">{description}</p>
    <span className="mt-1 block text-[9px] text-cyan-300">مشاهده جزئیات ←</span>
  </Link>
);

// =========================================
// SALES CHART
// =========================================

const SalesChart = ({ months }) => {
  const maxSales = Math.max(...months.map((month) => Number(month.total) || 0), 0);

  if (months.length === 0) {
    return (
      <p className="py-2 text-center text-xs text-zinc-500">
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

      <div dir="ltr" className="grid h-28 grid-cols-12 items-end gap-1 border-b border-zinc-800 pb-2">
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
                  className="w-full max-w-4 rounded-t-sm bg-gradient-to-t from-cyan-500 to-teal-300 transition-all duration-300 hover:from-cyan-300 hover:to-emerald-200"
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
  <div className="space-y-1">
    {orders.length === 0 ? (
      <p className="py-8 text-center text-sm text-zinc-500">هنوز سفارشی ثبت نشده است.</p>
    ) : (
      orders.map((order) => {
        const itemCount = (order.items || []).reduce(
          (total, item) => total + Number(item.quantity || 0), 0,
        );
        return (
          <Link
            key={order.id}
            to={"/admin/orders?orderId=" + encodeURIComponent(order.id)}
            className="block rounded-lg border border-white/[0.06] bg-[#10151f] px-2 py-1.5 transition hover:border-cyan-400/40 hover:bg-cyan-950/10"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-white">سفارش #{formatNumber(order.id)}</p>
                <p className="mt-0.5 text-xs text-zinc-400">{order.user?.username || "کاربر حذف‌شده"}</p>
              </div>
              <OrderStatus status={order.status} />
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-1.5 border-t border-zinc-800 pt-1">
              <div>
                <p className="text-[10px] text-zinc-500">تاریخ ثبت</p>
                <p className="mt-0.5 text-xs text-zinc-300">{formatDate(order.createdAt)}</p>
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white">{formatPrice(order.totalAmount)}</p>
                <p className="mt-0.5 text-[10px] text-zinc-500">{formatNumber(itemCount)} عدد کالا</p>
              </div>
            </div>
          </Link>
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
      <table className="w-full min-w-[390px] text-right">
        <thead>
          <tr className="border-b border-zinc-800 text-xs text-zinc-500">
            <th className="pb-2 pl-2 text-[10px]">مشتری</th>
            <th className="px-2 pb-2 text-[10px]">تعداد خرید</th>
            <th className="pb-2 pr-2 text-[10px]">مجموع خرید</th>
          </tr>
        </thead>

        <tbody>
          {customers.map((customer, index) => (
            <tr
              key={customer.userId}
              className="border-b border-zinc-800/70 last:border-0"
            >
              <td className="py-1 pl-1.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-zinc-800 text-[9px] font-bold">
                    {formatNumber(index + 1)}
                  </span>

                  <div className="min-w-0">
                    <p className="break-words text-xs font-semibold text-white">
                      {customer.username}
                    </p>

                    <p className="mt-0.5 text-[10px] text-zinc-500">
                      {customer.phone || "شماره ثبت نشده"}
                    </p>
                  </div>
                </div>
              </td>

              <td className="whitespace-nowrap px-1.5 py-1 text-[10px] text-zinc-300">
                {formatNumber(customer.orderCount)} سفارش
              </td>

              <td className="whitespace-nowrap py-1 pr-1.5 text-[10px] font-bold text-white">
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
  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
    {products.length === 0 ? (
      <p className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-[10px] leading-4 text-zinc-500">
        {emptyMessage}
      </p>
    ) : (
      products.map((product) => (
        <Link
          key={product.id}
          to={`/admin/products/${encodeURIComponent(product.productCode)}/edit`}
          className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 transition hover:border-cyan-400/40 hover:bg-cyan-950/10"
        >
          <div className="min-w-0">
            <p className="break-words text-xs font-semibold text-white">
              {product.title || product.productCode}
            </p>

            <p className="mt-0.5 text-[10px] text-zinc-500">
              {product.brand || "بدون برند"} · {product.productCode}
            </p>
          </div>

          <span
            className={`
              shrink-0 whitespace-nowrap rounded-lg
              px-1.5 py-1 text-[10px] font-bold
              ${
                lowStock
                  ? "bg-amber-950/40 text-amber-300"
                  : "bg-red-950/40 text-red-300"
              }
            `}
          >
            {lowStock ? "۱ عدد" : "ناموجود"}
          </span>
        </Link>
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
    <div className="space-y-1.5">
      {products.map((product, index) => {
        const width =
          maxQuantity > 0 ? (product.quantitySold / maxQuantity) * 100 : 0;

        return (
          <Link key={`${product.productCode}-${product.title}`} to={`/admin/products/${encodeURIComponent(product.productCode)}/edit`} className="block rounded-md px-1 py-0.5 transition hover:bg-cyan-950/10">
            <div className="mb-0.5 flex items-center justify-between gap-1.5">
              <div className="min-w-0">
                <p className="break-words text-xs font-semibold text-white">
                  {formatNumber(index + 1)}. {product.title}
                </p>

                <p className="mt-0.5 text-[10px] text-zinc-500">
                  کد: {product.productCode}
                </p>
              </div>

              <div className="shrink-0 text-left">
                <p className="text-xs font-bold text-white">
                  {formatNumber(product.quantitySold)} عدد
                </p>

                <p className="mt-0.5 text-[10px] text-zinc-500">
                  {formatPrice(product.revenue)}
                </p>
              </div>
            </div>

            <div
              dir="ltr"
              className="h-0.5 overflow-hidden rounded-full bg-zinc-800"
            >
              <div
                className="h-full rounded-full bg-gradient-to-l from-cyan-500 to-emerald-300 transition-all"
                style={{ width: `${width}%` }}
              />
            </div>
          </Link>
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
    <div dir="rtl" className="space-y-3 text-white">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-black tracking-tight text-white">داشبورد مدیریت</h2>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            نمای کلی از فروش، سفارش‌ها، مشتریان و موجودی فروشگاه
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRefreshKey((current) => current + 1)}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50"
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

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
            <StatCard
              title="فروش ماه جاری"
              value={formatPrice(summary.currentMonthSales)}
              description="فروش سفارش‌های واجد شرایط در ماه جاری"
              tone={{ bar: "bg-emerald-400", icon: "bg-emerald-400/10 text-emerald-300" }}
              icon={FiDollarSign}
            to="/admin/orders"
              />

            <StatCard
              title="فروش ۱۲ ماه اخیر"
              value={formatPrice(summary.salesLast12Months)}
              description="مجموع فروش در ۱۲ ماه تقویمی اخیر"
              tone={{ bar: "bg-cyan-400", icon: "bg-cyan-400/10 text-cyan-300" }}
              icon={FiShoppingBag}
            to="/admin/orders"
              />

            <StatCard
              title="سفارش‌های فروش"
              value={formatNumber(summary.salesOrderCountLast12Months)}
              description="سفارش‌های فروش در ۱۲ ماه اخیر"
              tone={{ bar: "bg-violet-400", icon: "bg-violet-400/10 text-violet-300" }}
              icon={FiUsers}
            to="/admin/orders"
              />

            <StatCard
              title="کل محصولات"
              value={formatNumber(summary.totalProducts)}
              description="تعداد محصولات ثبت‌شده در دیتابیس"
              tone={{ bar: "bg-amber-400", icon: "bg-amber-400/10 text-amber-300" }}
              icon={FiPackage}
            to="/admin/products"
              />

            <StatCard
              title="کل سفارش‌ها"
              value={formatNumber(summary.totalOrders)}
              description="شامل همه وضعیت‌ها، حتی سفارش‌های لغوشده"
              tone={{ bar: "bg-rose-400", icon: "bg-rose-400/10 text-rose-300" }}
              icon={FiAlertTriangle}
            to="/admin/orders"
              />
          </div>

          {/* SALES + ORDERS */}

          <div className="grid min-w-0 grid-cols-1 items-start gap-2 lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-5">
              <Section
                title="روند فروش"
                to="/admin/orders"
                description="۱۲ ماه اخیر؛ فقط سفارش‌های پرداخت‌شده و مراحل بعدی"
              >
                <SalesChart months={data.monthlySales || []} />
              </Section>
            </div>

            <div className="min-w-0 lg:col-span-7">
              <Section
                title="آخرین سفارش‌ها"
                to="/admin/orders"
                description="سه سفارش ثبت‌شده اخیر، با هر وضعیت"
              >
                <RecentOrders orders={data.recentOrders || []} />
              </Section>
            </div>
          </div>

          {/* CUSTOMERS + BEST SELLERS */}

          <div className="grid min-w-0 grid-cols-1 items-start gap-2 lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-4">
              <Section
                title="مشتریان برتر"
                to="/admin/users"
                description="رتبه‌بندی بر اساس تعداد و مبلغ خرید"
              >
                <TopCustomers customers={data.topCustomers || []} />
              </Section>
            </div>

            <div className="min-w-0 lg:col-span-8">
              <Section
                title="پرفروش‌ترین محصولات"
                to="/admin/products"
                description="پنج محصول برتر بر اساس تعداد واقعی فروخته‌شده"
              >
                <BestSellingProducts products={data.bestSellingProducts || []} />
              </Section>
            </div>
          </div>

          {/* STOCK OVERVIEW */}

          <div className="grid min-w-0 grid-cols-1 items-start gap-2 lg:grid-cols-2">
            <Section
              title="محصولات ناموجود"
                to="/admin/products"
              description={`تعداد کل ناموجودها: ${formatNumber(stock.outOfStockCount)}`}
            >
              <StockProductList
                products={stock.outOfStockProducts || []}
                emptyMessage="در حال حاضر محصول ناموجودی وجود ندارد."
              />

              {stock.outOfStockCount >
                (stock.outOfStockProducts || []).length && (
                <p className="mt-2 text-[10px] text-zinc-500">
                  شش محصول اخیر نمایش داده می‌شوند؛ برای دیدن بقیه، بخش محصولات
                  را باز کن.
                </p>
              )}
            </Section>

            <Section
              title="موجودی بحرانی"
                to="/admin/products"
              description={`محصولات با دقیقاً یک عدد موجودی: ${formatNumber(stock.lowStockCount)}`}
            >
              <StockProductList
                products={stock.lowStockProducts || []}
                lowStock
                emptyMessage="محصولی با موجودی دقیقاً یک عدد وجود ندارد."
              />

              {stock.lowStockCount > (stock.lowStockProducts || []).length && (
                <p className="mt-2 text-[10px] text-zinc-500">
                  شش محصول اخیر نمایش داده می‌شوند؛ برای دیدن بقیه، بخش محصولات
                  را باز کن.
                </p>
              )}
            </Section>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
