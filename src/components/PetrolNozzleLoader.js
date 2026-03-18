import React from 'react';
import './PetrolNozzleLoader.css';

/**
 * Petrol pump loader: nozzle dispensing fuel into tank.
 * Use for all loading / launching / processing states in petrol pump inventory app.
 */
const PetrolNozzleLoader = ({ size = 'large', className = '' }) => {
  const isSmall = size === 'small';
  const sizeClass = isSmall ? 'pp-loader--small' : 'pp-loader--large';

  return (
    <div className={`petrol-nozzle-loader ${sizeClass} ${className}`} role="status" aria-label="Loading">
      <svg
        className="petrol-nozzle-loader__svg"
        viewBox="0 0 120 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Tank body */}
        <rect
          className="petrol-nozzle-loader__tank"
          x="20"
          y="28"
          width="44"
          height="56"
          rx="4"
          ry="4"
        />
        {/* Tank fill level (animated rise from bottom) */}
        <rect
          className="petrol-nozzle-loader__tank-fill"
          x="22"
          y="50"
          width="40"
          height="32"
          rx="3"
          ry="0"
        />
        {/* Tank highlight */}
        <rect
          className="petrol-nozzle-loader__tank-highlight"
          x="24"
          y="30"
          width="6"
          height="52"
          rx="2"
        />
        {/* Nozzle hose */}
        <path
          className="petrol-nozzle-loader__hose"
          d="M 68 48 Q 82 42 92 52 L 92 58 Q 82 68 68 62 Z"
        />
        {/* Nozzle handle / gun */}
        <rect
          className="petrol-nozzle-loader__gun"
          x="88"
          y="48"
          width="22"
          height="16"
          rx="3"
        />
        <rect
          className="petrol-nozzle-loader__gun-tip"
          x="106"
          y="52"
          width="8"
          height="8"
          rx="1"
        />
        {/* Fuel stream from nozzle to tank */}
        <path
          className="petrol-nozzle-loader__stream petrol-nozzle-loader__stream--1"
          d="M 70 54 Q 78 58 64 72"
        />
        <path
          className="petrol-nozzle-loader__stream petrol-nozzle-loader__stream--2"
          d="M 72 52 Q 80 56 66 70"
        />
        <path
          className="petrol-nozzle-loader__stream petrol-nozzle-loader__stream--3"
          d="M 74 56 Q 82 60 68 74"
        />
        {/* Drops */}
        <ellipse className="petrol-nozzle-loader__drop petrol-nozzle-loader__drop--1" cx="72" cy="58" rx="3" ry="4" />
        <ellipse className="petrol-nozzle-loader__drop petrol-nozzle-loader__drop--2" cx="76" cy="64" rx="3" ry="4" />
        <ellipse className="petrol-nozzle-loader__drop petrol-nozzle-loader__drop--3" cx="70" cy="68" rx="3" ry="4" />
      </svg>
    </div>
  );
};

export default PetrolNozzleLoader;
