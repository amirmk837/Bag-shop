import BrandProducts from "../productsTable/BrandProducts";

const Cat = () => {
  return (
    <BrandProducts
      brand="cat"
      logo="/images/categories/cat.webp"
      logoAlt="CAT"
      logoClassName="w-28 sm:w-36 md:w-44"
    />
  );
};

export default Cat;
