// =========================
// 🌍 Carbon API Backend
// =========================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
// Allow any origin for now (Vercel frontend -> Render backend). Tighten later to your domain if needed.
app.use(cors({ origin: '*' }));
app.use(express.json());

// =========================
// 🌐 API CONFIG
// =========================

// Climatiq configuration (make sure CLIMATIQ_API_KEY is set in Render env vars)
const CLIMATIQ_API_KEY = process.env.CLIMATIQ_API_KEY || '';
const CLIMATIQ_BASE_URL = 'https://api.climatiq.io';

// Gold Standard (used only for offset suggestions; may require auth in real world)
const GOLD_STANDARD_BASE_URL = 'https://api.goldstandard.org';

// =========================
// 🔍 Helper: Search Emission Factor (optional utility)
// =========================
async function searchEmissionFactor(query) {
  try {
    const response = await axios.get(`${CLIMATIQ_BASE_URL}/search`, {
      params: {
        query,
        results_per_page: 1
      },
      headers: {
        Authorization: `Bearer ${CLIMATIQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data?.results?.length > 0) {
      return response.data.results[0].id;
    }
    return null;
  } catch (error) {
    console.error('Climatiq Search Error:', error.response?.data || error.message);
    return null;
  }
}

// =========================
// 🔥 Helper: Calculate Emissions
// =========================
async function calculateEmissions(activityData) {
  try {
    const { activity_id, parameters } = activityData;

    const response = await axios.post(
      `${CLIMATIQ_BASE_URL}/estimate`,
      {
        emission_factor: { id: activity_id },
        parameters
      },
      {
        headers: {
          Authorization: `Bearer ${CLIMATIQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10s timeout
      }
    );

    return response.data;
  } catch (error) {
    console.error('Climatiq API Error:', error.response?.data || error.message);
    // fallback calculation if Climatiq fails
    return calculateFallback(activityData);
  }
}

// =========================
// 🧮 Fallback Calculation (Offline)
// =========================
function calculateFallback(activityData) {
  const { activity_id, parameters } = activityData;

  const fallback = {
    car: 0.21,
    bus: 0.089,
    train: 0.041,
    plane: 0.255,
    motorcycle: 0.113,
    electricity: 0.5,
    beef: 27,
    chicken: 6.9,
    pork: 12.1,
    fish: 3.0,
    dairy: 3.2,
    vegetables: 2.0,
    fruits: 1.1
  };

  let co2e = 0;

  if (parameters && parameters.distance) {
    const type =
      (activity_id && activity_id.includes && activity_id.includes('car')) ? 'car' :
      (activity_id && activity_id.includes && activity_id.includes('bus')) ? 'bus' :
      (activity_id && activity_id.includes && activity_id.includes('train')) ? 'train' :
      (activity_id && activity_id.includes && activity_id.includes('aircraft')) ? 'plane' :
      (activity_id && activity_id.includes && activity_id.includes('motorcycle')) ? 'motorcycle' : 'car';

    co2e = parameters.distance * (fallback[type] || 0.21);
  } else if (parameters && parameters.energy) {
    co2e = parameters.energy * fallback.electricity;
  } else if (parameters && parameters.weight) {
    const type =
      (activity_id && activity_id.includes && activity_id.includes('beef')) ? 'beef' :
      (activity_id && activity_id.includes && activity_id.includes('chicken')) ? 'chicken' :
      (activity_id && activity_id.includes && activity_id.includes('pork')) ? 'pork' :
      (activity_id && activity_id.includes && activity_id.includes('fish')) ? 'fish' :
      (activity_id && activity_id.includes && activity_id.includes('dairy')) ? 'dairy' :
      (activity_id && activity_id.includes && activity_id.includes('vegetables')) ? 'vegetables' :
      (activity_id && activity_id.includes && activity_id.includes('fruit')) ? 'fruits' : 'vegetables';

    co2e = parameters.weight * (fallback[type] || 2.0);
  }

  return { co2e, co2e_unit: 'kg' };
}

// =========================
// 🚗 COMMUTE EMISSIONS
// =========================
app.post('/api/calculate/commute', async (req, res) => {
  try {
    const { distance, vehicleType, unit = 'km' } = req.body;

    // Map to Climatiq IDs (these are generic; adjust if you want more specificity)
    const vehicleMap = {
      car: 'passenger_vehicle-vehicle_type_car-fuel_source_na-distance_na-engine_size_na',
      bus: 'passenger_vehicle-vehicle_type_bus-fuel_source_na-distance_na',
      train: 'passenger_vehicle-vehicle_type_train-fuel_source_na',
      plane: 'passenger_vehicle-vehicle_type_aircraft-fuel_source_na',
      motorcycle: 'passenger_vehicle-vehicle_type_motorcycle-fuel_source_na'
    };

    const activityId = vehicleMap[vehicleType] || vehicleMap.car;

    const emissionData = await calculateEmissions({
      activity_id: activityId,
      parameters: { distance, distance_unit: unit }
    });

    return res.json({
      success: true,
      co2e: emissionData.co2e,
      co2e_unit: emissionData.co2e_unit || 'kg',
      activity: 'commute',
      vehicleType,
      distance
    });
  } catch (err) {
    console.error('Commute endpoint error:', err.response?.data || err.message || err);
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

// =========================
// ⚡ ELECTRICITY EMISSIONS
// =========================
app.post('/api/calculate/electricity', async (req, res) => {
  try {
    const { energy, unit = 'kWh' } = req.body;

    const activityId = 'electricity-energy_source_grid_mix-supplier_na-facility_na';

    const emissionData = await calculateEmissions({
      activity_id: activityId,
      parameters: { energy, energy_unit: unit }
    });

    return res.json({
      success: true,
      co2e: emissionData.co2e,
      co2e_unit: emissionData.co2e_unit || 'kg',
      activity: 'electricity',
      energy
    });
  } catch (err) {
    console.error('Electricity endpoint error:', err.response?.data || err.message || err);
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

// =========================
// 🍎 FOOD EMISSIONS
// =========================
app.post('/api/calculate/food', async (req, res) => {
  try {
    const { foodType, quantity, unit = 'kg' } = req.body;

    const foodMap = {
      beef: 'food-beef',
      chicken: 'food-chicken',
      pork: 'food-pork',
      fish: 'food-fish',
      dairy: 'food-dairy',
      vegetables: 'food-vegetables',
      fruits: 'food-fruits'
    };

    const activityId = foodMap[foodType] || foodMap.vegetables;

    const emissionData = await calculateEmissions({
      activity_id: activityId,
      parameters: { weight: quantity, weight_unit: unit }
    });

    return res.json({
      success: true,
      co2e: emissionData.co2e,
      co2e_unit: emissionData.co2e_unit || 'kg',
      activity: 'food',
      foodType,
      quantity
    });
  } catch (err) {
    console.error('Food endpoint error:', err.response?.data || err.message || err);
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

// =========================
// 🌱 OFFSET PROJECTS
// =========================
app.get('/api/offsets', async (req, res) => {
  try {
    const response = await axios.get(`${GOLD_STANDARD_BASE_URL}/projects`, {
      params: { limit: 10, status: 'active' }
    });

    return res.json({ success: true, projects: response.data || [] });
  } catch (error) {
    console.error('Gold Standard API Error:', error.response?.data || error.message || error);

    // fallback mock data
    return res.json({
      success: true,
      projects: [
        { id: 1, name: 'Renewable Energy Project', description: 'Support clean energy initiatives', location: 'Global' },
        { id: 2, name: 'Reforestation Program', description: 'Plant trees to offset carbon', location: 'Global' }
      ]
    });
  }
});

// =========================
// ❤️ HEALTH CHECK + ROOT
// =========================
app.get('/', (req, res) => {
  res.send('Carbon Footprint API is running!');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is operational' });
});

// =========================
// 🚀 START SERVER
// =========================
app.listen(PORT, () => {
  console.log(`🔥 Server live on port ${PORT}`);
  console.log(`🔑 CLIMATIQ_API_KEY loaded: ${CLIMATIQ_API_KEY ? 'YES' : 'NO (Missing!)'}`);
});
