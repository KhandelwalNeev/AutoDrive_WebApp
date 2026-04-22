'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { carInventory, formatINR } from '@/lib/carData';
import CarCard from '@/components/CarCard';

function useCounter(target: number, ref: React.RefObject<Element>) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      let c = 0;
      const step = Math.ceil(target / 60);
      const timer = setInterval(() => {
        c = Math.min(c + step, target);
        setCount(c);
        if (c >= target) clearInterval(timer);
      }, 30);
      observer.disconnect();
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, ref]);
  return count;
}

function Counter({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const count = useCounter(target, ref as React.RefObject<Element>);
  const display = count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count);
  return <span ref={ref}>{display}</span>;
}

export default function Home() {
  const featured = [...carInventory].sort((a, b) => b.rating - a.rating).slice(0, 6);

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-grid-bg" />
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <div className="hero-badge">⭐ #1 Trusted Used Car Platform</div>
              <h1 className="hero-title">
                Find Your Perfect<br />
                <span className="highlight">Dream Car</span><br />
                At Best Price
              </h1>
              <p className="hero-subtitle">
                Explore 2,500+ certified pre-owned vehicles. Get instant price predictions
                for your old car, book a test drive, and drive home today.
              </p>
              <div className="hero-actions">
                <Link href="/cars" className="btn btn-primary btn-lg">Browse Cars →</Link>
                <Link href="/predict" className="btn btn-white btn-lg">Predict My Car Price</Link>
              </div>
              <div className="hero-stats">
                <div className="hero-stat">
                  <div className="hero-stat-number">2,500<span style={{ color: 'var(--gold-light)' }}>+</span></div>
                  <div className="hero-stat-label">Cars Available</div>
                </div>
                <div className="hero-stat">
                  <div className="hero-stat-number">15K<span style={{ color: 'var(--gold-light)' }}>+</span></div>
                  <div className="hero-stat-label">Happy Customers</div>
                </div>
                <div className="hero-stat">
                  <div className="hero-stat-number">98<span style={{ color: 'var(--gold-light)' }}>%</span></div>
                  <div className="hero-stat-label">Satisfaction Rate</div>
                </div>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-car-card">
                <div className="hero-floating-badge">✓ Certified</div>
                <div className="hero-car-visual" style={{ background: 'linear-gradient(135deg,#1e3a5f,#0a192f)' }}>
                  <img
                    src="https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=600&h=340&q=85"
                    alt="Featured Car"
                  />
                </div>
                <div className="hero-car-info">
                  <div className="hero-car-name">Toyota Camry XSE</div>
                  <div className="hero-car-year">2022 · Petrol · Automatic</div>
                  <div className="hero-car-price">₹28.50 L</div>
                  <div className="hero-car-tags">
                    <span className="hero-car-tag">28,000 km</span>
                    <span className="hero-car-tag">Silver</span>
                    <span className="hero-car-tag">Sunroof</span>
                    <span className="hero-car-tag">Backup Cam</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEARCH */}
      <section className="search-section">
        <div className="container">
          <div className="search-wrapper">
            <form className="search-bar" onSubmit={e => { e.preventDefault(); window.location.href = '/cars'; }}>
              <div className="search-field">
                <label data-icon="📍">Make</label>
                <select id="s-make">
                  <option value="">Any Make</option>
                  {['Toyota','Honda','BMW','Mercedes','Audi','Ford','Hyundai','Kia'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="search-field">
                <label data-icon="🚗">Model</label>
                <select id="s-model">
                  <option value="">Any Model</option>
                  {['Camry','Corolla','Civic','Accord','3 Series','C-Class','Elantra','Sportage'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="search-field">
                <label data-icon="💰">Max Budget</label>
                <input type="number" id="s-price" placeholder="e.g. 30,00,000" />
              </div>
              <div className="search-field">
                <label data-icon="📅">Year</label>
                <select id="s-year">
                  <option value="">Any Year</option>
                  {['2023','2022','2021','2020','2019','2018'].map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
              <div className="search-btn-wrap">
                <button type="submit">🔍 Search Cars</button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* BRANDS */}
      <section className="brands-strip">
        <div className="container">
          <div className="brands-title">Trusted Brands Available</div>
          <div className="brands-row">
            {[['🔵','Honda'],['⚫','BMW'],['⭐','Mercedes'],['🔷','Toyota'],['🔶','Audi'],['🟦','Hyundai'],['🟥','Ford']].map(([icon, name]) => (
              <div className="brand-item" key={name}><span className="brand-icon">{icon}</span> {name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats-strip">
        <div className="container">
          <div className="stats-grid">
            {[{target:2500,label:'Cars in Stock'},{target:15000,label:'Happy Customers'},{target:50,label:'Expert Dealers'},{target:12,label:'Years Experience',noPlus:true}].map(s => (
              <div className="stat-item" key={s.label}>
                <div className="stat-number" data-target={s.target}>
                  <Counter target={s.target} />
                  {!s.noPlus && <span className="stat-plus">+</span>}
                </div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED CARS */}
      <section className="section" style={{ background: 'var(--bg-soft)' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-badge">🚗 Featured Cars</div>
            <h2 className="section-title">Handpicked for You</h2>
            <p className="section-subtitle">Each vehicle is thoroughly inspected and certified by our expert team.</p>
          </div>
          <div className="cars-grid">
            {featured.map(car => <CarCard key={car.id} car={car} />)}
          </div>
          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link href="/cars" className="btn btn-outline btn-lg">View All 2,500+ Cars →</Link>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="section" id="about">
        <div className="container">
          <div className="section-header">
            <div className="section-badge">✨ Why AutoDrive</div>
            <h2 className="section-title">Everything You Need in One Place</h2>
            <p className="section-subtitle">From browsing to buying, we&#39;ve made every step simple, safe, and transparent.</p>
          </div>
          <div className="features-grid">
            {[
              { icon:'🔍', title:'AI Price Predictor', desc:'Get an instant, accurate estimate for your current car\'s market value using our intelligent pricing algorithm.', link:'/predict', linkText:'Try it now →' },
              { icon:'🚦', title:'Book a Test Drive', desc:'Schedule a test drive online in minutes. Choose your date, time, and location — we\'ll handle the rest.', link:'/booking', linkText:'Book now →', gold:true },
              { icon:'✅', title:'Certified & Inspected', desc:'Every car goes through a 150-point inspection. Full service history, no hidden surprises.', link:'/cars', linkText:'Browse certified →', green:true },
              { icon:'💳', title:'Easy Financing', desc:'Flexible payment plans and financing options. Get pre-approved in minutes without affecting your credit score.', link:'#', linkText:'Calculate EMI →' },
              { icon:'🛡️', title:'Vehicle Warranty', desc:'All certified cars come with a 12-month warranty and 30-day return guarantee for peace of mind.', link:'#', linkText:'Learn more →', gold:true },
              { icon:'📱', title:'Reserve Online', desc:'Secure your desired car with a small refundable deposit. Fully online, no paperwork required.', link:'/booking', linkText:'Reserve now →', green:true },
            ].map(f => (
              <div className="feature-card" key={f.title}>
                <div className={`feature-icon${f.gold ? ' gold' : f.green ? ' green' : ''}`}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                <Link href={f.link} className="feature-link">{f.linkText}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section" style={{ background: 'var(--primary)' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-badge" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.1)' }}>🗺️ How It Works</div>
            <h2 className="section-title" style={{ color: 'white' }}>Drive Home in 4 Easy Steps</h2>
            <p className="section-subtitle" style={{ color: 'rgba(255,255,255,0.55)' }}>The fastest, most transparent car buying experience — entirely online.</p>
          </div>
          <div className="grid-4" style={{ marginTop: '3rem' }}>
            {[
              { icon:'🔍', step:'Step 01', title:'Browse & Choose', desc:'Filter by make, model, year, and budget to find your perfect match.', bg:'rgba(37,99,235,0.2)', border:'rgba(37,99,235,0.4)' },
              { icon:'📅', step:'Step 02', title:'Book Test Drive', desc:'Schedule a test drive at our showroom or your location — your choice.', bg:'rgba(245,158,11,0.15)', border:'rgba(245,158,11,0.3)' },
              { icon:'💰', step:'Step 03', title:'Get Financed', desc:'Choose your payment plan, trade in your old car, and finalize the deal.', bg:'rgba(16,185,129,0.15)', border:'rgba(16,185,129,0.3)' },
              { icon:'🔑', step:'Step 04', title:'Drive Home', desc:'We\'ll deliver your car or you can pick it up. Enjoy your new ride!', bg:'rgba(99,102,241,0.15)', border:'rgba(99,102,241,0.3)' },
            ].map(s => (
              <div key={s.step} style={{ textAlign: 'center', color: 'white' }}>
                <div style={{ width: '72px', height: '72px', background: s.bg, border: `2px solid ${s.border}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', margin: '0 auto 1.25rem' }}>{s.icon}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold-light)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '.5rem' }}>{s.step}</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '.6rem' }}>{s.title}</h3>
                <p style={{ fontSize: '.88rem', color: 'rgba(255,255,255,.5)', lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div className="section-badge">💬 Testimonials</div>
            <h2 className="section-title">What Our Customers Say</h2>
          </div>
          <div className="testimonials-grid">
            {[
              { stars:'★★★★★', text:'"The price predictor was spot-on! Got ₹2,00,000 more than I expected for my old Honda. The entire process was smooth and transparent."', name:'Ahmad Hassan', role:'Bought a Toyota Camry', avatarBg:'#dbeafe', avatarColor:'#1d4ed8', avatar:'👨' },
              { stars:'★★★★★', text:'"Booked a test drive in 2 minutes. The car was exactly as described — no hidden issues. Drove it home the same day. Highly recommended!"', name:'Sarah Al-Rashid', role:'Bought a BMW 3 Series', avatarBg:'#dcfce7', avatarColor:'#15803d', avatar:'👩' },
              { stars:'★★★★☆', text:'"Best car buying experience ever. The financing was easy and the team was super helpful. Got a great deal on a certified Hyundai Elantra."', name:'Omar Khalid', role:'Bought a Hyundai Elantra', avatarBg:'#fef3c7', avatarColor:'#b45309', avatar:'🧑' },
            ].map(t => (
              <div className="testimonial-card" key={t.name}>
                <div className="testimonial-stars">{t.stars}</div>
                <p className="testimonial-text">{t.text}</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar" style={{ background: t.avatarBg, color: t.avatarColor }}>{t.avatar}</div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Find Your Next Car?</h2>
          <p>Join 15,000+ happy customers who found their dream car on AutoDrive.</p>
          <div className="cta-actions">
            <Link href="/cars" className="btn btn-gold btn-lg">Browse Cars Now</Link>
            <Link href="/predict" className="btn btn-white btn-lg">Predict My Car Value</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <Link href="/" className="nav-logo" style={{ marginBottom: '.5rem' }}>
                <div className="nav-logo-icon">🚗</div>
                <span className="nav-logo-text">Auto<span>Drive</span></span>
              </Link>
              <p>Your trusted marketplace for premium certified pre-owned vehicles. Transparent, fast, and hassle-free.</p>
              <div className="footer-social">
                <a href="#" className="social-btn">f</a>
                <a href="#" className="social-btn">in</a>
                <a href="#" className="social-btn">tw</a>
                <a href="#" className="social-btn">yt</a>
              </div>
            </div>
            <div className="footer-col">
              <h4>Browse</h4>
              <div className="footer-links">
                {['All Cars','Certified Cars','SUVs & Trucks','Sedans','Electric Cars'].map(l => <Link key={l} href="/cars" className="footer-link">{l}</Link>)}
              </div>
            </div>
            <div className="footer-col">
              <h4>Services</h4>
              <div className="footer-links">
                <Link href="/predict" className="footer-link">Price Predictor</Link>
                <Link href="/booking" className="footer-link">Test Drive</Link>
                <Link href="/booking" className="footer-link">Car Reservation</Link>
                <a href="#" className="footer-link">EMI Calculator</a>
                <a href="#" className="footer-link">Car Inspection</a>
              </div>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <div className="footer-links">
                <a href="#about" className="footer-link">About Us</a>
                <a href="#" className="footer-link">Careers</a>
                <a href="#" className="footer-link">Contact</a>
                <a href="#" className="footer-link">Privacy Policy</a>
                <a href="#" className="footer-link">Terms of Service</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <div>© 2025 AutoDrive. All rights reserved.</div>
            <div>📍 123 Auto Plaza, Downtown · 📞 +1 (800) AUTO-DRV · ✉️ hello@autodrive.com</div>
          </div>
        </div>
      </footer>
    </>
  );
}
