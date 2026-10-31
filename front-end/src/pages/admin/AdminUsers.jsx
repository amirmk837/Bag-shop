import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getUsers, getUserDetail } from "../../services/adminUserApi";
import AdminUserModal from "../../components/admin/AdminUserModal";

const formatDate = (date) => {
  if (!date) return "ثبت نشده";

  const parsed = new Date(date);

  return Number.isNaN(parsed.getTime())
    ? "ثبت نشده"
    : parsed.toLocaleDateString("fa-IR");
};

const formatPrice = (value) => Number(value || 0).toLocaleString("fa-IR");

const AdminUsers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================
  // SEARCH DEBOUNCE
  // =========================================

  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination((current) => ({
        ...current,
        page: 1,
      }));

      setSearch(searchInput.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // =========================================
  // LOAD USERS
  // =========================================

  useEffect(() => {
    let ignore = false;

    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getUsers({
          page: pagination.page,
          pageSize: pagination.pageSize,
          search,
          status,
          sortBy,
          sortOrder,
        });

        if (ignore) {
          return;
        }

        setUsers(data.items || []);
        setPagination(data.pagination);
      } catch (requestError) {
        if (ignore) {
          return;
        }

        setError(requestError.message || "دریافت کاربران ناموفق بود.");
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      ignore = true;
    };
  }, [
    pagination.page,
    pagination.pageSize,
    search,
    status,
    sortBy,
    sortOrder,
    refreshKey,
  ]);

  // =========================================
  // SORT
  // =========================================

  const handleSort = (field) => {
    setPagination((current) => ({
      ...current,
      page: 1,
    }));

    if (sortBy === field) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));

      return;
    }

    setSortBy(field);
    setSortOrder("desc");
  };

  // =========================================
  // OPEN USER
  // =========================================

  const openUser = useCallback(async (userId) => {
    try {
      setError("");

      const data = await getUserDetail(userId);

      setSelectedUser(data);
    } catch (requestError) {
      setError(requestError.message || "دریافت اطلاعات کاربر ناموفق بود.");
    }
  }, []);

  // =========================================
  useEffect(() => {
    const userId = searchParams.get("userId");
    if (userId) openUser(userId);
  }, [searchParams, openUser]);

  const closeUser = () => {
    setSelectedUser(null);
    if (searchParams.has("userId")) setSearchParams({}, { replace: true });
  };
  // AFTER UPDATE / DELETE
  // =========================================

  const handleUsersChanged = () => {
    setSelectedUser(null);
    setRefreshKey((current) => current + 1);
  };

  return (
    <div dir="rtl">
      {/* HEADER */}

      <div className="m-6">
        <h2 className="text-2xl font-bold text-white">مدیریت کاربران</h2>

        <p className="mt-2 text-sm text-zinc-400">
          {Number(pagination.total || 0).toLocaleString("fa-IR")} کاربر ثبت شده
          است.
        </p>
      </div>

      {/* FILTERS */}

      <div className="mb-6 grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 lg:grid-cols-[1fr_auto]">
        <input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="جست‌وجوی نام کاربری یا شماره موبایل..."
          className="
            w-full rounded-xl border border-zinc-700
            bg-zinc-950 px-4 py-3 text-white
            outline-none transition focus:border-zinc-400
          "
        />

        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);

            setPagination((current) => ({
              ...current,
              page: 1,
            }));
          }}
          className="
            rounded-xl border border-zinc-700
            bg-zinc-950 px-4 py-3 text-white outline-none
          "
        >
          <option value="all">همه کاربران</option>
          <option value="active">فقط فعال</option>
          <option value="inactive">فقط غیرفعال</option>
        </select>
      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-5 rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* USERS TABLE */}

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="min-w-[1150px] w-full">
            <thead className="border-b border-zinc-800 bg-zinc-950/70">
              <tr>
                <th className="px-4 py-4 text-right text-sm text-zinc-400">
                  کاربر
                </th>

                <th className="px-4 py-4 text-right text-sm text-zinc-400">
                  آدرس ثبت‌شده
                </th>

                <th className="px-4 py-4 text-right text-sm text-zinc-400">
                  نقش
                </th>

                <th className="px-4 py-4 text-right text-sm text-zinc-400">
                  <button
                    type="button"
                    onClick={() => handleSort("createdAt")}
                    className="hover:text-white"
                  >
                    تاریخ ثبت‌نام
                  </button>
                </th>

                <th className="px-4 py-4 text-right text-sm text-zinc-400">
                  <button
                    type="button"
                    onClick={() => handleSort("orderCount")}
                    className="hover:text-white"
                  >
                    سفارش‌های تأییدشده
                  </button>
                </th>

                <th className="px-4 py-4 text-right text-sm text-zinc-400">
                  <button
                    type="button"
                    onClick={() => handleSort("maxOrderAmount")}
                    className="hover:text-white"
                  >
                    بیشترین مبلغ سفارش
                  </button>
                </th>

                <th className="px-4 py-4 text-right text-sm text-zinc-400">
                  وضعیت
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-zinc-500"
                  >
                    در حال دریافت کاربران...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-zinc-500"
                  >
                    کاربری پیدا نشد.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => openUser(user.id)}
                    className="
                      cursor-pointer border-b border-zinc-800
                      transition hover:bg-zinc-800/50 last:border-b-0
                    "
                  >
                    {/* USER */}

                    <td className="px-4 py-4">
                      <div className="font-semibold text-white">
                        {user.username}
                      </div>

                      <div className="mt-1 text-xs text-zinc-500">
                        {user.phone || "شماره ثبت نشده"}
                      </div>
                    </td>

                    {/* ADDRESS */}

                    <td className="px-4 py-4">
                      {user.address ? (
                        <div
                          className="max-w-[260px]"
                          title={user.address.addressLine || ""}
                        >
                          <p className="font-medium text-zinc-200">
                            {[user.address.province, user.address.city]
                              .filter(Boolean)
                              .join("، ") || "استان/شهر ثبت نشده"}
                          </p>

                          <p className="mt-1 truncate text-xs text-zinc-500">
                            {user.address.addressLine || "نشانی ثبت نشده"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-zinc-500">ثبت نشده</span>
                      )}
                    </td>

                    {/* ROLE */}

                    <td className="px-4 py-4">
                      <span
                        className={
                          user.role === "ADMIN"
                            ? "text-amber-400"
                            : "text-zinc-300"
                        }
                      >
                        {user.role === "ADMIN" ? "مدیر" : "کاربر"}
                      </span>
                    </td>

                    {/* REGISTERED AT */}

                    <td className="px-4 py-4 text-sm text-zinc-300">
                      {formatDate(user.createdAt)}
                    </td>

                    {/* ORDER COUNT */}

                    <td className="px-4 py-4">
                      {Number(user.orderCount || 0).toLocaleString("fa-IR")}
                    </td>

                    {/* MAX ORDER AMOUNT */}

                    <td className="whitespace-nowrap px-4 py-4">
                      {formatPrice(user.maxOrderAmount)} تومان
                    </td>

                    {/* STATUS */}

                    <td className="px-4 py-4">
                      <span
                        className={
                          user.isActive ? "text-emerald-400" : "text-red-400"
                        }
                      >
                        {user.isActive ? "فعال" : "غیرفعال"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION */}

      {pagination.totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() =>
              setPagination((current) => ({
                ...current,
                page: current.page - 1,
              }))
            }
            className="
              rounded-xl bg-zinc-800 px-4 py-2 text-sm
              disabled:cursor-not-allowed disabled:opacity-40
            "
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
            className="
              rounded-xl bg-zinc-800 px-4 py-2 text-sm
              disabled:cursor-not-allowed disabled:opacity-40
            "
          >
            بعدی
          </button>
        </div>
      )}

      {/* USER DETAIL MODAL */}

      {selectedUser && (
        <AdminUserModal
          key={selectedUser.user.id}
          data={selectedUser}
          onClose={closeUser}
          onChanged={handleUsersChanged}
        />
      )}
    </div>
  );
};

export default AdminUsers;
