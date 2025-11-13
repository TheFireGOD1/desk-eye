// DeskEye Dashboard
let currentRange = 'today';
let charts = {};
let metricsData = [];

// Initialize
async function initialize() {
  setupEventListeners();
  await loadData();
}

function setupEventListeners() {
  // Time range selector
  document.querySelectorAll('.time-range-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      document.querySelectorAll('.time-range-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentRange = e.target.dataset.range;
      await loadData();
    });
  });
  
  // Export button
  document.getElementById('export-btn').addEventListener('click', exportData);
}

async function loadData() {
  try {
    const { startDate, endDate } = getDateRange(currentRange);
    
    const result = await window.electronAPI.getMetrics({
      startDate,
      endDate,
      limit: 10000
    });
    
    if (result.success && result.data && result.data.length > 0) {
      metricsData = result.data;
      document.getElementById('no-data').style.display = 'none';
      updateStatistics();
      updateCharts();
    } else {
      document.getElementById('no-data').style.display = 'block';
      clearCharts();
    }
  } catch (error) {
    console.error('Failed to load data:', error);
  }
}

function getDateRange(range) {
  const now = new Date();
  let startDate;
  
  switch (range) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'all':
      startDate = new Date(0); // Beginning of time
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  
  return {
    startDate: startDate.getTime(),
    endDate: now.getTime()
  };
}

function updateStatistics() {
  // Calculate average blink rate
  const avgBlinkRate = metricsData.reduce((sum, m) => sum + (m.blinkRate || 0), 0) / metricsData.length;
  document.getElementById('avg-blink-rate').textContent = avgBlinkRate.toFixed(1);
  
  // Calculate average health score (inverse of strain)
  const avgHealthScore = metricsData.reduce((sum, m) => {
    const health = (1 - (m.strainScore || 0)) * 100;
    return sum + health;
  }, 0) / metricsData.length;
  document.getElementById('avg-health-score').textContent = Math.round(avgHealthScore);
  
  // Count breaks taken
  const breaksTaken = metricsData.filter(m => m.breakTaken).length;
  document.getElementById('breaks-taken').textContent = breaksTaken;
  
  // Calculate monitoring time (approximate based on data points)
  // Assuming data points are saved every 15 seconds
  const monitoringMinutes = metricsData.length * 0.25; // 15 seconds = 0.25 minutes
  const monitoringHours = (monitoringMinutes / 60).toFixed(1);
  document.getElementById('monitoring-time').textContent = monitoringHours;
}

function updateCharts() {
  updateBlinkRateChart();
  updateStrainScoreChart();
  updateHealthScoreChart();
  updateActivityChart();
}

function updateBlinkRateChart() {
  const ctx = document.getElementById('blink-rate-chart');
  
  // Destroy existing chart
  if (charts.blinkRate) {
    charts.blinkRate.destroy();
  }
  
  // Prepare data - group by hour for better visualization
  const groupedData = groupDataByHour(metricsData);
  
  charts.blinkRate = new Chart(ctx, {
    type: 'line',
    data: {
      labels: groupedData.labels,
      datasets: [{
        label: 'Blink Rate (blinks/min)',
        data: groupedData.blinkRates,
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Blinks per Minute'
          }
        }
      }
    }
  });
}

function updateStrainScoreChart() {
  const ctx = document.getElementById('strain-score-chart');
  
  if (charts.strainScore) {
    charts.strainScore.destroy();
  }
  
  const groupedData = groupDataByHour(metricsData);
  
  charts.strainScore = new Chart(ctx, {
    type: 'line',
    data: {
      labels: groupedData.labels,
      datasets: [{
        label: 'Strain Score',
        data: groupedData.strainScores,
        borderColor: '#FF9800',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 1,
          title: {
            display: true,
            text: 'Strain Probability'
          }
        }
      }
    }
  });
}

function updateHealthScoreChart() {
  const ctx = document.getElementById('health-score-chart');
  
  if (charts.healthScore) {
    charts.healthScore.destroy();
  }
  
  const groupedData = groupDataByHour(metricsData);
  
  // Convert strain to health score
  const healthScores = groupedData.strainScores.map(s => (1 - s) * 100);
  
  charts.healthScore = new Chart(ctx, {
    type: 'line',
    data: {
      labels: groupedData.labels,
      datasets: [{
        label: 'Health Score',
        data: healthScores,
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Health Score (0-100)'
          }
        }
      }
    }
  });
}

function updateActivityChart() {
  const ctx = document.getElementById('activity-chart');
  
  if (charts.activity) {
    charts.activity.destroy();
  }
  
  // Group by day and count data points
  const dailyActivity = {};
  
  metricsData.forEach(m => {
    const date = new Date(m.timestamp);
    const dateKey = date.toLocaleDateString();
    
    if (!dailyActivity[dateKey]) {
      dailyActivity[dateKey] = 0;
    }
    dailyActivity[dateKey]++;
  });
  
  const labels = Object.keys(dailyActivity);
  const data = Object.values(dailyActivity).map(count => (count * 0.25 / 60).toFixed(1)); // Convert to hours
  
  charts.activity = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Hours Monitored',
        data: data,
        backgroundColor: '#4CAF50',
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Hours'
          }
        }
      }
    }
  });
}

function groupDataByHour(data) {
  const grouped = {};
  
  data.forEach(item => {
    const date = new Date(item.timestamp);
    const hourKey = `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:00`;
    
    if (!grouped[hourKey]) {
      grouped[hourKey] = {
        blinkRates: [],
        strainScores: []
      };
    }
    
    grouped[hourKey].blinkRates.push(item.blinkRate || 0);
    grouped[hourKey].strainScores.push(item.strainScore || 0);
  });
  
  const labels = Object.keys(grouped);
  const blinkRates = labels.map(key => {
    const rates = grouped[key].blinkRates;
    return rates.reduce((sum, r) => sum + r, 0) / rates.length;
  });
  const strainScores = labels.map(key => {
    const scores = grouped[key].strainScores;
    return scores.reduce((sum, s) => sum + s, 0) / scores.length;
  });
  
  return { labels, blinkRates, strainScores };
}

function clearCharts() {
  Object.values(charts).forEach(chart => {
    if (chart) chart.destroy();
  });
  charts = {};
}

async function exportData() {
  try {
    const { startDate, endDate } = getDateRange(currentRange);
    
    const result = await window.electronAPI.exportMetricsCSV({
      startDate,
      endDate
    });
    
    if (result.success) {
      document.getElementById('export-status').textContent = `✅ Exported to: ${result.path}`;
      setTimeout(() => {
        document.getElementById('export-status').textContent = '';
      }, 5000);
    } else {
      document.getElementById('export-status').textContent = '❌ Export failed';
      document.getElementById('export-status').style.color = 'var(--color-danger)';
    }
  } catch (error) {
    console.error('Export error:', error);
    document.getElementById('export-status').textContent = '❌ Export failed';
    document.getElementById('export-status').style.color = 'var(--color-danger)';
  }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', initialize);
