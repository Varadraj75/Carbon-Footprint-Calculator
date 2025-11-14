import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import './DashboardCharts.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const DashboardCharts = ({ dailyEmissions, weeklyEmissions, emissionsByType, activities }) => {
  // Ensure we have valid data
  const dailyLabels = Object.keys(dailyEmissions || {}).sort().filter(d => dailyEmissions[d] > 0);
  const dailyData = dailyLabels.map(date => parseFloat(dailyEmissions[date]) || 0);
  
  const weeklyLabels = Object.keys(weeklyEmissions || {}).sort().filter(w => weeklyEmissions[w] > 0);
  const weeklyData = weeklyLabels.map(week => parseFloat(weeklyEmissions[week]) || 0);
  
  const typeLabels = Object.keys(emissionsByType || {}).filter(t => emissionsByType[t] > 0);
  const typeData = typeLabels.map(type => parseFloat(emissionsByType[type]) || 0);
  
  const typeColors = { 'commute': '#667eea', 'electricity': '#764ba2', 'food': '#f093fb' };

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { 
        display: true, 
        position: 'top', 
        labels: { 
          font: { size: 13, family: 'Poppins', weight: '500' }, 
          color: '#333', 
          padding: 12,
          usePointStyle: true
        } 
      },
      tooltip: { 
        backgroundColor: 'rgba(0, 0, 0, 0.85)', 
        padding: 12, 
        titleFont: { size: 13, family: 'Poppins' }, 
        bodyFont: { size: 12, family: 'Poppins' },
        cornerRadius: 8,
        displayColors: true
      }
    }
  };

  const lineBarOptions = {
    ...baseOptions,
    maintainAspectRatio: false,
    scales: {
      y: { 
        beginAtZero: true, 
        ticks: { 
          font: { size: 11, family: 'Poppins' }, 
          color: '#666',
          callback: function(value) {
            return value.toFixed(1) + ' kg';
          }
        }, 
        grid: { color: 'rgba(0, 0, 0, 0.08)', drawBorder: false } 
      },
      x: { 
        ticks: { 
          font: { size: 11, family: 'Poppins' }, 
          color: '#666',
          maxRotation: 45,
          minRotation: 0
        }, 
        grid: { display: false } 
      }
    }
  };

  // Daily chart data
  const dailyChartData = dailyLabels.length > 0 ? {
    labels: dailyLabels.map(date => {
      try {
        const d = new Date(date);
        return isNaN(d.getTime()) ? date : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } catch {
        return date;
      }
    }),
    datasets: [{
      label: 'Daily CO₂e Emissions (kg)',
      data: dailyData,
      borderColor: '#667eea',
      backgroundColor: 'rgba(102, 126, 234, 0.15)',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointRadius: 5,
      pointHoverRadius: 7,
      pointBackgroundColor: '#667eea',
      pointBorderColor: '#fff',
      pointBorderWidth: 2
    }]
  } : null;

  // Weekly chart data
  const weeklyChartData = weeklyLabels.length > 0 ? {
    labels: weeklyLabels.map(week => {
      try {
        const d = new Date(week);
        return isNaN(d.getTime()) ? week : `Week of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      } catch {
        return week;
      }
    }),
    datasets: [{
      label: 'Weekly CO₂e Emissions (kg)',
      data: weeklyData,
      backgroundColor: 'rgba(102, 126, 234, 0.7)',
      borderColor: '#667eea',
      borderWidth: 2,
      borderRadius: 8
    }]
  } : null;

  // Pie chart data
  const pieChartData = typeLabels.length > 0 ? {
    labels: typeLabels.map(type => type.charAt(0).toUpperCase() + type.slice(1)),
    datasets: [{
      data: typeData,
      backgroundColor: typeLabels.map(type => typeColors[type] || '#999'),
      borderColor: '#fff',
      borderWidth: 4,
      offset: typeData.map(() => 12)
    }]
  } : null;

  const pieOptions = {
    ...baseOptions,
    maintainAspectRatio: false,
    plugins: {
      ...baseOptions.plugins,
      legend: { 
        ...baseOptions.plugins.legend, 
        position: 'right',
        labels: {
          ...baseOptions.plugins.legend.labels,
          padding: 15,
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return {
                  text: `${label}: ${value.toFixed(2)} kg (${percentage}%)`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: data.datasets[0].borderColor,
                  lineWidth: data.datasets[0].borderWidth,
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        ...baseOptions.plugins.tooltip,
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
            return `${context.label}: ${context.parsed.toFixed(2)} kg (${percentage}%)`;
          }
        }
      }
    }
  };

  const hasData = (dailyLabels.length > 0) || (weeklyLabels.length > 0) || (typeLabels.length > 0);

  if (!hasData) {
    return (
      <div className="charts-container">
        <div className="no-chart-data">
          <div className="no-data-icon">📊</div>
          <p>No emission data available yet.</p>
          <p>Start adding activities to see your carbon footprint visualized!</p>
          <p style={{ marginTop: '1rem', color: '#667eea', fontWeight: 600 }}>Switch to "Add Activity" tab to input your data.</p>
        </div>
      </div>
    );
  }

  const getActivityInfo = (activity) => {
    if (activity.type === 'commute') return { icon: '🚗', title: `${activity.vehicleType} - ${activity.distance} km` };
    if (activity.type === 'electricity') return { icon: '⚡', title: `${activity.energy} kWh` };
    return { icon: '🍽️', title: `${activity.foodType} - ${activity.quantity} kg` };
  };

  return (
    <div className="charts-container">
      <div className="charts-grid">
        {dailyChartData && (
          <div className="chart-card">
            <h3>📈 Daily Emissions Trend</h3>
            <div className="chart-wrapper">
              <Line data={dailyChartData} options={lineBarOptions} />
            </div>
          </div>
        )}
        
        {weeklyChartData && (
          <div className="chart-card">
            <h3>📊 Weekly Emissions Summary</h3>
            <div className="chart-wrapper">
              <Bar data={weeklyChartData} options={lineBarOptions} />
            </div>
          </div>
        )}

        {pieChartData && (
          <div className="chart-card full-width">
            <h3>🥧 Emissions by Activity Type</h3>
            <div className="chart-wrapper pie-chart">
              <Doughnut data={pieChartData} options={pieOptions} />
            </div>
          </div>
        )}
      </div>

      {activities && activities.length > 0 && (
        <div className="activities-summary">
          <h3>📋 Recent Activities</h3>
          <div className="activities-list">
            {activities.slice().reverse().slice(0, 10).map(activity => {
              const info = getActivityInfo(activity);
              const co2e = parseFloat(activity.co2e) || 0;
              return (
                <div key={activity.id} className="activity-summary-item">
                  <div className="activity-icon">{info.icon}</div>
                  <div className="activity-details">
                    <div className="activity-title">{info.title}</div>
                    <div className="activity-date">{activity.date}</div>
                  </div>
                  <div className="activity-emission">{co2e.toFixed(2)} kg CO₂e</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardCharts;
