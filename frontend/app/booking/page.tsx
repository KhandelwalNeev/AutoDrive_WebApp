'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { carInventory, formatINR } from '@/lib/carData';

type Tab = 'testdrive' | 'reserve';
type TdStep = 1 | 2 | 3 | 4;

const TIME_SLOTS = ['9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM'];
const UNAVAILABLE = new Set(['9:00 AM','12:00 PM','5:00 PM']);

interface ConfirmData { icon: string; title: string; message: string; details: string; }

export default function BookingPage() {
  const [tab, setTab] = useState<Tab>('testdrive');

  // Test drive state
  const [tdStep, setTdStep] = useState<TdStep>(1);
  const [tdCarId, setTdCarId] = useState<number | null>(null);
  const [tdDate, setTdDate] = useState('');
  const [tdLocation, setTdLocation] = useState('showroom');
  const [tdTime, setTdTime] = useState('');
  const [tdFname, setTdFname] = useState('');
  const [tdLname, setTdLname] = useState('');
  const [tdPhone, setTdPhone] = useState('');
  const [tdEmail, setTdEmail] = useState('');
  const [tdLicense, setTdLicense] = useState('');
  const [tdNotes, setTdNotes] = useState('');

  // Reserve state
  const [rCarId, setRCarId] = useState('');
  const [rFname, setRFname] = useState('');
  const [rLname, setRLname] = useState('');
  const [rEmail, setREmail] = useState('');
  const [rPhone, setRPhone] = useState('');
  const [rDate, setRDate] = useState('');
  const [rDelivery, setRDelivery] = useState<'pickup' | 'delivery'>('pickup');
  const [rAddress, setRAddress] = useState('');
  const [rPayment, setRPayment] = useState('card');
  const [rNotes, setRNotes] = useState('');
  const [rTerms, setRTerms] = useState(false);

  // Confirm modal
  const [confirm, setConfirm] = useState<ConfirmData | null>(null);

  const [toast, setToast] = useState<{ icon: string; text: string } | null>(null);
  const showToast = (icon: string, text: string) => {
    setToast({ icon, text });
    setTimeout(() => setToast(null), 3000);
  };

  const today = typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : '';

  const tdCar = carInventory.find(c => c.id === tdCarId);
  const rCar = carInventory.find(c => c.id === parseInt(rCarId));

  const locLabel = { showroom: 'Our Showroom', home: 'My Location (Home Delivery)', office: 'My Office' }[tdLocation];

  function tdNext(step: TdStep) {
    if (step === 2 && !tdCarId) { showToast('⚠️', 'Please select a car first'); return; }
    if (step === 3) {
      if (!tdDate) { showToast('⚠️', 'Please select a date'); return; }
      if (!tdTime) { showToast('⚠️', 'Please select a time slot'); return; }
    }
    if (step === 4) {
      if (!tdFname || !tdPhone || !tdEmail) { showToast('⚠️', 'Please fill in all required fields'); return; }
    }
    setTdStep(step);
  }

  function submitTestDrive(e: React.FormEvent) {
    e.preventDefault();
    if (!tdCar) return;
    setConfirm({
      icon: '🎉', title: 'Test Drive Booked!',
      message: `Your test drive for the ${tdCar.year} ${tdCar.make} ${tdCar.model} has been confirmed. We'll send a reminder to your email.`,
      details: `📅 Date: ${tdDate}\n⏰ Time: ${tdTime}\n📍 Location: ${locLabel}\n🚗 Car: ${tdCar.year} ${tdCar.make} ${tdCar.model}\n🆓 Cost: Free — no obligation to buy`,
    });
  }

  function submitReservation(e: React.FormEvent) {
    e.preventDefault();
    if (!rCar) return;
    setConfirm({
      icon: '✅', title: 'Car Reserved!',
      message: `Your reservation for the ${rCar.year} ${rCar.make} ${rCar.model} has been confirmed. A ₹5,000 deposit hold has been placed.`,
      details: `🚗 Car: ${rCar.year} ${rCar.make} ${rCar.model}\n💰 Car Price: ${formatINR(rCar.price)}\n📅 Collection: ${rDate || 'TBD'}\n🚚 Delivery: ${rDelivery === 'pickup' ? 'Showroom Pickup' : 'Home Delivery'}\n💳 Deposit: ₹5,000 (refundable)`,
    });
  }

  const topCars = carInventory.slice(0, 6);

  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const faqs = [
    { q: 'Is the test drive really free?', a: 'Yes, test drives are completely free with no obligation to purchase. You can drive the car for up to 30 minutes at our showroom or request a home visit.' },
    { q: 'Can I cancel my reservation?', a: 'Absolutely. Your ₹5,000 deposit is fully refundable if you cancel within 72 hours. We\'ll process the refund to your original payment method within 3-5 business days.' },
    { q: 'What documents do I need for a test drive?', a: 'Just a valid driving license and a photo ID. No insurance documents needed — all test drive vehicles are fully covered by our fleet insurance.' },
    { q: 'How long will my reserved car be held?', a: 'We hold your reserved car exclusively for 72 hours from the time of booking. After 72 hours, if no contact is made, the deposit is fully refunded and the car returns to inventory.' },
  ];

  return (
    <>
      {/* PAGE HERO */}
      <div className="page-hero">
        <div className="container">
          <div className="section-badge" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,.7)', borderColor: 'rgba(255,255,255,.1)', marginBottom: '1rem' }}>📅 Online Booking</div>
          <h1 className="page-hero-title">Book a Drive</h1>
          <p className="page-hero-sub">Schedule a test drive or reserve your car in minutes. No commitment required.</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          {/* TABS */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem' }}>
            <div className="booking-tabs">
              <button className={`booking-tab${tab === 'testdrive' ? ' active' : ''}`} onClick={() => setTab('testdrive')}>🚦 Test Drive</button>
              <button className={`booking-tab${tab === 'reserve' ? ' active' : ''}`} onClick={() => setTab('reserve')}>🔑 Reserve a Car</button>
            </div>
          </div>

          {/* TEST DRIVE PANEL */}
          {tab === 'testdrive' && (
            <div className="booking-panel active">
              <div className="booking-layout">
                <div className="booking-form-card">
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '.4rem' }}>Book a Test Drive</h2>
                  <p style={{ fontSize: '.92rem', color: 'var(--text-light)', marginBottom: '2rem' }}>Experience the car before you buy. Free test drives at our showroom or your location.</p>

                  <div className="step-indicator">
                    {[1,2,3,4].map(s => (
                      <div key={s} className={`step${s < tdStep ? ' done' : s === tdStep ? ' active' : ''}`}>
                        <div className="step-circle">{s}</div>
                        <div className="step-label">{['Choose Car','Schedule','Your Info','Confirm'][s-1]}</div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={submitTestDrive}>
                    {/* Step 1 */}
                    {tdStep === 1 && (
                      <div>
                        <div className="info-box">ℹ️ Select the car you&#39;d like to test drive from our available inventory.</div>
                        <div className="car-selector-grid">
                          {topCars.map(c => (
                            <div key={c.id} className={`car-select-card${tdCarId === c.id ? ' selected' : ''}`} onClick={() => setTdCarId(c.id)}>
                              <div style={{ width: '100%', height: '80px', borderRadius: '8px', overflow: 'hidden', marginBottom: '.5rem', background: c.gradient }}>
                                <img src={c.image} alt={`${c.make} ${c.model}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                              <div className="car-select-name">{c.year} {c.make} {c.model.split(' ')[0]}</div>
                              <div className="car-select-price">{formatINR(c.price)}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                          <button type="button" className="btn btn-primary" onClick={() => tdNext(2)}>Next: Schedule →</button>
                        </div>
                      </div>
                    )}

                    {/* Step 2 */}
                    {tdStep === 2 && (
                      <div>
                        <div className="form-grid">
                          <div className="form-group">
                            <label className="form-label">Preferred Date *</label>
                            <input type="date" className="form-input" value={tdDate} min={today} onChange={e => setTdDate(e.target.value)} required />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Location</label>
                            <select className="form-select" value={tdLocation} onChange={e => setTdLocation(e.target.value)}>
                              <option value="showroom">Our Showroom</option>
                              <option value="home">My Location (Home Delivery)</option>
                              <option value="office">My Office</option>
                            </select>
                          </div>
                          <div className="form-group full">
                            <label className="form-label">Select Time Slot *</label>
                            <div className="time-slots">
                              {TIME_SLOTS.map(slot => (
                                <div key={slot} className={`time-slot${UNAVAILABLE.has(slot) ? ' unavailable' : ''}${tdTime === slot ? ' selected' : ''}`}
                                  onClick={() => { if (!UNAVAILABLE.has(slot)) setTdTime(slot); }}>
                                  {slot}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', marginTop: '1rem' }}>
                          <button type="button" className="btn btn-outline" onClick={() => setTdStep(1)}>← Back</button>
                          <button type="button" className="btn btn-primary" onClick={() => tdNext(3)}>Next: Your Info →</button>
                        </div>
                      </div>
                    )}

                    {/* Step 3 */}
                    {tdStep === 3 && (
                      <div>
                        <div className="form-grid">
                          <div className="form-group">
                            <label className="form-label">First Name *</label>
                            <input type="text" className="form-input" value={tdFname} onChange={e => setTdFname(e.target.value)} placeholder="Ahmad" required />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Last Name *</label>
                            <input type="text" className="form-input" value={tdLname} onChange={e => setTdLname(e.target.value)} placeholder="Hassan" required />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Phone *</label>
                            <input type="tel" className="form-input" value={tdPhone} onChange={e => setTdPhone(e.target.value)} placeholder="+91 98765 43210" required />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Email *</label>
                            <input type="email" className="form-input" value={tdEmail} onChange={e => setTdEmail(e.target.value)} placeholder="you@email.com" required />
                          </div>
                          <div className="form-group full">
                            <label className="form-label">Driving License Number</label>
                            <input type="text" className="form-input" value={tdLicense} onChange={e => setTdLicense(e.target.value)} placeholder="DL-XXXX-XXXX" />
                          </div>
                          <div className="form-group full">
                            <label className="form-label">Special Requests</label>
                            <textarea className="form-textarea" value={tdNotes} onChange={e => setTdNotes(e.target.value)} placeholder="Any special requests or questions..." style={{ minHeight: '80px' }} />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', marginTop: '1rem' }}>
                          <button type="button" className="btn btn-outline" onClick={() => setTdStep(2)}>← Back</button>
                          <button type="button" className="btn btn-primary" onClick={() => tdNext(4)}>Review Booking →</button>
                        </div>
                      </div>
                    )}

                    {/* Step 4 */}
                    {tdStep === 4 && (
                      <div>
                        <div style={{ background: 'var(--bg-soft)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1.5rem' }}>
                          <h4 style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--text-medium)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '1.25rem' }}>Booking Summary</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', fontSize: '.9rem', lineHeight: 2, color: 'var(--text-medium)' }}>
                            <div><strong>Car:</strong> {tdCar?.year} {tdCar?.make} {tdCar?.model}</div>
                            <div><strong>Date:</strong> {tdDate}</div>
                            <div><strong>Time:</strong> {tdTime}</div>
                            <div><strong>Location:</strong> {locLabel}</div>
                            <div><strong>Name:</strong> {tdFname} {tdLname}</div>
                            <div><strong>Phone:</strong> {tdPhone}</div>
                            <div><strong>Email:</strong> {tdEmail}</div>
                          </div>
                        </div>
                        <div className="info-box">✅ Your test drive is free of charge and requires no commitment to purchase.</div>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', marginTop: '1rem' }}>
                          <button type="button" className="btn btn-outline" onClick={() => setTdStep(3)}>← Back</button>
                          <button type="submit" className="btn btn-primary btn-lg">🚗 Confirm Test Drive</button>
                        </div>
                      </div>
                    )}
                  </form>
                </div>

                {/* Summary card */}
                <div className="booking-summary-card">
                  <h3>📋 Booking Details</h3>
                  <div className="summary-item"><span className="summary-item-label">Car</span><span className="summary-item-value">{tdCar ? `${tdCar.year} ${tdCar.make} ${tdCar.model}` : '—'}</span></div>
                  <div className="summary-item"><span className="summary-item-label">Date</span><span className="summary-item-value">{tdDate || '—'}</span></div>
                  <div className="summary-item"><span className="summary-item-label">Time</span><span className="summary-item-value">{tdTime || '—'}</span></div>
                  <div className="summary-item"><span className="summary-item-label">Location</span><span className="summary-item-value">{locLabel}</span></div>
                  <div className="divider" />
                  <div className="summary-item"><span className="summary-item-label">Cost</span><span className="summary-item-value" style={{ color: 'var(--green)' }}>FREE</span></div>
                  <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '.5rem' }}>📍 Our Showroom</div>
                    <div style={{ fontSize: '.85rem', color: 'var(--text-medium)' }}>123 Auto Plaza, Downtown<br />Open: Mon–Sat 9AM–7PM</div>
                  </div>
                  <div style={{ marginTop: '1rem', fontSize: '.8rem', color: 'var(--text-light)', lineHeight: 1.6 }}>
                    ✅ Free cancellation up to 2 hours before your appointment<br />
                    ✅ Confirmation sent to your email
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RESERVE PANEL */}
          {tab === 'reserve' && (
            <div className="booking-panel active">
              <div className="booking-layout">
                <div className="booking-form-card">
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '.4rem' }}>Reserve a Car</h2>
                  <p style={{ fontSize: '.92rem', color: 'var(--text-light)', marginBottom: '2rem' }}>Secure your chosen car with a fully refundable deposit. We&#39;ll hold it for 72 hours.</p>
                  <div className="info-box" style={{ marginBottom: '2rem' }}>💡 A refundable deposit of <strong>₹5,000</strong> holds your car for 72 hours.</div>

                  <form onSubmit={submitReservation}>
                    <div className="form-grid">
                      <div className="form-group full">
                        <label className="form-label">Select Car to Reserve *</label>
                        <select className="form-select" value={rCarId} onChange={e => setRCarId(e.target.value)} required>
                          <option value="">Select a car...</option>
                          {carInventory.map(c => <option key={c.id} value={c.id}>{c.year} {c.make} {c.model} — {formatINR(c.price)}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">First Name *</label>
                        <input type="text" className="form-input" value={rFname} onChange={e => setRFname(e.target.value)} placeholder="Ahmad" required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Last Name *</label>
                        <input type="text" className="form-input" value={rLname} onChange={e => setRLname(e.target.value)} placeholder="Hassan" required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Email *</label>
                        <input type="email" className="form-input" value={rEmail} onChange={e => setREmail(e.target.value)} placeholder="you@email.com" required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Phone *</label>
                        <input type="tel" className="form-input" value={rPhone} onChange={e => setRPhone(e.target.value)} placeholder="+91 98765 43210" required />
                      </div>
                      <div className="form-group full">
                        <label className="form-label">Preferred Collection Date</label>
                        <input type="date" className="form-input" value={rDate} min={today} onChange={e => setRDate(e.target.value)} />
                      </div>
                      <div className="form-group full">
                        <label className="form-label">Delivery Option</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          {[{val:'pickup' as const, icon:'🏪', label:'Showroom Pickup', price:'Free'}, {val:'delivery' as const, icon:'🚚', label:'Home Delivery', price:'₹999 fee'}].map(d => (
                            <div key={d.val} className={`car-select-card${rDelivery === d.val ? ' selected' : ''}`} onClick={() => setRDelivery(d.val)} style={rDelivery === d.val ? { borderColor: 'var(--blue)', background: 'rgba(37,99,235,0.04)' } : {}}>
                              <div className="car-select-icon">{d.icon}</div>
                              <div className="car-select-name">{d.label}</div>
                              <div className="car-select-price">{d.price}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {rDelivery === 'delivery' && (
                        <div className="form-group full">
                          <label className="form-label">Delivery Address</label>
                          <input type="text" className="form-input" value={rAddress} onChange={e => setRAddress(e.target.value)} placeholder="Enter your full address" />
                        </div>
                      )}
                      <div className="form-group full">
                        <label className="form-label">Payment Method for Deposit</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.75rem' }}>
                          {[{val:'card', icon:'💳', label:'Credit/Debit'},{val:'paypal', icon:'🅿️', label:'PayPal'},{val:'bank', icon:'🏦', label:'Bank Transfer'}].map(p => (
                            <div key={p.val} onClick={() => setRPayment(p.val)} style={{ border: `2px solid ${rPayment === p.val ? 'var(--blue)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', padding: '.8rem', textAlign: 'center', background: rPayment === p.val ? 'rgba(37,99,235,0.04)' : 'transparent', cursor: 'pointer' }}>
                              <div style={{ fontSize: '1.4rem' }}>{p.icon}</div>
                              <div style={{ fontSize: '.78rem', fontWeight: 600, marginTop: '.25rem' }}>{p.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="form-group full">
                        <label className="form-label">Additional Notes</label>
                        <textarea className="form-textarea" value={rNotes} onChange={e => setRNotes(e.target.value)} placeholder="Any special requirements or questions..." style={{ minHeight: '80px' }} />
                      </div>
                      <div className="form-group full">
                        <label className="checkbox-item" style={{ cursor: 'pointer' }}>
                          <input type="checkbox" checked={rTerms} onChange={e => setRTerms(e.target.checked)} required style={{ accentColor: 'var(--blue)' }} />
                          <span style={{ fontSize: '.88rem' }}>I agree to the <a href="#" style={{ color: 'var(--blue)' }}>Terms & Conditions</a> and understand the deposit is fully refundable.</span>
                        </label>
                      </div>
                    </div>
                    <button type="submit" className="btn btn-gold btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', borderRadius: 'var(--radius-sm)' }}>
                      🔑 Reserve This Car (₹5,000 Deposit)
                    </button>
                  </form>
                </div>

                <div className="booking-summary-card">
                  <h3>💰 Reservation Summary</h3>
                  <div className="summary-item"><span className="summary-item-label">Car</span><span className="summary-item-value">{rCar ? `${rCar.year} ${rCar.make} ${rCar.model}` : '—'}</span></div>
                  <div className="summary-item"><span className="summary-item-label">Car Price</span><span className="summary-item-value">{rCar ? formatINR(rCar.price) : '—'}</span></div>
                  <div className="summary-item"><span className="summary-item-label">Collection Date</span><span className="summary-item-value">{rDate || '—'}</span></div>
                  <div className="summary-item"><span className="summary-item-label">Delivery</span><span className="summary-item-value">{rDelivery === 'pickup' ? 'Showroom Pickup' : 'Home Delivery'}</span></div>
                  <div className="divider" />
                  <div className="summary-item"><span className="summary-item-label">Deposit (refundable)</span><span className="summary-item-value" style={{ color: 'var(--blue)' }}>₹5,000</span></div>
                  <div className="summary-item"><span className="summary-item-label">Balance Due</span><span className="summary-item-value">{rCar ? formatINR(rCar.price - 5000) : '—'}</span></div>
                  <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--green)', marginBottom: '.4rem' }}>🛡️ Fully Protected</div>
                    <div style={{ fontSize: '.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>Your deposit is 100% refundable within 72 hours. No questions asked.</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="section" style={{ background: 'var(--bg-soft)' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-badge">❓ FAQ</div>
            <h2 className="section-title">Common Questions</h2>
          </div>
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: '1rem', overflow: 'hidden' }}>
                <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} style={{ width: '100%', padding: '1.25rem', textAlign: 'left', fontSize: '.95rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)', cursor: 'pointer', color: 'var(--text-white)' }}>
                  {faq.q} <span>{faqOpen === i ? '−' : '+'}</span>
                </button>
                {faqOpen === i && (
                  <div style={{ padding: '0 1.25rem 1.25rem', fontSize: '.9rem', color: 'var(--text-muted)', lineHeight: 1.7, background: 'var(--bg-elevated)' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONFIRMATION MODAL */}
      {confirm && (
        <div className="modal-overlay open" onClick={e => { if ((e.target as HTMLElement).classList.contains('modal-overlay')) setConfirm(null); }}>
          <div className="modal" style={{ maxWidth: '480px' }}>
            <div className="modal-body" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1.25rem' }}>{confirm.icon}</div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '.75rem' }}>{confirm.title}</h2>
              <p style={{ fontSize: '.95rem', color: 'var(--text-light)', lineHeight: 1.7, marginBottom: '2rem' }}>{confirm.message}</p>
              <div style={{ background: 'var(--bg-soft)', borderRadius: 'var(--radius)', padding: '1.25rem', textAlign: 'left', marginBottom: '2rem', fontSize: '.88rem', lineHeight: 2, color: 'var(--text-medium)', whiteSpace: 'pre-line' }}>
                {confirm.details}
              </div>
              <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center' }}>
                <Link href="/cars" className="btn btn-outline">Browse More Cars</Link>
                <button onClick={() => setConfirm(null)} className="btn btn-primary">Done</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="toast show">
          <span className="toast-icon">{toast.icon}</span>
          <span className="toast-text">{toast.text}</span>
        </div>
      )}

      <footer>
        <div className="container">
          <div className="footer-bottom" style={{ justifyContent: 'center' }}>
            <div>© 2025 AutoDrive. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </>
  );
}
