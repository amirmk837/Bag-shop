import { FaArrowCircleLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Backpage = () => {
  const navigate = useNavigate();

  return (
    <button className="text-3xl text-cyan-900" onClick={() => navigate(-1)}>
      <FaArrowCircleLeft />
    </button>
  );
};

export default Backpage;
