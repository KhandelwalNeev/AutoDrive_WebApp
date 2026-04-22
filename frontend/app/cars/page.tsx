"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import axios from "axios";

const API = "https://autodrivebackend-3.onrender.com";
const CARS_PER_PAGE = 9;

// ─── FORMAT INR ──────────────────────────────────────────────────────────────
function formatINR(val: string | number | null | undefined): string {
  const num = typeof val === "string" ? parseFloat(val) : (val ?? 0);
  if (!num || isNaN(num)) return "N/A";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

// ─── API CAR TYPE (exact snake_case from PostgreSQL) ─────────────────────────
interface ApiCar {
  id: string;
  car_id: number;
  make: string;
  model: string;
  make_year: string; // "Jan-20"
  registration_year: string; // "Jan-21"
  price: string; // "3928758" — comes as string!
  fuel_type: string; // "petrol" | "diesel" | "electric" | "hybrid"
  transmission: string; // "automatic" | "manual"
  km_driven: number;
  mileage_arai: string; // "13.17 kmpl"
  body_type: string; // "suv"
  city: string;
  thumbnails: string;
  bg_removed_img: string;
  all_images: string; // comma-separated URLs
  // specs
  cylinders: string;
  displacement: string;
  doors: string;
  drive: string;
  front_tyre_size: string;
  rear_tyre_size: string;
  front_brake: string | null;
  rear_brake: string | null;
  gear_box: string;
  gears: string;
  ground_clearance: string;
  height: string;
  kerb_weight: string;
  length: string;
  max_power: string;
  max_torque: string;
  no_of_owner: string;
  seating_rows: string;
  steering_adj: string;
  steering_adj_type: string;
  steering_type: string;
  suspension_front: string;
  suspension_rear: string;
  turbo: string;
  valve_config: string;
  wheel_base: string;
  width: string;
  boot_space: string;
  alloy_wheels: string;
  // ratings
  core_rating: string;
  exterior_rating: string;
  interior_rating: string;
  wear_rating: string;
  support_rating: string;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function parseYear(makeYear: string): number {
  // "Jan-20" → 2020, "2020" → 2020
  if (!makeYear) return 0;
  const parts = makeYear.split("-");
  const yr = parseInt(parts[parts.length - 1]);
  return yr < 100 ? 2000 + yr : yr;
}

function capitalize(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function getFuelIcon(fuelType: string): string {
  const f = (fuelType || "").toLowerCase();
  if (f === "electric") return "EV";
  if (f === "hybrid") return "HY";
  return "ICE";
}

// ─── CAR MODAL ───────────────────────────────────────────────────────────────
function CarModal({ car, onClose }: { car: ApiCar; onClose: () => void }) {
  const rows: [string, string][] = [
    ["Front Tyre Size", car.front_tyre_size ?? "—"],
    [
      "Km Driven",
      car.km_driven != null
        ? `${car.km_driven.toLocaleString("en-IN")} km`
        : "—",
    ],
    ["Body Type", capitalize(car.body_type ?? "")],
    ["Boot Space", car.boot_space ?? "—"],
    ["Car ID", String(car.car_id ?? "—")],
    ["City", car.city ?? "—"],
    ["Core Rating", car.core_rating ?? "—"],
    ["Cylinders", car.cylinders ?? "—"],
    ["Displacement", car.displacement ?? "—"],
    ["Doors", car.doors ?? "—"],
    ["Drive", car.drive ?? "—"],
    ["Exterior Rating", car.exterior_rating ?? "—"],
    ["Front Brake", car.front_brake ?? "—"],
    ["Fuel Type", capitalize(car.fuel_type ?? "")],
    ["Gear Box", car.gear_box ?? "—"],
    ["Gears", car.gears ?? "—"],
    ["Ground Clearance", car.ground_clearance ?? "—"],
    ["Height", car.height ?? "—"],
    ["Interior Rating", car.interior_rating ?? "—"],
    ["Kerb Weight", car.kerb_weight ?? "—"],
    ["Length", car.length ?? "—"],
    ["Make", car.make ?? "—"],
    ["Make Year", car.make_year ?? "—"],
    ["Max Power", car.max_power ?? "—"],
    ["Max Torque", car.max_torque ?? "—"],
    ["Mileage", car.mileage_arai ?? "—"],
    ["Model", car.model ?? "—"],
    ["No of Owners", car.no_of_owner ?? "—"],
    ["Price", formatINR(car.price)],
    ["Rear Brake", car.rear_brake ?? "—"],
    ["Rear Tyre Size", car.rear_tyre_size ?? "—"],
    ["Registration Year", car.registration_year ?? "—"],
    ["Seating Rows", car.seating_rows ?? "—"],
    ["Steering Adjustment", car.steering_adj ?? "—"],
    ["Steering Adjustment Types", car.steering_adj_type ?? "—"],
    ["Steering Type", car.steering_type ?? "—"],
    ["Support Rating", car.support_rating ?? "—"],
    ["Suspension Front", car.suspension_front ?? "—"],
    ["Suspension Rear", car.suspension_rear ?? "—"],
    ["Transmission", capitalize(car.transmission ?? "")],
    ["Turbo", car.turbo ?? "—"],
    ["Valve Config", car.valve_config ?? "—"],
    ["Wear Rating", car.wear_rating ?? "—"],
    ["Wheel Base", car.wheel_base ?? "—"],
    ["Width", car.width ?? "—"],
    ["Alloy Wheels", car.alloy_wheels ?? "—"],
  ];

  const imgList = car.all_images
    ? car.all_images
        .split(",")
        .filter(
          (u) =>
            u.trim().endsWith(".JPG") ||
            u.trim().endsWith(".jpg") ||
            u.trim().endsWith(".png"),
        )
    : [];
  const [activeImg, setActiveImg] = useState(
    car.thumbnails || car.bg_removed_img || "",
  );

  return (
    <div
      className="modal-overlay open"
      id="carModal"
      onClick={(e) => {
        if ((e.target as HTMLElement).id === "carModal") onClose();
      }}
    >
      <div className="modal" style={{ maxWidth: "750px" }}>
        <div className="modal-header">
          <h2>
            {car.make_year} {car.make} {car.model}
          </h2>
          <button className="modal-close" onClick={onClose}>
            X
          </button>
        </div>
        <div className="modal-body">
          {/* Main image */}
          <div className="detail-car-image">
            <img
              src={activeImg || car.thumbnails}
              alt={`${car.make_year} ${car.make} ${car.model}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "var(--radius-lg)",
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = car.thumbnails;
              }}
            />
          </div>

          {/* Image gallery thumbnails */}
          {imgList.length > 1 && (
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                overflowX: "auto",
                paddingBottom: "0.5rem",
                marginBottom: "1rem",
              }}
            >
              {imgList.slice(0, 10).map((url, idx) => (
                <img
                  key={idx}
                  src={url.trim()}
                  alt={`view-${idx}`}
                  onClick={() => setActiveImg(url.trim())}
                  style={{
                    width: 64,
                    height: 48,
                    objectFit: "cover",
                    borderRadius: 8,
                    cursor: "pointer",
                    flexShrink: 0,
                    border:
                      activeImg === url.trim()
                        ? "2px solid var(--blue)"
                        : "2px solid transparent",
                    opacity: activeImg === url.trim() ? 1 : 0.6,
                    transition: "all 0.2s",
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ))}
            </div>
          )}

          {/* Quick specs */}
          <div className="detail-specs-grid">
            {[
              ["Yr", "Year", car.make_year ?? "—"],
              [
                "KM",
                "KM Driven",
                car.km_driven != null
                  ? `${Math.round(car.km_driven / 1000)}k km`
                  : "—",
              ],
              [
                getFuelIcon(car.fuel_type),
                "Fuel",
                capitalize(car.fuel_type ?? ""),
              ],
              ["AT", "Transmission", capitalize(car.transmission ?? "")],
            ].map(([icon, label, val]) => (
              <div className="detail-spec" key={label}>
                <div className="detail-spec-icon">{icon}</div>
                <div className="detail-spec-label">{label}</div>
                <div className="detail-spec-val">{val}</div>
              </div>
            ))}
          </div>

          {/* Ratings */}
          <div className="detail-features">
            <h4>Ratings</h4>
            <div className="feature-tags">
              {[
                `Core: ${car.core_rating ?? "—"}`,
                `Exterior: ${car.exterior_rating ?? "—"}`,
                `Interior: ${car.interior_rating ?? "—"}`,
                `Wear: ${car.wear_rating ?? "—"}`,
                `Support: ${car.support_rating ?? "—"}`,
              ].map((tag) => (
                <span key={tag} className="feature-tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Price + actions */}
          <div className="detail-price-row">
            <div>
              <div
                style={{
                  fontSize: ".8rem",
                  color: "var(--text-light)",
                  marginBottom: ".25rem",
                }}
              >
                Listed Price
              </div>
              <div className="detail-price">{formatINR(car.price)}</div>
            </div>
            <div className="detail-actions">
              <Link href="/booking" className="btn btn-outline btn-sm">
                Test Drive
              </Link>
              <Link href="/booking" className="btn btn-primary">
                Buy Now
              </Link>
            </div>
          </div>

          {/* Full specs table */}
          <div className="full-specs-section">
            <h3 className="full-specs-title">Full Specifications</h3>
            <div className="full-specs-table">
              {rows.map(([k, v]) => (
                <div className="spec-row" key={k}>
                  <span className="spec-key">{k}</span>
                  <span className="spec-val">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function CarsPage() {
  const [make, setMake] = useState("");
  const [maxPrice, setMaxPrice] = useState(5000000);
  const [fuels, setFuels] = useState<string[]>([]);
  const [transmissions, setTransmissions] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [modalCar, setModalCar] = useState<ApiCar | null>(null);
  const [allCars, setAllCars] = useState<ApiCar[]>([]); // all from /all_cars
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [availableMakes, setAvailableMakes] = useState<string[]>([]);

  // ── Derive max price from data so slider is dynamic ──────────────────────
  const dataMaxPrice = allCars.reduce((mx, c) => {
    const p = parseFloat(c.price) || 0;
    return p > mx ? p : mx;
  }, 5000000);

  // ── Load ALL cars once on mount ──────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get<ApiCar[]>(`${API}/all_cars`);
        const data = Array.isArray(res.data) ? res.data : [];
        setAllCars(data);

        // Build unique sorted makes list from actual data
        const makes = Array.from(
          new Set(data.map((c) => c.make).filter(Boolean)),
        ).sort();
        setAvailableMakes(makes);
      } catch (err) {
        console.error("Failed to load cars:", err);
        setError("Failed to load inventory. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Client-side filtering ────────────────────────────────────────────────
  // The backend /filter_cars has some issues (filters by "fuel" but db has "fuel_type"),
  // so we do reliable client-side filtering on the full dataset for instant UX.
  const filteredCars = allCars.filter((car) => {
    // Make filter
    if (make && car.make?.toLowerCase() !== make.toLowerCase()) return false;

    // Price filter — price comes as string from API
    const priceNum = parseFloat(car.price) || 0;
    if (priceNum > maxPrice) return false;

    // Fuel filter — API returns lowercase ("petrol","diesel","electric","hybrid")
    if (fuels.length > 0) {
      const carFuel = (car.fuel_type || "").toLowerCase();
      const matched = fuels.some((f) => f.toLowerCase() === carFuel);
      if (!matched) return false;
    }

    // Transmission filter — API returns lowercase ("automatic","manual")
    if (transmissions.length > 0) {
      const carTx = (car.transmission || "").toLowerCase();
      const matched = transmissions.some((t) => t.toLowerCase() === carTx);
      if (!matched) return false;
    }

    return true;
  });

  // ── Sort ─────────────────────────────────────────────────────────────────
  const sortedCars = [...filteredCars].sort((a, b) => {
    if (sortBy === "price-asc")
      return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
    if (sortBy === "price-desc")
      return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
    if (sortBy === "mileage") return (a.km_driven || 0) - (b.km_driven || 0);
    if (sortBy === "year")
      return parseYear(b.make_year) - parseYear(a.make_year);
    return parseYear(b.make_year) - parseYear(a.make_year); // newest default
  });

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(sortedCars.length / CARS_PER_PAGE);
  const pageCars = sortedCars.slice(
    (currentPage - 1) * CARS_PER_PAGE,
    currentPage * CARS_PER_PAGE,
  );

  const toggleArr = (
    arr: string[],
    setArr: (a: string[]) => void,
    val: string,
  ) => {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setMake("");
    setMaxPrice(dataMaxPrice || 5000000);
    setFuels([]);
    setTransmissions([]);
    setSortBy("newest");
    setCurrentPage(1);
  };

  const hasFilters = !!(
    make ||
    fuels.length ||
    transmissions.length ||
    maxPrice < (dataMaxPrice || 5000000)
  );

  // Format max price label
  const priceLabel =
    maxPrice >= 10000000
      ? `${(maxPrice / 10000000).toFixed(1)} Cr`
      : maxPrice >= 100000
        ? `${(maxPrice / 100000).toFixed(0)} L`
        : formatINR(maxPrice);

  return (
    <>
      {/* PAGE HERO */}
      <div className="page-hero">
        <div className="container">
          <div
            className="section-badge"
            style={{
              background: "rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,.7)",
              borderColor: "rgba(255,255,255,.1)",
              marginBottom: "1rem",
            }}
          >
            Our Inventory
          </div>
          <h1 className="page-hero-title">Browse Our Cars</h1>
          <p className="page-hero-sub">
            {loading
              ? "Loading inventory..."
              : error
                ? "Failed to load inventory"
                : `${allCars.length.toLocaleString()} certified pre-owned vehicles — filtered and ready for you.`}
          </p>
        </div>
      </div>

      <section className="section-sm">
        <div className="container">
          {/* Error state */}
          {error && (
            <div
              style={{
                padding: "1rem 1.5rem",
                borderRadius: 12,
                marginBottom: "1.5rem",
                background: "rgba(239,68,68,.1)",
                border: "1px solid rgba(239,68,68,.25)",
                color: "#fca5a5",
                fontSize: "0.9rem",
              }}
            >
              {error}
              <button
                onClick={() => window.location.reload()}
                style={{
                  marginLeft: "1rem",
                  padding: "0.2rem 0.75rem",
                  borderRadius: 6,
                  border: "1px solid rgba(239,68,68,.4)",
                  background: "transparent",
                  color: "#fca5a5",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                Retry
              </button>
            </div>
          )}

          <div className="cars-layout">
            {/* ── FILTERS SIDEBAR ──────────────────────────────────────── */}
            <aside className="filters-panel">
              <div className="filters-title">
                Filters
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    style={{
                      fontSize: ".8rem",
                      color: "var(--blue)",
                      fontWeight: 600,
                      cursor: "pointer",
                      background: "none",
                      border: "none",
                    }}
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Make — dynamic from actual data */}
              <div className="filter-group">
                <label className="filter-label">Make</label>
                <select
                  className="filter-select"
                  value={make}
                  onChange={(e) => {
                    setMake(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All Makes</option>
                  {availableMakes.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Max Price */}
              <div className="filter-group">
                <label className="filter-label">
                  Max Price:{" "}
                  <strong style={{ color: "var(--blue)" }}>
                    {hasFilters || maxPrice < (dataMaxPrice || 5000000)
                      ? `Rs. ${priceLabel}`
                      : "Any"}
                  </strong>
                </label>
                <input
                  type="range"
                  className="range-slider"
                  min={300000}
                  max={dataMaxPrice || 5000000}
                  step={100000}
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                />
                <div className="price-range-labels">
                  <span>Rs. 3L</span>
                  <span>
                    {dataMaxPrice >= 10000000
                      ? `Rs. ${(dataMaxPrice / 10000000).toFixed(0)}Cr`
                      : `Rs. ${Math.round(dataMaxPrice / 100000)}L`}
                  </span>
                </div>
              </div>

              {/* Fuel Type — values match API lowercase */}
              <div className="filter-group">
                <label className="filter-label">Fuel Type</label>
                <div className="checkbox-group">
                  {[
                    { label: "Petrol", value: "petrol" },
                    { label: "Diesel", value: "diesel" },
                    { label: "Hybrid", value: "hybrid" },
                    { label: "Electric (EV)", value: "electric" },
                    { label: "CNG", value: "cng" },
                  ].map(({ label, value }) => (
                    <label key={value} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={fuels.includes(value)}
                        onChange={() => toggleArr(fuels, setFuels, value)}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Transmission — values match API lowercase */}
              <div className="filter-group">
                <label className="filter-label">Transmission</label>
                <div className="checkbox-group">
                  {[
                    { label: "Automatic", value: "automatic" },
                    { label: "Manual", value: "manual" },
                  ].map(({ label, value }) => (
                    <label key={value} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={transmissions.includes(value)}
                        onChange={() =>
                          toggleArr(transmissions, setTransmissions, value)
                        }
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filter summary */}
              {hasFilters && (
                <div
                  style={{
                    marginTop: "1rem",
                    padding: "0.75rem 1rem",
                    borderRadius: 10,
                    background: "rgba(67,97,238,0.1)",
                    border: "1px solid rgba(67,97,238,0.2)",
                    fontSize: "0.8rem",
                    color: "var(--blue)",
                    fontWeight: 600,
                  }}
                >
                  {sortedCars.length} of {allCars.length} cars match
                </div>
              )}
            </aside>

            {/* ── LISTING ──────────────────────────────────────────────── */}
            <div>
              {/* Sort bar */}
              <div className="sort-bar">
                <div className="results-count">
                  {loading ? (
                    "Loading..."
                  ) : (
                    <>
                      Showing <strong>{pageCars.length}</strong> of{" "}
                      <strong>{sortedCars.length}</strong> cars
                    </>
                  )}
                </div>
                <div className="sort-options">
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="newest">Newest First</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="mileage">Lowest KM Driven</option>
                    <option value="year">Year: Newest</option>
                  </select>
                  <div className="view-toggle">
                    <button
                      className={`view-btn${viewMode === "grid" ? " active" : ""}`}
                      onClick={() => setViewMode("grid")}
                    >
                      Grid
                    </button>
                    <button
                      className={`view-btn${viewMode === "list" ? " active" : ""}`}
                      onClick={() => setViewMode("list")}
                    >
                      List
                    </button>
                  </div>
                </div>
              </div>

              {/* Loading skeleton */}
              {loading && (
                <div className="cars-grid">
                  {[...Array(9)].map((_, i) => (
                    <div
                      key={i}
                      className="car-card"
                      style={{
                        opacity: 0.4,
                        animation: "pulse 1.5s ease-in-out infinite",
                      }}
                    >
                      <div
                        style={{
                          height: 200,
                          background: "rgba(255,255,255,0.06)",
                          borderRadius: 12,
                        }}
                      />
                      <div style={{ padding: "1rem" }}>
                        <div
                          style={{
                            height: 14,
                            background: "rgba(255,255,255,0.07)",
                            borderRadius: 6,
                            marginBottom: "0.5rem",
                            width: "60%",
                          }}
                        />
                        <div
                          style={{
                            height: 18,
                            background: "rgba(255,255,255,0.07)",
                            borderRadius: 6,
                            width: "80%",
                          }}
                        />
                      </div>
                      <style>{`@keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:0.2} }`}</style>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!loading && sortedCars.length === 0 && (
                <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
                  <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>
                    search
                  </div>
                  <h3
                    style={{
                      fontSize: "1.3rem",
                      fontWeight: 700,
                      marginBottom: ".5rem",
                    }}
                  >
                    No Cars Found
                  </h3>
                  <p
                    style={{
                      color: "var(--text-light)",
                      marginBottom: "1.5rem",
                    }}
                  >
                    {allCars.length > 0
                      ? "No cars match the selected filters. Try adjusting them."
                      : "No inventory available. Please check back later."}
                  </p>
                  {hasFilters && (
                    <button className="btn btn-primary" onClick={clearFilters}>
                      Clear Filters
                    </button>
                  )}
                </div>
              )}

              {/* Cars grid */}
              {!loading && pageCars.length > 0 && (
                <div
                  className="cars-grid"
                  style={
                    viewMode === "list" ? { gridTemplateColumns: "1fr" } : {}
                  }
                >
                  {pageCars.map((car) => (
                    <div
                      key={car.id || String(car.car_id)}
                      className="car-card"
                    >
                      <div className="car-card-image">
                        <img
                          src={car.bg_removed_img || car.thumbnails}
                          alt={`${car.make_year} ${car.make} ${car.model}`}
                          loading="lazy"
                          onError={(e) => {
                            const el = e.target as HTMLImageElement;
                            if (el.src !== car.thumbnails)
                              el.src = car.thumbnails;
                          }}
                        />
                        <div className="img-overlay" />
                        {/* City badge */}
                        {car.city && (
                          <div className="car-badge-overlay">
                            <span className="car-badge badge-certified">
                              {car.city}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="car-card-body">
                        <div className="car-category-label">
                          {capitalize(car.body_type || "")}
                        </div>
                        <div className="car-make-model">
                          {car.make} {car.model}
                        </div>
                        <div className="car-specs-row">
                          <div className="car-spec-pill">
                            <span>
                              {(car.fuel_type || "").toLowerCase() ===
                              "electric"
                                ? "EV"
                                : "fuel"}
                            </span>
                            {capitalize(car.fuel_type || "")}
                          </div>
                          <div className="car-spec-pill">
                            <span>tx</span>
                            {capitalize(car.transmission || "")}
                          </div>
                          <div className="car-spec-pill">
                            <span>km</span>
                            {car.km_driven != null
                              ? `${Math.round(car.km_driven / 1000)}k km`
                              : "—"}
                          </div>
                        </div>
                        <div className="car-card-footer">
                          <div className="car-price">
                            {formatINR(car.price)}
                          </div>
                          <div className="car-actions">
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => setModalCar(car)}
                            >
                              Details
                            </button>
                            <Link
                              href="/booking"
                              className="btn btn-primary btn-sm"
                            >
                              Book Now
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {!loading && totalPages > 1 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: ".5rem",
                    marginTop: "2.5rem",
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={currentPage === 1}
                    style={{
                      padding: "0.4rem 1rem",
                      borderRadius: 9999,
                      border: "1.5px solid var(--border)",
                      background: "var(--bg-card)",
                      color: "var(--text-white)",
                      cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      opacity: currentPage === 1 ? 0.4 : 1,
                    }}
                  >
                    Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === totalPages ||
                        Math.abs(p - currentPage) <= 2,
                    )
                    .map((p, idx, arr) => (
                      <span key={`page-${p}`} style={{ display: "contents" }}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                          <span
                            style={{
                              padding: "0.4rem 0.5rem",
                              color: "var(--text-light)",
                            }}
                          >
                            ...
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setCurrentPage(p);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "50%",
                            border: `1.5px solid ${p === currentPage ? "var(--blue)" : "var(--border)"}`,
                            background:
                              p === currentPage
                                ? "var(--blue)"
                                : "var(--bg-card)",
                            color:
                              p === currentPage ? "white" : "var(--text-white)",
                            fontSize: ".88rem",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {p}
                        </button>
                      </span>
                    ))}

                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: "0.4rem 1rem",
                      borderRadius: 9999,
                      border: "1.5px solid var(--border)",
                      background: "var(--bg-card)",
                      color: "var(--text-white)",
                      cursor:
                        currentPage === totalPages ? "not-allowed" : "pointer",
                      opacity: currentPage === totalPages ? 0.4 : 1,
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Modal */}
      {modalCar && (
        <CarModal car={modalCar} onClose={() => setModalCar(null)} />
      )}

      {/* Footer */}
      <footer>
        <div className="container">
          <div className="footer-bottom" style={{ justifyContent: "center" }}>
            <div>2026 AutoDrive. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </>
  );
}
