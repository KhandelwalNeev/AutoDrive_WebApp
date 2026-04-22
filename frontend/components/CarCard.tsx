'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Car, formatINR } from '@/lib/carData';

const BADGE_CLASS: Record<string, string> = { new: 'badge-new', hot: 'badge-hot', sale: 'badge-sale', certified: 'badge-certified' };
const BADGE_LABEL: Record<string, string> = { new: 'NEW', hot: '🔥 HOT', sale: 'SALE', certified: '✓ CERTIFIED' };

interface Props {
  car: Car;
  onDetails?: (car: Car) => void;
}

export default function CarCard({ car, onDetails }: Props) {
  const [wishlisted, setWishlisted] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <div className="car-card" data-id={car.id}>
      <div className="car-card-image">
        {!imgError ? (
          <img
            src={car.image}
            alt={`${car.year} ${car.make} ${car.model}`}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <span style={{ fontSize: '4.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', position: 'relative', zIndex: 1 }}>{car.emoji}</span>
        )}
        <div className="img-overlay" />
        <div className="car-badge-overlay">
          {car.badges.map(b => (
            <span key={b} className={`car-badge ${BADGE_CLASS[b]}`}>{BADGE_LABEL[b]}</span>
          ))}
        </div>
        <button
          className={`wishlist-btn${wishlisted ? ' active' : ''}`}
          onClick={e => { e.stopPropagation(); setWishlisted(w => !w); }}
        >
          {wishlisted ? '♥' : '♡'}
        </button>
      </div>
      <div className="car-card-body">
        <div className="car-category-label">{car.category}</div>
        <div className="car-make-model">{car.make} {car.model}</div>
        <div className="car-specs-row">
          <div className="car-spec-pill"><span>{car.fuel === 'Electric' ? '⚡' : '⛽'}</span>{car.fuel}</div>
          <div className="car-spec-pill"><span>⚙️</span>{car.transmission}</div>
          <div className="car-spec-pill"><span>📍</span>{(car.mileage / 1000).toFixed(0)}k km</div>
        </div>
        <div className="car-card-footer">
          <div className="car-price">{formatINR(car.price)}</div>
          <div className="car-actions">
            {onDetails ? (
              <button className="btn btn-outline btn-sm" onClick={() => onDetails(car)}>Details</button>
            ) : (
              <Link href="/cars" className="btn btn-outline btn-sm">Details</Link>
            )}
            <Link href="/booking" className="btn btn-primary btn-sm">Book Now</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
