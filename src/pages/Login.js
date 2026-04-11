import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PetrolNozzleLoader from '../components/PetrolNozzleLoader';
import './Login.css';

const Login = () => {
  const [user_id, setUser_id] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(user_id, password);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  // Show branded loading screen while checking auth
  if (authLoading) {
    return (
      <div className="loader-container">
        <PetrolNozzleLoader size="large" />
        <div className="loader-text" style={{ marginTop: '8px' }}>Please wait…</div>
        <div className="fuel-gauge" style={{ width: '200px' }}>
          <span className="fuel-gauge-e">E</span>
          <div className="fuel-gauge-track">
            <div className="fuel-gauge-fill" style={{ width: '75%', animationDelay: '0s' }} />
          </div>
          <span className="fuel-gauge-f">F</span>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-box">
        {/* Dispenser icon + company name */}
        <h2>⛽ Steepray business app</h2>
        <p className="brand-tagline">Sign in with your staff login</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-userid">Login name</label>
            <input
              id="login-userid"
              type="text"
              value={user_id}
              onChange={(e) => setUser_id(e.target.value)}
              required
              placeholder="Your login ID"
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign in'}
          </button>

          {/* Fuel gauge sweeps E→F while authenticating */}
          {loading && (
            <div className="login-gauge-wrap">
              <div className="fuel-gauge" style={{ width: '100%' }}>
                <span className="fuel-gauge-e">E</span>
                <div className="fuel-gauge-track">
                  <div className="fuel-gauge-fill" style={{ width: '60%' }} />
                </div>
                <span className="fuel-gauge-f">F</span>
              </div>
              <span className="login-gauge-label">authenticating...</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
