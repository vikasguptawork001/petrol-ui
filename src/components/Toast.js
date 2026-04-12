import React, { useEffect } from 'react';
import './Toast.css';

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`toast toast-${type} toast-show`} role="status">
      <div className="toast-content">
        <span className="toast-icon" aria-hidden>
          {type === 'success' && 'OK'}
          {type === 'error' && '!'}
          {type === 'warning' && '!'}
          {type === 'info' && 'i'}
        </span>
        <span className="toast-message">{message}</span>
        <button
          className="toast-close"
          type="button"
          onClick={() => onClose && onClose()}
          aria-label="Close"
        >
          x
        </button>
      </div>
    </div>
  );
};

export default Toast;
