import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const CustomerOnlyRoute = ({ children, allowGuest = false }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div
        dir="rtl"
        className="flex min-h-[40vh] items-center justify-center text-zinc-400"
      >
        در حال بررسی حساب کاربری...
      </div>
    );
  }

  if (user?.role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  if (!isAuthenticated && !allowGuest) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default CustomerOnlyRoute;
