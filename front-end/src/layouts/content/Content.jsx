import Brands from "./Brands";
import Banner from "./Banner";

const Content = () => {
  return (
    <main
      className="
        mt-6
        w-full
        overflow-hidden
        py-6
        sm:mt-8
        sm:py-8
        md:mt-10
        md:py-10
      "
    >
      <Banner />
      <Brands />
    </main>
  );
};

export default Content;
