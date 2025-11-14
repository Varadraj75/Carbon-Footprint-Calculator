import React, { useState } from 'react';
import './ActivityForm.css';

const ActivityForm = ({ type, showTitle = true, formData, onChange }) => {
  const getTitle = () => {
    if (type === 'commute') return '🚗 Commute Emissions';
    if (type === 'electricity') return '⚡ Electricity Consumption';
    if (type === 'food') return '🍽️ Food Consumption';
    return 'Activity';
  };

  const handleChange = (e) => {
    onChange(type, e.target.name, e.target.value);
  };

  return (
    <div className="activity-form-container">
      {showTitle && <h3 className="form-title">{getTitle()}</h3>}
      <div className="activity-form">
        {type === 'commute' && (
          <>
            <div className="form-group">
              <label htmlFor={`vehicleType-${type}`}>Vehicle Type</label>
              <select
                id={`vehicleType-${type}`}
                name="vehicleType"
                value={formData.vehicleType || 'car'}
                onChange={handleChange}
                className="form-input"
              >
                <option value="car">Car</option>
                <option value="bus">Bus</option>
                <option value="train">Train</option>
                <option value="plane">Plane</option>
                <option value="motorcycle">Motorcycle</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor={`distance-${type}`}>Distance (km)</label>
              <input
                type="number"
                id={`distance-${type}`}
                name="distance"
                value={formData.distance || ''}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter distance in kilometers"
                step="0.1"
                min="0"
              />
            </div>
          </>
        )}

        {type === 'electricity' && (
          <div className="form-group">
            <label htmlFor={`energy-${type}`}>Energy Consumption (kWh)</label>
            <input
              type="number"
              id={`energy-${type}`}
              name="energy"
              value={formData.energy || ''}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter energy consumption in kWh"
              step="0.1"
              min="0"
            />
          </div>
        )}

        {type === 'food' && (
          <>
            <div className="form-group">
              <label htmlFor={`foodType-${type}`}>Food Type</label>
              <select
                id={`foodType-${type}`}
                name="foodType"
                value={formData.foodType || 'vegetables'}
                onChange={handleChange}
                className="form-input"
              >
                <option value="beef">Beef</option>
                <option value="chicken">Chicken</option>
                <option value="pork">Pork</option>
                <option value="fish">Fish</option>
                <option value="dairy">Dairy</option>
                <option value="vegetables">Vegetables</option>
                <option value="fruits">Fruits</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor={`quantity-${type}`}>Quantity (kg)</label>
              <input
                type="number"
                id={`quantity-${type}`}
                name="quantity"
                value={formData.quantity || ''}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter quantity in kilograms"
                step="0.1"
                min="0"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ActivityForm;
