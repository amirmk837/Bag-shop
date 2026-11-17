import { lazy, Suspense, useState } from "react";

const SupportWidget = lazy(() => import("./SupportWidget"));

const SupportWidgetLoader = () => {
  const [activated, setActivated] = useState(false);

  if (activated) {
    return (
      <Suspense
        fallback={
          <div className="fixed bottom-4 right-4 z-[80]" dir="rtl">
            <button
              type="button"
              disabled
              className="rounded-full bg-cyan-500 px-4 py-3 text-sm font-bold text-zinc-950 opacity-80 shadow-xl"
            >
              در حال بارگذاری پشتیبانی...
            </button>
          </div>
        }
      >
        <SupportWidget initialOpen />
      </Suspense>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[80]" dir="rtl">
      <button
        type="button"
        onClick={() => setActivated(true)}
        className="flex items-center gap-2 rounded-full bg-cyan-500 px-4 py-3 font-bold text-zinc-950 shadow-xl shadow-black/30 transition hover:bg-cyan-400"
      >
        <span aria-hidden="true">◉</span>
        <span className="text-sm">پشتیبانی</span>
      </button>
    </div>
  );
};

export default SupportWidgetLoader;
