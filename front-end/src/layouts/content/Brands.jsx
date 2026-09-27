import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCategories } from "../../services/api";

const Brands = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories();

        setCategories(data);
      } catch (error) {
        console.error("Categories error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  if (loading) {
    return null;
  }

  return (
    <div className="mt-8 px-3 sm:mt-10 sm:px-5 md:px-6">
      <div
        className="
          grid
          grid-cols-2
          items-center
          gap-6
          sm:grid-cols-3
          sm:gap-8
          md:grid-cols-4
          md:gap-10
          lg:grid-cols-5
          lg:gap-12
        "
      >
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/category/${category.slug}`}
            className="
              flex
              min-w-0
              items-center
              justify-center
            "
          >
            <img
              src={category.image}
              alt={category.name}
              className="
                block
                h-auto
                max-w-full
                cursor-pointer
                object-contain
                transition-transform
                duration-300
                hover:scale-110
              "
            />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Brands;
