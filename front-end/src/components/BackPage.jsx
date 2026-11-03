import { useNavigate } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";

const BackPage = ({ fallback = "/" }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.state?.idx > 0) {
      navigate(-1);
      return;
    }

    navigate(fallback, { replace: true });
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="بازگشت به صفحه قبل"
      className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
    >
      <FiArrowRight size={15} />
      بازگشت
    </button>
  );
};

export default BackPage;
