# Carbon Footprint Calculator 🌱

A comprehensive web application to track and visualize your carbon footprint. Calculate emissions from daily activities like commute, electricity usage, and food consumption, then visualize your impact with beautiful charts and discover carbon offset opportunities.

## Features

- 🚗 **Track Commute**: Calculate emissions from cars, buses, trains, planes, and motorcycles
- ⚡ **Monitor Energy**: Track electricity consumption and its carbon impact
- 🍽️ **Food Impact**: See how your dietary choices affect your carbon footprint
- 📊 **Visualize Data**: Beautiful daily and weekly emission charts using Chart.js
- 🌱 **Offset Suggestions**: Discover verified carbon offset projects via Gold Standard API
- 💾 **Local Storage**: Your activities are saved locally in your browser

## Tech Stack

- **Frontend**: React, React Router, Chart.js, React-Chartjs-2
- **Backend**: Node.js, Express
- **APIs**: 
  - [Climatiq API](https://www.climatiq.io/docs) - For emission factor calculations
  - [Gold Standard API](https://api.goldstandard.org) - For carbon offset project suggestions

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Climatiq API key (get one at [climatiq.io](https://www.climatiq.io))

### Installation

1. **Clone or download the project**

2. **Install dependencies for all parts:**
   ```bash
   npm run install-all
   ```
   
   Or install manually:
   ```bash
   # Root dependencies
   npm install
   
   # Server dependencies
   cd server
   npm install
   
   # Client dependencies
   cd ../client
   npm install
   ```

3. **Set up environment variables:**
   
   Create a `.env` file in the `server` directory:
   ```env
   CLIMATIQ_API_KEY=your_climatiq_api_key_here
   PORT=5000
   ```
   
   Get your free API key from [Climatiq](https://www.climatiq.io)

4. **Start the development servers:**
   
   From the root directory:
   ```bash
   npm run dev
   ```
   
   This will start both the backend server (port 5000) and frontend React app (port 3000).
   
   Or start them separately:
   ```bash
   # Terminal 1 - Backend
   npm run server
   
   # Terminal 2 - Frontend
   npm run client
   ```

5. **Open your browser:**
   
   Navigate to `http://localhost:3000` to see the application.

## Project Structure

```
carbon-footprint-calculator/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LandingPage.js
│   │   │   ├── Calculator.js
│   │   │   ├── ActivityForm.js
│   │   │   ├── EmissionsChart.js
│   │   │   └── OffsetSuggestions.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── server/                 # Express backend
│   ├── index.js
│   └── package.json
├── package.json
└── README.md
```

## Usage

1. **Landing Page**: Start at the beautiful green-themed landing page
2. **Calculate Emissions**: Click "Calculate Your Footprint" to start
3. **Add Activities**: 
   - Enter your commute details (vehicle type and distance)
   - Add electricity consumption (kWh)
   - Log food consumption (type and quantity)
4. **View Charts**: Switch to the Charts tab to see daily and weekly trends
5. **Explore Offsets**: Check the Offsets tab for carbon offset project suggestions

## API Endpoints

- `POST /api/calculate/commute` - Calculate commute emissions
- `POST /api/calculate/electricity` - Calculate electricity emissions
- `POST /api/calculate/food` - Calculate food emissions
- `GET /api/offsets` - Get carbon offset project suggestions
- `GET /api/health` - Health check endpoint

## Notes

- The application uses localStorage to persist your activities
- Make sure your Climatiq API key is valid for accurate calculations
- The Gold Standard API integration provides offset suggestions (may use mock data if API is unavailable)

## Contributing

This is a hackathon project. Feel free to fork and improve!

## License

MIT

---

**Made with 🌱 for a sustainable future**

