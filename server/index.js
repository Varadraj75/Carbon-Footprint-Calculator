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
app.use(cors());
app.use(express.json());

// =========================
// 🌐 API CONFIG
// =========================

// Climatiq (Updated stable endpoint)
const CLIMATIQ_API_KEY = process.env.CLIMATIQ_API_KEY || "";
const CLIMATIQ_BASE_URL = "https://api.climatiq.io";

// Gold Standard (fallback used)
const GOLD_STANDARD_BASE_URL = "https://api.goldstandard.org";

// =========================
// 🔍 Helper: Search Emission Factor
// =========================
async function searchEmissionFactor(query) {
  try {
    const response = await axios.get(`${CLIMATIQ_BASE_URL}/search`, {
      params: {
        query,
        category: "transport",
        results_per_page: 1,
      },
      headers: {
        Authorization: `Bearer ${CLIMATIQ_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (response.data?.results?.length > 0) {
      return response.data.results[0].id;
    }
    return null;
  } catch (error) {
    console.error("Climatiq Search Error:", error.response?.data || error.message);
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
        parameters,
      },
      {
        headers: {
          Authorization: `Bearer ${CLIMATIQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Climatiq API Error:", error.response?.data || error.message);
    // fallback
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
    fruits: 1.1,
  };

  let co2e = 0;

  // distance
  if (parameters.distance) {
    const type =
      activity_id.includes("car") ? "car" :
      activity_id.includes("bus") ? "bus" :
      activity_id.includes("train") ? "train" :
      activity_id.includes("aircraft") ? "plane" :
      activity_id.includes("motorcycle") ? "motorcycle" : "car";

    co2e = parameters.distance * (fallback[type] || 0.21);
  }

  // electricity
  else if (parameters.energy) {
    co2e = parameters.energy * fallback.electricity;
  }

  // food weight
  else if (parameters.weight) {
    const type =
      activity_id.includes("beef") ? "beef" :
      activity_id.includes("chicken") ? "chicken" :
      activity_id.includes("pork") ? "pork" :
      activity_id.includes("fish") ? "fish" :
      activity_id.includes("dairy") ? "dairy" :
      activity_id.includes("fruit") ? "fruits" : "vegetables";

    co2e = parameters.weight * (fallback[type] || 2.0);
  }

  return {
    co2e,
    co2e_unit: "kg",
  };
}

// =========================
// 🚗 COMMUTE EMISSIONS
// =========================
app.post("/api/calculate/commute", async (req, res) => {
  try {
    const { distance, vehicleType, unit = "km" } = req.body;

    const vehicleMap = {
      car: "passenger_vehicle-vehicle_type_car-fuel_source_na-distance_na-engine_size_na",
      bus: "passenger_vehicle-vehicle_type_bus-fuel_source_na-distance_na",
      train: "passenger_vehicle-vehicle_type_train-fuel_source_na",
      plane: "passenger_vehicle-vehicle_type_aircraft-fuel_source_na",
      motorcycle: "passenger_vehicle-vehicle_type_motorcycle-fuel_source_na",
    };

    const activityId = vehicleMap[vehicleType] || vehicleMap.car;

    const emissionData = await calculateEmissions({
      activity_id: activityId,
      parameters: {
        distance,
        distance_unit: unit,
      },
    });

    res.json({
      success: true,
      co2e: emissionData.co2e,
      unit: emissionData.co2e_unit,
      distance,
      vehicleType,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================
// ⚡ ELECTRICITY EMISSIONS
// =========================
app.post("/api/calculate/electricity", async (req, res) => {
  try {
    const { energy, unit = "kWh" } = req.body;

    const activityId = `electricity-energy_source_grid_mix-supplier_na-facility_na`;

    const emissionData = await calculateEmissions({
      activity_id: activityId,
      parameters: {
        energy,
        energy_unit: unit,
      },
    });

    res.json({
      success: true,
      co2e: emissionData.co2e,
      unit: emissionData.co2e_unit,
      energy,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================
// 🍎 FOOD EMISSIONS
// =========================
app.post("/api/calculate/food", async (req, res) => {
  try {
    const { foodType, quantity, unit = "kg" } = req.body;

    const foodMap = {
      beef: "food-beef",
      chicken: "food-chicken",
      pork: "food-pork",
      fish: "food-fish",
      dairy: "food-dairy",
      vegetables: "food-vegetables",
      fruits: "food-fruits",
    };

    const activityId = foodMap[foodType] || foodMap.vegetables;

    const emissionData = await calculateEmissions({
      activity_id: activityId,
      parameters: {
        weight: quantity,
        weight_unit: unit,
      },
    });

    res.json({
      success: true,
      co2e: emissionData.co2e,
      unit: emissionData.co2e_unit,
      quantity,
      foodType,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================
// 🌱 OFFSET PROJECTS
// =========================
app.get("/api/offsets", async (req, res) => {
  try {
    const response = await axios.get(`${GOLD_STANDARD_BASE_URL}/projects`, {
      params: { limit: 10, status: "active" },
    });

    res.json({ success: true, projects: response.data });
  } catch (error) {
    console.log("Gold Standard API Error (Fallback used).");

    res.json({
      success: true,
      projects: [
        {
          id: 1,
          name: "Renewable Energy Project",
          description: "Support clean energy",
          location: "Global",
        },
        {
          id: 2,
          name: "Reforestation Program",
          description: "Plant trees to offset carbon",
          location: "Global",
        },
      ],
    });
  }
});

// =========================
// ❤️ HEALTH CHECK + ROOT
// =========================
app.get("/", (req, res) => {
  res.send("Carbon Footprint API is running!");
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "API is operational" });
});

// =========================
// 🚀 START SERVER
// =========================
app.listen(PORT, () => {
  console.log(`🔥 Server live on port ${PORT}`);
  console.log(`🔑 Using Climatiq API Key: ${CLIMATIQ_API_KEY ? "Loaded" : "Missing!"}`);
});
