import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ActivityForm from './ActivityForm';
import './Auth.css';

// 🔥 FIXED BASE URL
const API_BASE_URL = `${process.env.REACT_APP_API_URL}`;

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [activityData, setActivityData] = useState({
    commute: { vehicleType: 'car', distance: '' },
    electricity: { energy: '' },
    food: { foodType: 'vegetables', quantity: '' }
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState([]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleActivityChange = (type, name, value) => {
    setActivityData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [name]: value
      }
    }));
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    
    if (isLogin) {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(u => u.email === formData.email && u.password === formData.password);
      
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        const saved = localStorage.getItem(`carbonActivities_${user.id}`);
        if (saved) {
          navigate('/dashboard');
        } else {
          setShowActivityForm(true);
        }
      } else {
        setError('Invalid email or password');
      }
    } else {
      if (!formData.name || !formData.email || !formData.password) {
        setError('All fields are required');
        return;
      }
      
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      if (users.find(u => u.email === formData.email)) {
        setError('Email already exists');
        return;
      }
      
      const newUser = {
        id: Date.now(),
        name: formData.name,
        email: formData.email,
        password: formData.password
      };
      
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      setCurrentUser(newUser);
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      setShowActivityForm(true);
    }
  };

  const handleSubmitAllActivities = async () => {
    setLoading(true);
    const newActivities = [];

    try {
      if (activityData.commute.distance) {
        const response = await axios.post(`${API_BASE_URL}/calculate/commute`, {
          distance: parseFloat(activityData.commute.distance),
          vehicleType: activityData.commute.vehicleType,
          unit: 'km'
        });
        if (response.data.success) {
          newActivities.push({
            id: Date.now(),
            type: 'commute',
            date: new Date().toISOString().split('T')[0],
            ...response.data,
            ...activityData.commute
          });
        }
      }

      if (activityData.electricity.energy) {
        const response = await axios.post(`${API_BASE_URL}/calculate/electricity`, {
          energy: parseFloat(activityData.electricity.energy),
          unit: 'kWh'
        });
        if (response.data.success) {
          newActivities.push({
            id: Date.now() + 1,
            type: 'electricity',
            date: new Date().toISOString().split('T')[0],
            ...response.data,
            ...activityData.electricity
          });
        }
      }

      if (activityData.food.quantity) {
        const response = await axios.post(`${API_BASE_URL}/calculate/food`, {
          foodType: activityData.food.foodType,
          quantity: parseFloat(activityData.food.quantity),
          unit: 'kg'
        });
        if (response.data.success) {
          newActivities.push({
            id: Date.now() + 2,
            type: 'food',
            date: new Date().toISOString().split('T')[0],
            ...response.data,
            ...activityData.food
          });
        }
      }

      if (newActivities.length > 0 && currentUser) {
        localStorage.setItem(`carbonActivities_${currentUser.id}`, JSON.stringify(newActivities));
      }
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Error calculating emissions:', error);
      alert('Error calculating emissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToDashboard = () => {
    navigate('/dashboard');
  };

  if (showActivityForm) {
    return (
      <div className="auth-page activity-input-page">
        <div className="auth-container activity-form-container">
          <div className="auth-card activity-card">
            <div className="auth-header">
              <h1>Welcome, {currentUser?.name}! 👋</h1>
              <p>Let's track your carbon footprint.</p>
            </div>

            <div className="activity-forms-section">
              <ActivityForm type="commute" formData={activityData.commute} onChange={handleActivityChange} />
              <ActivityForm type="electricity" formData={activityData.electricity} onChange={handleActivityChange} />
              <ActivityForm type="food" formData={activityData.food} onChange={handleActivityChange} />
            </div>

            <div className="form-actions">
              <button className="skip-btn" onClick={handleContinueToDashboard}>Skip for now</button>
              <button 
                className="submit-all-btn"
                onClick={handleSubmitAllActivities}
                disabled={loading || (!activityData.commute.distance && !activityData.electricity.energy && !activityData.food.quantity)}
              >
                {loading ? 'Calculating...' : 'Calculate & Continue →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>CarbonVision</h1>
            <p>{isLogin ? 'Welcome back!' : 'Join the movement'}</p>
          </div>

          <div className="auth-tabs">
            <button 
              className={isLogin ? 'active' : ''}
              onClick={() => {
                setIsLogin(true);
                setError('');
                setFormData({ name: '', email: '', password: '' });
              }}
            >
              Login
            </button>

            <button 
              className={!isLogin ? 'active' : ''}
              onClick={() => {
                setIsLogin(false);
                setError('');
                setFormData({ name: '', email: '', password: '' });
              }}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="auth-form">
            {!isLogin && (
              <div className="form-group">
                <label>Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter your name" required />
              </div>
            )}

            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter your email" required />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Enter your password" required />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="auth-submit-btn">
              {isLogin ? 'Login' : 'Sign Up'}
            </button>
          </form>

          <button className="back-to-home" onClick={() => navigate('/')}>
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
