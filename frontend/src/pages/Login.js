import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LiquidEther from '../components/LiquidEther';
import { LayoutTextFlip } from '../components/ui/LayoutTextFlip';
import '../styles/Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Animated Liquid Background */}
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        zIndex: 0,
        opacity: 0.5,
        pointerEvents: 'none'
      }}>
        <LiquidEther
          colors={['#5227FF', '#FF9FFC', '#B19EEF']}
          mouseForce={30}
          cursorSize={150}
          resolution={0.5}
          autoDemo={true}
          autoSpeed={0.2}
          autoIntensity={3.0}
        />
      </div>

      <div className="auth-card" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <LayoutTextFlip
            text="Welcome to"
            words={["Student Portal", "Task Manager", "Learning Hub", "Success"]}
            duration={2500}
          />
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Student? <Link to="/register">Register here</Link></p>
          <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
            Teachers use your MITE email and password
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;