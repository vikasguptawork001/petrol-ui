import React, { useState, useEffect, useRef } from 'react';
import './TransactionLoader.css';

const TransactionLoader = ({ isLoading, message, type = 'transaction' }) => {
  const [litres, setLitres] = useState(0.0);
  const [amount, setAmount] = useState(0);
  const [progress, setProgress] = useState(0);
  const litresRef = useRef(0);
  const amountRef = useRef(0);
  const progressRef = useRef(0);
  const animRef = useRef(null);
  const startTimeRef = useRef(null);

  /** Lock scroll + show wait cursor while any CRUD/async overlay is active */
  useEffect(() => {
    if (!isLoading) return undefined;
    const root = document.documentElement;
    const body = document.body;
    root.classList.add('tl-active');
    body.classList.add('tl-active');
    return () => {
      root.classList.remove('tl-active');
      body.classList.remove('tl-active');
    };
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading) {
      litresRef.current = 0;
      amountRef.current = 0;
      progressRef.current = 0;
      setLitres(0);
      setAmount(0);
      setProgress(0);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    startTimeRef.current = null;
    const RATE_PER_SEC_L = 12.4;  // litres/sec
    const RATE_PER_SEC_R = 1100;  // rupees/sec
    const MAX_L = 62;
    const MAX_R = 5580;

    const animate = (ts) => {
      if (!startTimeRef.current) startTimeRef.current = ts;
      const elapsed = (ts - startTimeRef.current) / 1000;

      const newL = Math.min(RATE_PER_SEC_L * elapsed, MAX_L);
      const newR = Math.min(RATE_PER_SEC_R * elapsed, MAX_R);
      const newP = Math.min((newL / MAX_L) * 88, 88); // cap at 88% so it never completes

      litresRef.current = newL;
      amountRef.current = newR;
      progressRef.current = newP;

      setLitres(newL);
      setAmount(Math.round(newR));
      setProgress(newP);

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isLoading]);

  if (!isLoading) return null;

  const getLabel = () => {
    if (message) return message;
    switch (type) {
      case 'sell': case 'sale':   return 'saving sale...';
      case 'return':              return 'saving return...';
      case 'purchase':            return 'saving purchase...';
      case 'payment':             return 'processing payment...';
      case 'report':              return 'loading report...';
      default:                    return 'processing...';
    }
  };

  const fmtL = litres.toFixed(1).padStart(6, '\u2007');
  const fmtR = amount.toLocaleString('en-IN').padStart(7, '\u2007');

  return (
    <div className="tl-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="tl-card" aria-label="Loading">

        {/* ── Dispenser body ── */}
        <div className="tl-dispenser">

          {/* LCD screen */}
          <div className="tl-lcd">
            <div className="tl-lcd-row tl-lcd-litres">
              <span className="tl-lcd-val">{fmtL}</span>
              <span className="tl-lcd-unit">L</span>
            </div>
            <div className="tl-lcd-row tl-lcd-amount">
              <span className="tl-lcd-sym">₹</span>
              <span className="tl-lcd-val">{fmtR}</span>
            </div>
          </div>

          {/* Button row */}
          <div className="tl-btn-row">
            <div className="tl-fuel-btn tl-petrol">PETROL</div>
            <div className="tl-fuel-btn tl-diesel">DIESEL</div>
          </div>

          {/* Hose that curves out from the right */}
          <svg className="tl-hose-svg" viewBox="0 0 110 90" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Hose pipe */}
            <path
              d="M 18 20 Q 80 20 80 55 Q 80 80 55 80"
              stroke="#f59a30"
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
            />
            {/* Nozzle tip */}
            <rect x="42" y="74" width="22" height="12" rx="4" fill="#f59a30" />
            <rect x="60" y="76" width="10" height="8" rx="2" fill="#d97f10" />
            {/* Drip dot animation */}
            <circle className="tl-drip" cx="66" cy="90" r="3" fill="#f59a30" />
          </svg>

          {/* Status text */}
          <div className="tl-status">{getLabel()}</div>
        </div>

        {/* ── Fuel hose progress bar ── */}
        <div className="tl-hose-bar-wrap">
          <div className="tl-hose-connector tl-hose-left" />
          <div className="tl-hose-track">
            <div className="tl-hose-fill" style={{ width: `${progress}%` }} />
            {/* Rolling ball at tip */}
            <div className="tl-hose-ball" style={{ left: `calc(${progress}% - 8px)` }} />
          </div>
          <div className="tl-hose-connector tl-hose-right" />
        </div>

      </div>
    </div>
  );
};

export default TransactionLoader;
