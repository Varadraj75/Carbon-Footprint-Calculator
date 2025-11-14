const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Climatiq API configuration
const CLIMATIQ_API_KEY = process.env.CLIMATIQ_API_KEY || '';
const CLIMATIQ_BASE_URL = 'https://beta3.api.climatiq.io';

// Gold Standard API configuration
const GOLD_STANDARD_BASE_URL = 'https://api.goldstandard.org';

// Helper function to search for emission factors
async function searchEmissionFactor(query) {
  try {
    const response = await axios.get(
      `${CLIMATIQ_BASE_URL}/search`,
      {
        params: {
          query: query,
          category: 'transport',
          results_per_page: 1
        },
        headers: {
          'Authorization': `Bearer ${CLIMATIQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data && response.data.results && response.data.results.length > 0) {
      return response.data.results[0].id;
    }
    return null;
  } catch (error) {
    console.error('Climatiq Search Error:', error.response?.data || error.message);
    return null;
  }
}

// Helper function to calculate emissions using Climatiq API
async function calculateEmissions(activityData) {
  try {
    const { activity_id, parameters } = activityData;
    
    const response = await axios.post(
      `${CLIMATIQ_BASE_URL}/estimate`,
      {
        emission_factor: {
          id: activity_id
        },
        parameters: parameters
      },
      {
        headers: {
          'Authorization': `Bearer ${CLIMATIQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Climatiq API Error:', error.response?.data || error.message);
    // Return fallback calculation if API fails
    return calculateFallback(activityData);
  }
}

// Fallback calculation if API is unavailable
function calculateFallback(activityData) {
  const { activity_id, parameters } = activityData;
  
  // Basic emission factors (kg CO2e per unit)
  const fallbackFactors = {
    'car': 0.21, // kg CO2e per km
    'bus': 0.089, // kg CO2e per km
    'train': 0.041, // kg CO2e per km
    'plane': 0.255, // kg CO2e per km
    'motorcycle': 0.113, // kg CO2e per km
    'electricity': 0.5, // kg CO2e per kWh (average grid)
    'beef': 27, // kg CO2e per kg
    'chicken': 6.9, // kg CO2e per kg
    'pork': 12.1, // kg CO2e per kg
    'fish': 3.0, // kg CO2e per kg
    'dairy': 3.2, // kg CO2e per kg
    'vegetables': 2.0, // kg CO2e per kg
    'fruits': 1.1 // kg CO2e per kg
  };
  
  let co2e = 0;
  
  if (parameters.distance) {
    const vehicleType = activity_id.includes('car') ? 'car' :
                       activity_id.includes('bus') ? 'bus' :
                       activity_id.includes('train') ? 'train' :
                       activity_id.includes('aircraft') ? 'plane' :
                       activity_id.includes('motorcycle') ? 'motorcycle' : 'car';
    co2e = parameters.distance * (fallbackFactors[vehicleType] || 0.21);
  } else if (parameters.energy) {
    co2e = parameters.energy * fallbackFactors['electricity'];
  } else if (parameters.weight) {
    const foodType = activity_id.includes('beef') ? 'beef' :
                    activity_id.includes('chicken') ? 'chicken' :
                    activity_id.includes('pork') ? 'pork' :
                    activity_id.includes('fish') ? 'fish' :
                    activity_id.includes('dairy') ? 'dairy' :
                    activity_id.includes('vegetables') ? 'vegetables' :
                    activity_id.includes('fruits') ? 'fruits' : 'vegetables';
    co2e = parameters.weight * (fallbackFactors[foodType] || 2.0);
  }
  
  return {
    co2e: co2e,
    co2e_unit: 'kg'
  };
}

// Calculate commute emissions
app.post('/api/calculate/commute', async (req, res) => {
  try {
    const { distance, vehicleType, unit = 'km' } = req.body;
    
    // Map vehicle types to Climatiq activity IDs
    const vehicleMap = {
      'car': 'passenger_vehicle-vehicle_type_car-fuel_source_na-distance_na-engine_size_na',
      'bus': 'passenger_vehicle-vehicle_type_bus-fuel_source_na-distance_na',
      'train': 'passenger_vehicle-vehicle_type_train-fuel_source_na',
      'plane': 'passenger_vehicle-vehicle_type_aircraft-fuel_source_na',
      'motorcycle': 'passenger_vehicle-vehicle_type_motorcycle-fuel_source_na'
    };
    
    const activityId = vehicleMap[vehicleType] || vehicleMap['car'];
    
    const emissionData = await calculateEmissions({
      activity_id: activityId,
      parameters: {
        distance: distance,
        distance_unit: unit
      }
    });
    
    res.json({
      success: true,
      co2e: emissionData.co2e,
      co2e_unit: emissionData.co2e_unit,
      activity: 'commute',
      vehicleType,
      distance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

// Calculate electricity emissions
app.post('/api/calculate/electricity', async (req, res) => {
  try {
    const { energy, unit = 'kWh', country = 'US' } = req.body;
    
    // Use electricity grid emission factor
    const activityId = `electricity-energy_source_grid_mix-supplier_na-facility_na`;
    
    const emissionData = await calculateEmissions({
      activity_id: activityId,
      parameters: {
        energy: energy,
        energy_unit: unit
      }
    });
    
    res.json({
      success: true,
      co2e: emissionData.co2e,
      co2e_unit: emissionData.co2e_unit,
      activity: 'electricity',
      energy,
      unit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

// Calculate food emissions
app.post('/api/calculate/food', async (req, res) => {
  try {
    const { foodType, quantity, unit = 'kg' } = req.body;
    
    // Map food types to Climatiq activity IDs
    const foodMap = {
      'beef': 'food-beef',
      'chicken': 'food-chicken',
      'pork': 'food-pork',
      'fish': 'food-fish',
      'dairy': 'food-dairy',
      'vegetables': 'food-vegetables',
      'fruits': 'food-fruits'
    };
    
    const activityId = foodMap[foodType] || 'food-vegetables';
    
    const emissionData = await calculateEmissions({
      activity_id: activityId,
      parameters: {
        weight: quantity,
        weight_unit: unit
      }
    });
    
    res.json({
      success: true,
      co2e: emissionData.co2e,
      co2e_unit: emissionData.co2e_unit,
      activity: 'food',
      foodType,
      quantity
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

// Get offset suggestions from Gold Standard API
app.get('/api/offsets', async (req, res) => {
  try {
    // Gold Standard API endpoint for projects
    const response = await axios.get(
      `${GOLD_STANDARD_BASE_URL}/projects`,
      {
        params: {
          limit: 10,
          status: 'active'
        }
      }
    );
    
    res.json({
      success: true,
      projects: response.data || []
    });
  } catch (error) {
    console.error('Gold Standard API Error:', error.response?.data || error.message);
    // Return mock data if API fails
    res.json({
      success: true,
      projects: [
        {
          id: 1,
          name: 'Renewable Energy Project',
          description: 'Support clean energy initiatives',
          co2e_per_dollar: 0.5,
          location: 'Global'
        },
        {
          id: 2,
          name: 'Reforestation Program',
          description: 'Plant trees to offset carbon',
          co2e_per_dollar: 0.3,
          location: 'Global'
        },
        {
          id: 3,
          name: 'Clean Water Access',
          description: 'Reduce emissions through clean water',
          co2e_per_dollar: 0.4,
          location: 'Global'
        }
      ]
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Carbon Calculator API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Make sure to set CLIMATIQ_API_KEY in .env file`);
});

