import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const CustomerOnlyRoute = ({ children, allowGuest = false }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

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
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default CustomerOnlyRoute;
