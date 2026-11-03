const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// REQUEST
// =========================================
const request = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "خطا در ارتباط با کاربران.");
  }

  return data;
};

// GET USERS
// =========================================
export const getUsers = async ({
  page = 1,
  pageSize = 10,
  search = "",
  status = "all",
  sortBy = "createdAt",
  sortOrder = "desc",
} = {}) => {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    search,
    status,
    sortBy,
    sortOrder,
  });

  return request(`${API_URL}/admin/users?${params.toString()}`);
};

// GET USER DETAIL
// =========================================
export const getUserDetail = async (
  userId,
  { orderPage = 1, orderPageSize = 10 } = {},
) => {
  const params = new URLSearchParams({
    orderPage: String(orderPage),
    orderPageSize: String(orderPageSize),
  });

  return request(`${API_URL}/admin/users/${userId}?${params.toString()}`);
};

// UPDATE USER
// =========================================
export const updateUser = async (userId, payload) => {
  return request(`${API_URL}/admin/users/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
};

// DELETE USER
// =========================================

export const deleteUser = async (userId) => {
  return request(`${API_URL}/admin/users/${userId}`, {
    method: "DELETE",
  });
};
