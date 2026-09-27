import BrandProducts from "../productsTable/BrandProducts";

const glossyProductCodes = [
  "pro-Sport",
  "swim-vest",
  "intest",
  "PS-01",
  "Conquest",
  "S5200",
];

const Glossy = () => {
  return (
    <BrandProducts
      productCodes={glossyProductCodes}
      logo="/images/categories/glossy.webp"
      logoAlt="Glossy"
      logoClassName="w-28 sm:w-32 md:w-35"
    />
  );
};

export default Glossy;
