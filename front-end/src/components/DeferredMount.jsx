import { useEffect, useRef, useState } from "react";

const DeferredMount = ({
  children,
  rootMargin = "500px 0px",
  minHeight = 0,
  className = "",
}) => {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || isVisible || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setIsVisible(true);
        observer.disconnect();
      },
      { rootMargin },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [isVisible, rootMargin]);

  const shouldRender = isVisible || typeof IntersectionObserver === "undefined";

  return (
    <div
      ref={containerRef}
      className={className}
      style={minHeight ? { minHeight } : undefined}
    >
      {shouldRender ? children : null}
    </div>
  );
};

export default DeferredMount;
