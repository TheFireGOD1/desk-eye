/**
 * Database module for DeskEye
 * Stores aggregated eye health metrics locally using JSON files
 * Privacy-first: No raw images or video data stored by default
 */

const path = require('path');
const fs = require('fs');
const { app } = require('electron');

let dbPath = null;
let metricsFile = null;
let sessionsFile = null;

/**
 * Initialize database (JSON file storage)
 */
function initialize() {
  try {
    // Get user data path
    const userDataPath = app.getPath('userData');
    dbPath = path.join(userDataPath, 'deskeye_data');
    
    console.log('Database path:', dbPath);
    
    // Ensure directory exists
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true });
    }
    
    // Set file paths
    metricsFile = path.join(dbPath, 'metrics.json');
    sessionsFile = path.join(dbPath, 'sessions.json');
    
    // Initialize files if they don't exist
    if (!fs.existsSync(metricsFile)) {
      fs.writeFileSync(metricsFile, JSON.stringify([], null, 2));
    }
    
    if (!fs.existsSync(sessionsFile)) {
      fs.writeFileSync(sessionsFile, JSON.stringify([], null, 2));
    }
    
    console.log('Database initialized successfully');
    
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

/**
 * Read metrics from file
 */
function readMetrics() {
  try {
    const data = fs.readFileSync(metricsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading metrics:', error);
    return [];
  }
}

/**
 * Write metrics to file
 */
function writeMetrics(metrics) {
  try {
    fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 2));
  } catch (error) {
    console.error('Error writing metrics:', error);
    throw error;
  }
}

/**
 * Read sessions from file
 */
function readSessions() {
  try {
    const data = fs.readFileSync(sessionsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading sessions:', error);
    return [];
  }
}

/**
 * Write sessions to file
 */
function writeSessions(sessions) {
  try {
    fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));
  } catch (error) {
    console.error('Error writing sessions:', error);
    throw error;
  }
}

/**
 * Save a metric record
 */
function saveMetric(metric) {
  try {
    const metrics = readMetrics();
    
    const newMetric = {
      id: metrics.length > 0 ? Math.max(...metrics.map(m => m.id || 0)) + 1 : 1,
      timestamp: metric.timestamp || Date.now(),
      blinkRate: metric.blinkRate || 0,
      avgEAR: metric.avgEAR || 0,
      strainScore: metric.strainScore || 0,
      breakTaken: metric.breakTaken || false,
      createdAt: Date.now()
    };
    
    metrics.push(newMetric);
    writeMetrics(metrics);
    
    return newMetric.id;
  } catch (error) {
    console.error('Error saving metric:', error);
    throw error;
  }
}

/**
 * Get metrics within a date range
 */
function getMetrics(startDate, endDate, limit = 1000) {
  try {
    const metrics = readMetrics();
    
    const filtered = metrics
      .filter(m => m.timestamp >= startDate && m.timestamp <= endDate)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
    
    return filtered;
  } catch (error) {
    console.error('Error fetching metrics:', error);
    throw error;
  }
}

/**
 * Get aggregated statistics
 */
function getStatistics(startDate, endDate) {
  try {
    const metrics = readMetrics();
    const filtered = metrics.filter(m => m.timestamp >= startDate && m.timestamp <= endDate);
    
    if (filtered.length === 0) {
      return {
        totalRecords: 0,
        avgBlinkRate: 0,
        avgEAR: 0,
        avgStrainScore: 0,
        totalBreaks: 0,
        firstRecord: null,
        lastRecord: null
      };
    }
    
    const stats = {
      totalRecords: filtered.length,
      avgBlinkRate: filtered.reduce((sum, m) => sum + m.blinkRate, 0) / filtered.length,
      avgEAR: filtered.reduce((sum, m) => sum + m.avgEAR, 0) / filtered.length,
      avgStrainScore: filtered.reduce((sum, m) => sum + m.strainScore, 0) / filtered.length,
      totalBreaks: filtered.filter(m => m.breakTaken).length,
      firstRecord: Math.min(...filtered.map(m => m.timestamp)),
      lastRecord: Math.max(...filtered.map(m => m.timestamp))
    };
    
    return stats;
  } catch (error) {
    console.error('Error fetching statistics:', error);
    throw error;
  }
}

/**
 * Delete old metrics (data retention)
 */
function deleteOldMetrics(daysToKeep = 90) {
  try {
    const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    const metrics = readMetrics();
    const filtered = metrics.filter(m => m.timestamp >= cutoffDate);
    const deletedCount = metrics.length - filtered.length;
    
    writeMetrics(filtered);
    console.log(`Deleted ${deletedCount} old metric records`);
    
    return deletedCount;
  } catch (error) {
    console.error('Error deleting old metrics:', error);
    throw error;
  }
}

/**
 * Export metrics to CSV
 */
async function exportToCSV(startDate, endDate) {
  try {
    const metrics = getMetrics(startDate, endDate, 100000);
    
    if (metrics.length === 0) {
      throw new Error('No data to export');
    }
    
    // Create CSV content
    const headers = ['Timestamp', 'Date', 'Time', 'Blink Rate', 'Avg EAR', 'Strain Score', 'Break Taken'];
    const rows = metrics.map(m => {
      const date = new Date(m.timestamp);
      return [
        m.timestamp,
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        m.blinkRate.toFixed(2),
        m.avgEAR.toFixed(4),
        m.strainScore.toFixed(4),
        m.breakTaken ? 'Yes' : 'No'
      ];
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Save to file
    const userDataPath = app.getPath('userData');
    const exportsDir = path.join(userDataPath, 'exports');
    
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `deskeye_metrics_${timestamp}.csv`;
    const filepath = path.join(exportsDir, filename);
    
    fs.writeFileSync(filepath, csvContent, 'utf8');
    
    console.log('Metrics exported to:', filepath);
    return filepath;
    
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw error;
  }
}

/**
 * Start a new monitoring session
 */
function startSession() {
  try {
    const sessions = readSessions();
    
    const newSession = {
      id: sessions.length > 0 ? Math.max(...sessions.map(s => s.id || 0)) + 1 : 1,
      startTime: Date.now(),
      endTime: null,
      duration: null,
      totalBlinks: 0,
      breaksTaken: 0,
      avgStrainScore: 0,
      createdAt: Date.now()
    };
    
    sessions.push(newSession);
    writeSessions(sessions);
    
    return newSession.id;
  } catch (error) {
    console.error('Error starting session:', error);
    throw error;
  }
}

/**
 * End a monitoring session
 */
function endSession(sessionId) {
  try {
    const sessions = readSessions();
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    const endTime = Date.now();
    const duration = endTime - session.startTime;
    
    // Calculate session statistics
    const metrics = readMetrics();
    const sessionMetrics = metrics.filter(
      m => m.timestamp >= session.startTime && m.timestamp <= endTime
    );
    
    session.endTime = endTime;
    session.duration = duration;
    session.totalBlinks = sessionMetrics.length;
    session.breaksTaken = sessionMetrics.filter(m => m.breakTaken).length;
    session.avgStrainScore = sessionMetrics.length > 0
      ? sessionMetrics.reduce((sum, m) => sum + m.strainScore, 0) / sessionMetrics.length
      : 0;
    
    writeSessions(sessions);
    
    return sessionId;
  } catch (error) {
    console.error('Error ending session:', error);
    throw error;
  }
}

/**
 * Get recent sessions
 */
function getSessions(limit = 10) {
  try {
    const sessions = readSessions();
    
    return sessions
      .filter(s => s.endTime !== null)
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    throw error;
  }
}

/**
 * Vacuum database to reclaim space (compact JSON files)
 */
function vacuum() {
  try {
    // Re-write files to compact them
    const metrics = readMetrics();
    writeMetrics(metrics);
    
    const sessions = readSessions();
    writeSessions(sessions);
    
    console.log('Database compacted successfully');
  } catch (error) {
    console.error('Error compacting database:', error);
  }
}

/**
 * Close database connection (no-op for JSON storage)
 */
function close() {
  console.log('Database closed');
}

/**
 * Get database path
 */
function getDatabase() {
  return dbPath;
}

// Export functions
module.exports = {
  initialize,
  saveMetric,
  getMetrics,
  getStatistics,
  deleteOldMetrics,
  exportToCSV,
  startSession,
  endSession,
  getSessions,
  vacuum,
  close,
  getDatabase
};
