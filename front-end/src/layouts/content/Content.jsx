import { lazy, Suspense } from "react";
import Banner from "./Banner";
import DeferredMount from "../../components/DeferredMount";

const Brands = lazy(() => import("./Brands"));

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

      <DeferredMount rootMargin="500px 0px" minHeight={220}>
        <Suspense fallback={<div aria-hidden="true" className="min-h-[220px]" />}>
          <Brands />
        </Suspense>
      </DeferredMount>
    </main>
  );
};

export default Content;
