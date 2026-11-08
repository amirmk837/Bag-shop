import { useEffect, useMemo, useRef, useState } from "react";
import { getCities, getProvincesList } from "@code-plate/iran-cities";

const provinces = getProvincesList();

const normalizeText = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u200c/g, "")
    .replace(/\s+/g, " ");

const filterItems = (items, query) => {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return items;
  }

  return items.filter((item) => {
    const fa = normalizeText(item.fa);
    const en = normalizeText(item.en);

    return fa.includes(normalizedQuery) || en.includes(normalizedQuery);
  });
};

const IranLocationPicker = ({
  province,
  city,
  onProvinceChange,
  onCityChange,
  onProvinceBlur,
  onCityBlur,
  provinceError,
  cityError,
  provinceTouched,
  cityTouched,
}) => {
  const provinceRef = useRef(null);
  const cityRef = useRef(null);

  const [provinceOpen, setProvinceOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  const [provinceQuery, setProvinceQuery] = useState(province || "");
  const [previousProvince, setPreviousProvince] = useState(province);
  const [cityQuery, setCityQuery] = useState(city || "");
  const [previousCity, setPreviousCity] = useState(city);

  // =========================================
  // SYNC INITIAL VALUES
  // =========================================

  if (previousProvince !== province) {
    setPreviousProvince(province);
    setProvinceQuery(province || "");
  }

  if (previousCity !== city) {
    setPreviousCity(city);
    setCityQuery(city || "");
  }

  // =========================================
  // CITIES
  // =========================================

  const cities = useMemo(() => {
    if (!province) {
      return [];
    }

    return getCities(province) || [];
  }, [province]);

  const filteredProvinces = useMemo(
    () => filterItems(provinces, provinceQuery),
    [provinceQuery],
  );

  const filteredCities = useMemo(
    () => filterItems(cities, cityQuery),
    [cities, cityQuery],
  );

  // =========================================
  // OUTSIDE CLICK
  // =========================================

  useEffect(() => {
    const handleOutside = (event) => {
      if (provinceRef.current && !provinceRef.current.contains(event.target)) {
        setProvinceOpen(false);
      }

      if (cityRef.current && !cityRef.current.contains(event.target)) {
        setCityOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
    };
  }, []);

  // =========================================
  // PROVINCE
  // =========================================

  const handleProvinceInput = (event) => {
    const value = event.target.value;

    setProvinceQuery(value);
    setProvinceOpen(true);

    onProvinceChange("");
    onCityChange("");
  };

  const handleProvinceSelect = (item) => {
    setProvinceQuery(item.fa);
    setProvinceOpen(false);

    onProvinceChange(item.fa);
    onCityChange("");
    setCityQuery("");

    onProvinceBlur?.();
  };

  // =========================================
  // CITY
  // =========================================

  const handleCityInput = (event) => {
    const value = event.target.value;

    setCityQuery(value);
    setCityOpen(true);

    onCityChange("");
  };

  const handleCitySelect = (item) => {
    setCityQuery(item.fa);
    setCityOpen(false);

    onCityChange(item.fa);

    onCityBlur?.();
  };

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {/* ===================================== */}
      {/* PROVINCE */}
      {/* ===================================== */}

      <div ref={provinceRef} className="relative">
        <label className="mb-2 block text-sm text-zinc-300">استان</label>

        <input
          type="text"
          value={provinceQuery}
          onChange={handleProvinceInput}
          onFocus={() => setProvinceOpen(true)}
          onBlur={onProvinceBlur}
          placeholder="جستجوی استان..."
          autoComplete="off"
          className={`
            w-full
            rounded-xl
            border
            bg-zinc-950
            px-4
            py-3
            text-white
            outline-none
            transition
            ${
              provinceError && provinceTouched
                ? "border-red-700"
                : "border-zinc-700 focus:border-zinc-400"
            }
          `}
        />

        {provinceOpen && (
          <LocationDropdown
            items={filteredProvinces}
            onSelect={handleProvinceSelect}
            emptyText="استانی پیدا نشد."
          />
        )}

        {provinceError && provinceTouched && (
          <p className="mt-2 text-xs text-red-400">{provinceError}</p>
        )}
      </div>

      {/* ===================================== */}
      {/* CITY */}
      {/* ===================================== */}

      <div ref={cityRef} className="relative">
        <label className="mb-2 block text-sm text-zinc-300">شهر</label>

        <input
          type="text"
          value={cityQuery}
          onChange={handleCityInput}
          onFocus={() => {
            if (province) {
              setCityOpen(true);
            }
          }}
          onBlur={onCityBlur}
          disabled={!province}
          placeholder={
            province ? "جستجوی شهر..." : "ابتدا استان را انتخاب کنید"
          }
          autoComplete="off"
          className={`
            w-full
            rounded-xl
            border
            bg-zinc-950
            px-4
            py-3
            text-white
            outline-none
            transition
            disabled:cursor-not-allowed
            disabled:opacity-50
            ${
              cityError && cityTouched
                ? "border-red-700"
                : "border-zinc-700 focus:border-zinc-400"
            }
          `}
        />

        {cityOpen && province && (
          <LocationDropdown
            items={filteredCities}
            onSelect={handleCitySelect}
            emptyText="شهری پیدا نشد."
            showProvince={false}
          />
        )}

        {cityError && cityTouched && (
          <p className="mt-2 text-xs text-red-400">{cityError}</p>
        )}
      </div>
    </div>
  );
};

// =========================================
// DROPDOWN
// =========================================

const LocationDropdown = ({ items, onSelect, emptyText }) => {
  return (
    <div
      className="
        absolute
        right-0
        left-0
        top-[calc(100%+6px)]
        z-50
        max-h-60
        overflow-y-auto
        rounded-xl
        border
        border-zinc-800
        bg-zinc-950
        p-1
        shadow-2xl
      "
      dir="rtl"
    >
      {items.length === 0 ? (
        <div className="px-4 py-3 text-sm text-zinc-500">{emptyText}</div>
      ) : (
        items.map((item) => (
          <button
            key={item.id ?? item.en}
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              onSelect(item);
            }}
            className="
              flex
              w-full
              items-center
              rounded-lg
              px-3
              py-2.5
              text-right
              text-sm
              text-zinc-300
              transition
              hover:bg-zinc-800
              hover:text-white
            "
          >
            {item.fa}
          </button>
        ))
      )}
    </div>
  );
};

export default IranLocationPicker;
