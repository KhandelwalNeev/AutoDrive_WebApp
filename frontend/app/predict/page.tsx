"use client";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { formatINR } from "@/lib/carData";

const API = "https://autodrivebackend-3.onrender.com";

interface BreakdownItem {
  l: string;
  v: number;
  cls: "pos" | "neg" | "neu";
}
interface PredictResult {
  price: number;
  low: number;
  high: number;
  confidence: number;
  breakdown: BreakdownItem[];
}
interface CascadeOptions {
  fuels: string[];
  engine_ccs: (number | string)[];
  cylinders: (number | string)[];
  max_powers: (number | string)[];
  transmissions: string[];
  body_types: string[];
  drivetrains: string[];
  seats: (number | string)[];
}

/* ── tiny helpers ─────────────────────────────── */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="field-row">
      <label>{label}</label>
      {children}
    </div>
  );
}

function Sel({
  value,
  onChange,
  disabled,
  items,
  placeholder = "Select…",
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  items: (string | number)[];
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || items.length === 0}
    >
      <option value="">{placeholder}</option>
      {items.map((i) => (
        <option key={String(i)} value={String(i)}>
          {String(i)}
        </option>
      ))}
    </select>
  );
}

/* ── main component ───────────────────────────── */
export default function PredictPage() {
  // top-level options (loaded once)
  const [regions, setRegions] = useState<string[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [cascade, setCascade] = useState<Partial<CascadeOptions>>({});

  // form state
  const [region, setRegion] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [fuel, setFuel] = useState("");
  const [engineCC, setEngineCC] = useState("");
  const [cylinders, setCylinders] = useState("");
  const [power, setPower] = useState("");
  const [transmission, setTransmission] = useState("");
  const [body, setBody] = useState("");
  const [drivetrain, setDrivetrain] = useState("");
  const [seats, setSeats] = useState("");
  const [km, setKm] = useState(45000);
  const [age, setAge] = useState(7);

  // UI state
  const [result, setResult] = useState<PredictResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  /* ── load regions + manufacturers once ─────── */
  useEffect(() => {
    axios
      .get(`${API}/predict/options`)
      .then(({ data }) => {
        if (data.success) {
          setRegions(data.regions);
          setManufacturers(data.manufacturers);
        }
      })
      .catch(() => showToast("⚠️ Could not reach the prediction server."));
  }, []);

  /* ── load models when manufacturer changes ── */
  useEffect(() => {
    if (!make) {
      setModels([]);
      setModel("");
      setCascade({});
      return;
    }
    axios
      .get(`${API}/predict/models`, { params: { manufacturer: make } })
      .then(({ data }) => {
        if (data.success) setModels(data.models);
      });
    // reset downstream
    setModel("");
    setCascade({});
    clearModelFields();
  }, [make]);

  /* ── load cascade options when model changes ─ */
  const clearModelFields = useCallback(() => {
    setFuel("");
    setEngineCC("");
    setCylinders("");
    setPower("");
    setTransmission("");
    setBody("");
    setDrivetrain("");
    setSeats("");
  }, []);

  useEffect(() => {
    if (!make || !model) {
      setCascade({});
      clearModelFields();
      return;
    }
    axios
      .get(`${API}/predict/models`, {
        params: { manufacturer: make, model },
      })
      .then(({ data }) => {
        if (data.success && data.options) setCascade(data.options);
      });
    clearModelFields();
  }, [model, make, clearModelFields]);

  /* ── electric shortcut ──────────────────────── */
  const isElectric = fuel === "electric";

  /* ── submit ─────────────────────────────────── */
  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!region || !make || !fuel) {
      showToast("⚠️ Please fill Region, Manufacturer & Fuel Type");
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const { data } = await axios.post(`${API}/predict_price`, {
        region,
        manufacturer: make,
        model,
        fuel,
        engine_cc: isElectric ? 0 : Number(engineCC),
        max_power: Number(power),
        cylinders: isElectric ? 0 : Number(cylinders),
        transmission,
        body_type: body,
        drive_train: drivetrain,
        seats: Number(seats),
        km_driven: km,
        age,
      });

      if (data.success) {
        setResult(data.result);
      } else {
        showToast("❌ " + data.error);
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        showToast("❌ " + err.response.data.error);
      } else {
        showToast("❌ Network or server error — is the Flask server running?");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── render ──────────────────────────────────── */
  return (
    <>
      <div className="page-hero" style={{ paddingBottom: "4rem" }}>
        <div className="container">
          <div
            className="section-badge"
            style={{
              background: "rgba(255,255,255,.12)",
              color: "rgba(255,255,255,.85)",
              marginBottom: "1rem",
            }}
          >
            🤖 AI Powered · India Market
          </div>
          <h1 className="page-hero-title">Predict the Price of Your Car</h1>
          <p className="page-hero-sub">
            Get an instant ₹ market valuation for your used car — accurate,
            free, and India-specific.
          </p>
        </div>
      </div>

      <div className="predict-page-wrap" style={{ paddingTop: "2.5rem" }}>
        <div className="container">
          <div className="predict-inner">
            {/* ── FORM ── */}
            <div className="predict-form-card">
              <h2>Tell Us About Your Car</h2>

              <form onSubmit={handlePredict}>
                <Field label="Region">
                  <Sel
                    value={region}
                    onChange={setRegion}
                    items={regions}
                    placeholder="Select City / Region"
                  />
                </Field>

                <Field label="Manufacturer">
                  <Sel
                    value={make}
                    onChange={setMake}
                    items={manufacturers}
                    placeholder="Select Manufacturer"
                  />
                </Field>

                <Field label="Car Model">
                  <Sel
                    value={model}
                    onChange={setModel}
                    items={models}
                    placeholder={
                      make ? "Select Model" : "Select manufacturer first"
                    }
                    disabled={!make}
                  />
                </Field>

                <Field label="Fuel Type">
                  <Sel
                    value={fuel}
                    onChange={setFuel}
                    items={cascade.fuels ?? []}
                    placeholder={model ? "Select Fuel" : "Select model first"}
                    disabled={!model}
                  />
                </Field>

                {!isElectric && (
                  <>
                    <Field label="Engine CC">
                      <Sel
                        value={engineCC}
                        onChange={setEngineCC}
                        items={cascade.engine_ccs ?? []}
                        disabled={!fuel}
                      />
                    </Field>

                    <Field label="Cylinders">
                      <Sel
                        value={cylinders}
                        onChange={setCylinders}
                        items={cascade.cylinders ?? []}
                        disabled={!fuel}
                      />
                    </Field>
                  </>
                )}

                <Field label="Max Power (bhp)">
                  <Sel
                    value={power}
                    onChange={setPower}
                    items={cascade.max_powers ?? []}
                    disabled={!fuel}
                  />
                </Field>

                <Field label="Transmission">
                  <Sel
                    value={transmission}
                    onChange={setTransmission}
                    items={cascade.transmissions ?? []}
                    disabled={!fuel}
                  />
                </Field>

                <Field label="Body Type">
                  <Sel
                    value={body}
                    onChange={setBody}
                    items={cascade.body_types ?? []}
                    disabled={!fuel}
                  />
                </Field>

                <Field label="Drive Train">
                  <Sel
                    value={drivetrain}
                    onChange={setDrivetrain}
                    items={cascade.drivetrains ?? []}
                    disabled={!fuel}
                  />
                </Field>

                <Field label="Seats">
                  <Sel
                    value={seats}
                    onChange={setSeats}
                    items={cascade.seats ?? []}
                    disabled={!fuel}
                  />
                </Field>

                <Field label={`KM Driven: ${km.toLocaleString("en-IN")} km`}>
                  <input
                    type="range"
                    min={0}
                    max={300000}
                    step={1000}
                    value={km}
                    onChange={(e) => setKm(Number(e.target.value))}
                  />
                </Field>

                <Field label={`Age: ${age} year${age !== 1 ? "s" : ""}`}>
                  <input
                    type="range"
                    min={0}
                    max={25}
                    step={1}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                  />
                </Field>

                <button
                  type="submit"
                  className="predict-submit-btn"
                  style={{ marginTop: "1.75rem" }}
                  disabled={loading}
                >
                  {loading ? "⏳ Predicting…" : "🤖 Predict Price"}
                </button>
              </form>
            </div>

            {/* ── RESULT ── */}
            <div className="result-card">
              <h3>💡 Price Estimate</h3>

              {!result ? (
                <div className="result-placeholder">
                  <div className="ph-icon">🚗</div>
                  <p>
                    Fill in your car details and click{" "}
                    <strong>Predict Price</strong> to get an instant valuation.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="result-est-label">Estimated Market Value</div>
                  <div className="result-price-big">
                    {formatINR(result.price)}
                  </div>
                  <div className="result-price-range">
                    Range: {formatINR(result.low)} — {formatINR(result.high)}
                  </div>

                  <div
                    className="confidence-bar-wrap"
                    style={{ margin: "1rem 0" }}
                  >
                    <div
                      style={{
                        height: 6,
                        borderRadius: 3,
                        background: "#e2e8f0",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${result.confidence}%`,
                          background: "var(--primary, #3b82f6)",
                          borderRadius: 3,
                          transition: "width .6s ease",
                        }}
                      />
                    </div>
                    <p
                      style={{
                        fontSize: ".8rem",
                        color: "#64748b",
                        marginTop: 4,
                      }}
                    >
                      {result.confidence}% confidence
                    </p>
                  </div>

                  <div className="breakdown-list" style={{ marginTop: "1rem" }}>
                    {result.breakdown.map((item, i) => (
                      <div key={i} className="breakdown-item">
                        <span className="bi-label">{item.l}</span>
                        <span className={`bi-val ${item.cls}`}>
                          {item.v >= 0 ? "+" : ""}
                          {formatINR(Math.abs(item.v))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="toast show">
          <span className="toast-text">{toast}</span>
        </div>
      )}
    </>
  );
}
