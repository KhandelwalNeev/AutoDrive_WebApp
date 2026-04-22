"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API = "https://autodrivebackend-3.onrender.com";

type Tab = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState<string | null>(null);

  // ── Login state ──────────────────────────────────────────────
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [loginEmailErr, setLoginEmailErr] = useState("");
  const [loginPwErr, setLoginPwErr] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [showLoginPw, setShowLoginPw] = useState(false);

  // ── Signup state ─────────────────────────────────────────────
  const [suFname, setSuFname] = useState("");
  const [suLname, setSuLname] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPhone, setSuPhone] = useState("");
  const [suPw, setSuPw] = useState("");
  const [suConfirm, setSuConfirm] = useState("");
  const [suFnameErr, setSuFnameErr] = useState("");
  const [suLnameErr, setSuLnameErr] = useState("");
  const [suEmailErr, setSuEmailErr] = useState("");
  const [suPwErr, setSuPwErr] = useState("");
  const [suConfirmErr, setSuConfirmErr] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [showSuPw, setShowSuPw] = useState(false);
  const [showSuConfirm, setShowSuConfirm] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("ad_user") || "null");
    if (user) setAlreadyLoggedIn(user.name);
  }, []);

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  // ── Helpers ──────────────────────────────────────────────────
  function saveUser(data: object) {
    localStorage.setItem("ad_user", JSON.stringify(data));
    window.dispatchEvent(new Event("ad_auth_change"));
  }

  // ── Login ────────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    let valid = true;

    if (!isValidEmail(loginEmail)) {
      setLoginEmailErr("Enter a valid email.");
      valid = false;
    } else setLoginEmailErr("");

    if (loginPw.length < 6) {
      setLoginPwErr("At least 6 characters.");
      valid = false;
    } else setLoginPwErr("");

    if (!valid) return;

    setLoginLoading(true);
    try {
      const { data } = await axios.post(`${API}/login`, {
        email: loginEmail,
        password: loginPw,
      });

      if (data.success) {
        saveUser(data);
        setLoginSuccess(true);
        setTimeout(() => router.push("/"), 1800);
      } else {
        setLoginPwErr(data.message || "Invalid credentials.");
      }
    } catch {
      setLoginPwErr("Login failed. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  }

  // ── Signup ───────────────────────────────────────────────────
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    let valid = true;

    if (!suFname.trim()) {
      setSuFnameErr("Required.");
      valid = false;
    } else setSuFnameErr("");
    if (!suLname.trim()) {
      setSuLnameErr("Required.");
      valid = false;
    } else setSuLnameErr("");
    if (!isValidEmail(suEmail)) {
      setSuEmailErr("Enter a valid email.");
      valid = false;
    } else setSuEmailErr("");
    if (suPw.length < 8) {
      setSuPwErr("At least 8 characters.");
      valid = false;
    } else setSuPwErr("");
    if (suConfirm !== suPw) {
      setSuConfirmErr("Passwords do not match.");
      valid = false;
    } else setSuConfirmErr("");

    if (!valid) return;

    setSignupLoading(true);
    try {
      const { data } = await axios.post(`${API}/create_user`, {
        firstname: suFname,
        lastname: suLname,
        email: suEmail,
        phone: suPhone,
        password: suPw,
      });

      if (data.success) {
        saveUser({
          user_id: data.user_id,
          name: `${suFname} ${suLname}`,
          email: suEmail,
          phone: suPhone,
        });
        setSignupSuccess(true);
        setTimeout(() => router.push("/cars"), 1800);
      } else {
        setSuEmailErr(data.error || "Signup failed.");
      }
    } catch {
      setSuEmailErr("Signup failed. Please try again.");
    } finally {
      setSignupLoading(false);
    }
  }

  return (
    <>
      {/* ── Styles ─────────────────────────────────────────────── */}
      <style>{`
        /* ── Variables ── */
        :root {
          --blue: #3b82f6;
          --blue-dim: rgba(59,130,246,0.15);
          --green: #10b981;
          --red: #ef4444;
          --bg: #080c18;
          --bg-card: #0f1629;
          --border: rgba(255,255,255,0.08);
          --text-white: #f0f4ff;
          --text-light: #8892a4;
          --radius: 14px;
          --radius-sm: 8px;
        }

        /* ── Page ── */
        .auth-page {
          min-height: 100vh;
          background: var(--bg);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 100px 1rem 2rem;
          position: relative;
          overflow: hidden;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }

        /* Ambient glows */
        .auth-page::before,
        .auth-page::after {
          content: '';
          position: fixed;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
          opacity: 0.25;
        }
        .auth-page::before {
          width: 500px; height: 500px;
          background: var(--blue);
          top: -150px; left: -100px;
        }
        .auth-page::after {
          width: 400px; height: 400px;
          background: #6366f1;
          bottom: -100px; right: -100px;
        }

        /* ── Card ── */
        .auth-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 2.5rem 2rem;
          width: 100%;
          max-width: 480px;
          position: relative;
          z-index: 1;
          box-shadow: 0 32px 80px rgba(0,0,0,0.5);
          animation: slideUp 0.5s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Logo ── */
        .auth-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: .6rem;
          margin-bottom: 1.75rem;
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--text-white);
          text-decoration: none;
        }
        .auth-logo span { color: var(--blue); }
        .auth-logo-icon {
          width: 38px; height: 38px;
          background: var(--blue-dim);
          border: 1px solid rgba(59,130,246,0.3);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem;
        }

        /* ── Already logged in banner ── */
        .already-banner {
          text-align: center;
          padding: .875rem 1rem;
          background: rgba(16,185,129,0.08);
          border: 1px solid rgba(16,185,129,0.25);
          border-radius: var(--radius-sm);
          margin-bottom: 1.5rem;
          color: var(--text-white);
          font-size: .875rem;
        }

        /* ── Tabs ── */
        .auth-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 2rem;
          gap: 4px;
        }
        .auth-tab {
          text-align: center;
          padding: .625rem;
          border-radius: 7px;
          cursor: pointer;
          font-weight: 600;
          font-size: .875rem;
          color: var(--text-light);
          transition: all .2s;
          user-select: none;
        }
        .auth-tab.active {
          background: var(--blue);
          color: #fff;
          box-shadow: 0 2px 12px rgba(59,130,246,0.35);
        }

        /* ── Form body ── */
        .auth-form { display: none; }
        .auth-form.active { display: block; animation: fadeIn .3s ease both; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

        .auth-heading { font-size: 1.4rem; font-weight: 700; color: var(--text-white); margin-bottom: .25rem; }
        .auth-sub { font-size: .85rem; color: var(--text-light); margin-bottom: 1.5rem; }

        /* ── Field ── */
        .field { margin-bottom: 1rem; }
        .field label { display: block; font-size: .8rem; font-weight: 600; color: var(--text-light); margin-bottom: .35rem; letter-spacing: .03em; text-transform: uppercase; }
        .field input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: .7rem .9rem;
          color: var(--text-white);
          font-size: .9rem;
          outline: none;
          transition: border-color .2s, box-shadow .2s;
          box-sizing: border-box;
        }
        .field input:focus {
          border-color: var(--blue);
          box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
        }
        .field input.err { border-color: var(--red); }
        .field input::placeholder { color: #4a5568; }
        .field-err { font-size: .75rem; color: var(--red); margin-top: .3rem; }

        /* Inline two-column fields */
        .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }

        /* Password wrapper */
        .pw-wrap { position: relative; }
        .pw-wrap input { padding-right: 2.75rem; }
        .pw-toggle {
          position: absolute; right: .75rem; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; font-size: 1rem; color: var(--text-light);
          padding: 0; line-height: 1;
        }
        .pw-toggle:hover { color: var(--text-white); }

        /* Forgot */
        .forgot { text-align: right; margin-top: -.5rem; margin-bottom: 1rem; }
        .forgot a { font-size: .8rem; color: var(--blue); text-decoration: none; }
        .forgot a:hover { text-decoration: underline; }

        /* Submit */
        .auth-submit {
          width: 100%;
          background: var(--blue);
          color: #fff;
          border: none;
          border-radius: var(--radius-sm);
          padding: .8rem;
          font-size: .95rem;
          font-weight: 700;
          cursor: pointer;
          margin-top: .25rem;
          transition: background .2s, transform .15s, box-shadow .2s;
          box-shadow: 0 4px 20px rgba(59,130,246,0.3);
        }
        .auth-submit:hover:not(:disabled) {
          background: #2563eb;
          box-shadow: 0 6px 28px rgba(59,130,246,0.45);
          transform: translateY(-1px);
        }
        .auth-submit:active:not(:disabled) { transform: translateY(0); }
        .auth-submit:disabled { opacity: .6; cursor: not-allowed; }

        /* Divider */
        .divider {
          display: flex; align-items: center; gap: .75rem;
          color: var(--text-light); font-size: .8rem;
          margin: 1.25rem 0;
        }
        .divider::before, .divider::after {
          content: ''; flex: 1; height: 1px; background: var(--border);
        }

        /* Social */
        .social-row { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
        .social-btn {
          display: flex; align-items: center; justify-content: center; gap: .5rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: .65rem;
          color: var(--text-white);
          font-size: .85rem; font-weight: 600;
          cursor: pointer;
          transition: background .2s, border-color .2s;
        }
        .social-btn:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.16); }

        /* Switch link */
        .auth-switch { text-align: center; font-size: .83rem; color: var(--text-light); margin-top: 1.25rem; }
        .auth-switch a { color: var(--blue); cursor: pointer; font-weight: 600; text-decoration: none; }
        .auth-switch a:hover { text-decoration: underline; }

        /* Terms */
        .auth-terms { text-align: center; font-size: .75rem; color: var(--text-light); margin-top: 1rem; }
        .auth-terms a { color: var(--blue); text-decoration: none; }

        /* Success */
        .success-box {
          text-align: center;
          padding: 2.5rem 1rem;
          animation: fadeIn .4s ease both;
        }
        .success-icon { font-size: 3rem; margin-bottom: 1rem; }
        .success-title { font-size: 1.3rem; font-weight: 700; color: var(--text-white); margin-bottom: .5rem; }
        .success-msg { font-size: .875rem; color: var(--text-light); }

        /* ── Navbar (minimal) ── */
        .auth-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
          background: rgba(8,12,24,0.85);
          backdrop-filter: blur(24px);
          border-bottom: 1px solid var(--border);
          padding: 0 1.5rem;
          height: 64px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .nav-logo {
          display: flex; align-items: center; gap: .5rem;
          font-size: 1.15rem; font-weight: 800; color: var(--text-white);
          text-decoration: none;
        }
        .nav-logo-icon {
          width: 32px; height: 32px;
          background: var(--blue-dim);
          border: 1px solid rgba(59,130,246,0.3);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: .9rem;
        }
        .nav-logo span { color: var(--blue); }
        .nav-links-mini { display: flex; gap: 1.25rem; }
        .nav-links-mini a {
          color: var(--text-light); font-size: .875rem; text-decoration: none;
          transition: color .2s;
        }
        .nav-links-mini a:hover { color: var(--text-white); }
        .nav-btn {
          background: var(--blue); color: #fff;
          border: none; border-radius: 8px;
          padding: .45rem 1rem; font-size: .85rem; font-weight: 600;
          cursor: pointer; text-decoration: none;
          transition: background .2s;
        }
        .nav-btn:hover { background: #2563eb; }

        /* ── Responsive ── */
        @media (max-width: 540px) {
          .auth-card { padding: 1.75rem 1.25rem; border-radius: 16px; }
          .field-row { grid-template-columns: 1fr; }
          .nav-links-mini { display: none; }
          .auth-heading { font-size: 1.2rem; }
        }
      `}</style>

      {/* ── Minimal Navbar ─────────────────────────────────────── */}
      <nav className="auth-nav">
        <Link href="/" className="nav-logo">
          <div className="nav-logo-icon">🚗</div>
          <span>
            Auto<span>Drive</span>
          </span>
        </Link>
        <div className="nav-links-mini">
          <Link href="/">Home</Link>
          <Link href="/cars">Browse Cars</Link>
          <Link href="/predict">Price Predictor</Link>
          <Link href="/booking">Book a Drive</Link>
        </div>
        <Link href="/cars" className="nav-btn">
          Browse Cars
        </Link>
      </nav>

      {/* ── Page ───────────────────────────────────────────────── */}
      <div className="auth-page">
        <div className="auth-card">
          {/* Logo */}
          <div className="auth-logo">
            <div className="auth-logo-icon">🚗</div>
            Auto<span>Drive</span>
          </div>

          {/* Already signed in */}
          {alreadyLoggedIn && (
            <div className="already-banner">
              👋 Hello, <strong>{alreadyLoggedIn}</strong>! You&rsquo;re already
              signed in.
            </div>
          )}

          {/* Tabs */}
          <div className="auth-tabs">
            <div
              className={`auth-tab${tab === "login" ? " active" : ""}`}
              onClick={() => setTab("login")}
            >
              Login
            </div>
            <div
              className={`auth-tab${tab === "signup" ? " active" : ""}`}
              onClick={() => setTab("signup")}
            >
              Sign Up
            </div>
          </div>

          {/* ── LOGIN ─────────────────────────────────────────── */}
          <div className={`auth-form${tab === "login" ? " active" : ""}`}>
            {loginSuccess ? (
              <div className="success-box">
                <div className="success-icon">✅</div>
                <div className="success-title">Signed in!</div>
                <div className="success-msg">
                  Welcome back! Redirecting you to the homepage…
                </div>
              </div>
            ) : (
              <>
                <div className="auth-heading">Welcome back</div>
                <div className="auth-sub">
                  Sign in to your AutoDrive account
                </div>

                <form onSubmit={handleLogin} noValidate>
                  <div className="field">
                    <label>Email Address</label>
                    <input
                      type="email"
                      className={loginEmailErr ? "err" : ""}
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@email.com"
                      autoComplete="email"
                    />
                    {loginEmailErr && (
                      <div className="field-err">{loginEmailErr}</div>
                    )}
                  </div>

                  <div className="field">
                    <label>Password</label>
                    <div className="pw-wrap">
                      <input
                        type={showLoginPw ? "text" : "password"}
                        className={loginPwErr ? "err" : ""}
                        value={loginPw}
                        onChange={(e) => setLoginPw(e.target.value)}
                        placeholder="Your password"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="pw-toggle"
                        onClick={() => setShowLoginPw((v) => !v)}
                      >
                        {showLoginPw ? "🙈" : "👁"}
                      </button>
                    </div>
                    {loginPwErr && (
                      <div className="field-err">{loginPwErr}</div>
                    )}
                  </div>

                  <div className="forgot">
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (isValidEmail(loginEmail))
                          alert(
                            `Password reset link sent to ${loginEmail}! (Demo)`,
                          );
                        else alert("Please enter your email address first.");
                      }}
                    >
                      Forgot password?
                    </a>
                  </div>

                  <button
                    type="submit"
                    className="auth-submit"
                    disabled={loginLoading}
                  >
                    {loginLoading ? "Signing in…" : "Sign In →"}
                  </button>
                </form>

                <div className="divider">or continue with</div>
                <div className="social-row">
                  <button
                    className="social-btn"
                    onClick={() =>
                      alert("Google login — integrate OAuth here.")
                    }
                  >
                    🔵 Google
                  </button>
                  <button
                    className="social-btn"
                    onClick={() =>
                      alert("Facebook login — integrate OAuth here.")
                    }
                  >
                    🔷 Facebook
                  </button>
                </div>

                <div className="auth-switch">
                  Don&rsquo;t have an account?{" "}
                  <a onClick={() => setTab("signup")}>Sign Up</a>
                </div>
              </>
            )}
          </div>

          {/* ── SIGNUP ────────────────────────────────────────── */}
          <div className={`auth-form${tab === "signup" ? " active" : ""}`}>
            {signupSuccess ? (
              <div className="success-box">
                <div className="success-icon">🎉</div>
                <div className="success-title">Account created!</div>
                <div className="success-msg">
                  Welcome to AutoDrive! Redirecting you to browse cars…
                </div>
              </div>
            ) : (
              <>
                <div className="auth-heading">Create account</div>
                <div className="auth-sub">
                  Join 15,000+ happy AutoDrive customers
                </div>

                <form onSubmit={handleSignup} noValidate>
                  <div className="field-row">
                    <div className="field">
                      <label>First Name</label>
                      <input
                        type="text"
                        className={suFnameErr ? "err" : ""}
                        value={suFname}
                        onChange={(e) => setSuFname(e.target.value)}
                        placeholder="Ahmad"
                      />
                      {suFnameErr && (
                        <div className="field-err">{suFnameErr}</div>
                      )}
                    </div>
                    <div className="field">
                      <label>Last Name</label>
                      <input
                        type="text"
                        className={suLnameErr ? "err" : ""}
                        value={suLname}
                        onChange={(e) => setSuLname(e.target.value)}
                        placeholder="Hassan"
                      />
                      {suLnameErr && (
                        <div className="field-err">{suLnameErr}</div>
                      )}
                    </div>
                  </div>

                  <div className="field">
                    <label>Email Address</label>
                    <input
                      type="email"
                      className={suEmailErr ? "err" : ""}
                      value={suEmail}
                      onChange={(e) => setSuEmail(e.target.value)}
                      placeholder="you@email.com"
                    />
                    {suEmailErr && (
                      <div className="field-err">{suEmailErr}</div>
                    )}
                  </div>

                  <div className="field">
                    <label>
                      Phone Number{" "}
                      <span
                        style={{
                          color: "#4a5568",
                          fontWeight: 400,
                          textTransform: "none",
                        }}
                      >
                        (optional)
                      </span>
                    </label>
                    <input
                      type="tel"
                      value={suPhone}
                      onChange={(e) => setSuPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div className="field">
                    <label>Password</label>
                    <div className="pw-wrap">
                      <input
                        type={showSuPw ? "text" : "password"}
                        className={suPwErr ? "err" : ""}
                        value={suPw}
                        onChange={(e) => setSuPw(e.target.value)}
                        placeholder="Min. 8 characters"
                      />
                      <button
                        type="button"
                        className="pw-toggle"
                        onClick={() => setShowSuPw((v) => !v)}
                      >
                        {showSuPw ? "🙈" : "👁"}
                      </button>
                    </div>
                    {suPwErr && <div className="field-err">{suPwErr}</div>}
                  </div>

                  <div className="field">
                    <label>Confirm Password</label>
                    <div className="pw-wrap">
                      <input
                        type={showSuConfirm ? "text" : "password"}
                        className={suConfirmErr ? "err" : ""}
                        value={suConfirm}
                        onChange={(e) => setSuConfirm(e.target.value)}
                        placeholder="Repeat your password"
                      />
                      <button
                        type="button"
                        className="pw-toggle"
                        onClick={() => setShowSuConfirm((v) => !v)}
                      >
                        {showSuConfirm ? "🙈" : "👁"}
                      </button>
                    </div>
                    {suConfirmErr && (
                      <div className="field-err">{suConfirmErr}</div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="auth-submit"
                    disabled={signupLoading}
                  >
                    {signupLoading ? "Creating account…" : "Create Account →"}
                  </button>
                </form>

                <div className="auth-terms">
                  By signing up you agree to our{" "}
                  <a href="#">Terms of Service</a> and{" "}
                  <a href="#">Privacy Policy</a>.
                </div>

                <div className="auth-switch">
                  Already have an account?{" "}
                  <a onClick={() => setTab("login")}>Sign In</a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
