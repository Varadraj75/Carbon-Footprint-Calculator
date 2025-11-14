import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ActivityForm from './ActivityForm';
import DashboardCharts from './DashboardCharts';
import './Dashboard.css';

// 🔥 FIXED BASE URL
const API_BASE_URL = `${process.env.REACT_APP_API_URL}/api`;

const Dashboard = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [activities, setActivities] = useState([]);
  const [totalEmissions, setTotalEmissions] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activityData, setActivityData] = useState({
    commute: { vehicleType: 'car', distance: '' },
    electricity: { energy: '' },
    food: { foodType: 'vegetables', quantity: '' }
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!user) {
      navigate('/auth');
      return;
    }
    setCurrentUser(user);
    loadActivities();
  }, [navigate]);

  const loadActivities = () => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (user) {
      const saved = localStorage.getItem(`carbonActivities_${user.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const normalized = parsed.map(activity => ({
            ...activity,
            co2e: parseFloat(activity.co2e) || 0
          }));
          setActivities(normalized);
          calculateTotal(normalized);
        } catch (error) {
          console.error('Error loading activities:', error);
        }
      }
    }
  };

  const calculateTotal = (activitiesList) => {
    const total = activitiesList.reduce((sum, activity) => {
      return sum + (parseFloat(activity.co2e) || 0);
    }, 0);
    setTotalEmissions(total);
  };

  const handleActivityChange = (type, name, value) => {
    setActivityData(prev => ({
      ...prev,
      [type]: { ...prev[type], [name]: value }
    }));
  };

  const calculateEmissions = async (type, data) => {
    try {
      const endpoints = {
        commute: { url: '/calculate/commute', body: { distance: parseFloat(data.distance), vehicleType: data.vehicleType, unit: 'km' } },
        electricity: { url: '/calculate/electricity', body: { energy: parseFloat(data.energy), unit: 'kWh' } },
        food: { url: '/calculate/food', body: { foodType: data.foodType, quantity: parseFloat(data.quantity), unit: 'kg' } }
      };

      const response = await axios.post(`${API_BASE_URL}${endpoints[type].url}`, endpoints[type].body);

      if (response.data.success) {
        return {
          id: Date.now() + Math.random(),
          type,
          date: new Date().toISOString().split('T')[0],
          co2e: parseFloat(response.data.co2e) || 0,
          co2e_unit: response.data.co2e_unit || 'kg',
          ...response.data,
          ...data
        };
      }
    } catch (error) {
      console.error(`Error calculating ${type} emissions:`, error);

      // fallback local calc
      const fallbackFactors = {
        commute: { car: 0.21, bus: 0.089, train: 0.041, plane: 0.255, motorcycle: 0.113 },
        electricity: 0.5,
        food: { beef: 27, chicken: 6.9, pork: 12.1, fish: 3.0, dairy: 3.2, vegetables: 2.0, fruits: 1.1 }
      };

      let co2e = 0;
      if (type === 'commute') {
        co2e = parseFloat(data.distance) * (fallbackFactors.commute[data.vehicleType] || 0.21);
      } else if (type === 'electricity') {
        co2e = parseFloat(data.energy) * fallbackFactors.electricity;
      } else if (type === 'food') {
        co2e = parseFloat(data.quantity) * (fallbackFactors.food[data.foodType] || 2.0);
      }

      return {
        id: Date.now() + Math.random(),
        type,
        date: new Date().toISOString().split('T')[0],
        co2e,
        co2e_unit: 'kg',
        ...data
      };
    }

    return null;
  };

  const handleSubmitAllActivities = async () => {
    setLoading(true);

    try {
      const newActivities = [];

      if (activityData.commute.distance) {
        const result = await calculateEmissions('commute', activityData.commute);
        if (result) newActivities.push(result);
      }

      if (activityData.electricity.energy) {
        const result = await calculateEmissions('electricity', activityData.electricity);
        if (result) newActivities.push(result);
      }

      if (activityData.food.quantity) {
        const result = await calculateEmissions('food', activityData.food);
        if (result) newActivities.push(result);
      }

      if (newActivities.length > 0 && currentUser) {
        const updatedActivities = [...activities, ...newActivities];
        setActivities(updatedActivities);
        calculateTotal(updatedActivities);
        localStorage.setItem(`carbonActivities_${currentUser.id}`, JSON.stringify(updatedActivities));

        setActivityData({
          commute: { vehicleType: 'car', distance: '' },
          electricity: { energy: '' },
          food: { foodType: 'vegetables', quantity: '' }
        });

        setActiveTab('dashboard');
      }
    } catch (error) {
      console.error('Error calculating emissions:', error);
      alert('Error calculating emissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Are you sure you want to reset all data?')) {
      if (currentUser) {
        setActivities([]);
        setTotalEmissions(0);
        localStorage.removeItem(`carbonActivities_${currentUser.id}`);
      }
    }
  };

  const getDailyEmissions = () => {
    const daily = {};
    activities.forEach(activity => {
      const co2e = parseFloat(activity.co2e) || 0;
      if (co2e > 0) {
        daily[activity.date] = (daily[activity.date] || 0) + co2e;
      }
    });
    return daily;
  };

  const getWeeklyEmissions = () => {
    const weekly = {};
    activities.forEach(activity => {
      const co2e = parseFloat(activity.co2e) || 0;
      if (co2e > 0) {
        const date = new Date(activity.date + 'T00:00:00');
        if (!isNaN(date.getTime())) {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          const weekKey = weekStart.toISOString().split('T')[0];
          weekly[weekKey] = (weekly[weekKey] || 0) + co2e;
        }
      }
    });
    return weekly;
  };

  const getEmissionsByType = () => {
    const byType = {};
    activities.forEach(activity => {
      const co2e = parseFloat(activity.co2e) || 0;
      if (co2e > 0) {
        byType[activity.type] = (byType[activity.type] || 0) + co2e;
      }
    });
    return byType;
  };

  if (!currentUser) return null;

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>CarbonVision Dashboard</h1>
            <p>Welcome back, {currentUser.name}!</p>
          </div>
          <button className="logout-btn" onClick={() => { localStorage.removeItem('currentUser'); navigate('/'); }}>
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-container">
        <div className="total-emissions-card">
          <div className="emission-value">
            <span className="emission-number">{totalEmissions.toFixed(2)}</span>
            <span className="emission-unit">kg CO₂e</span>
          </div>
          <p className="emission-description">
            {totalEmissions === 0 ? 'No activities recorded yet. Add activities to see your carbon footprint.' :
             totalEmissions < 10 ? 'Great job! You\'re keeping your footprint low.' :
             totalEmissions < 50 ? 'Consider reducing your daily emissions.' :
             'Your footprint is high. Focus on reducing emissions.'}
          </p>
        </div>

        <div className="dashboard-tabs">
          <button className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>📊 Dashboard</button>
          <button className={`tab ${activeTab === 'add' ? 'active' : ''}`} onClick={() => setActiveTab('add')}>➕ Add Activity</button>
        </div>

        <div className="dashboard-content">
          {activeTab === 'dashboard' && (
            <DashboardCharts
              dailyEmissions={getDailyEmissions()}
              weeklyEmissions={getWeeklyEmissions()}
              emissionsByType={getEmissionsByType()}
              activities={activities}
            />
          )}

          {activeTab === 'add' && (
            <div className="add-activity-section">
              <h2 className="section-title">Add New Activities</h2>
              <div className="activity-forms-section">
                <ActivityForm type="commute" formData={activityData.commute} onChange={handleActivityChange} />
                <ActivityForm type="electricity" formData={activityData.electricity} onChange={handleActivityChange} />
                <ActivityForm type="food" formData={activityData.food} onChange={handleActivityChange} />
              </div>
              <div className="form-actions">
                <button className="submit-all-btn" onClick={handleSubmitAllActivities} disabled={loading || (!activityData.commute.distance && !activityData.electricity.energy && !activityData.food.quantity)}>
                  {loading ? 'Calculating...' : 'Calculate & Add to Dashboard →'}
                </button>
              </div>
            </div>
          )}
        </div>

        {activeTab === 'dashboard' && activities.length > 0 && (
          <div className="reset-section">
            <button className="reset-btn" onClick={handleResetData}>🗑️ Reset All Data</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
