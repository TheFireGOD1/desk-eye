/**
 * Database module for DeskEye
 * Stores aggregated eye health metrics locally using SQLite
 * Privacy-first: No raw images or video data stored by default
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

let db = null;

/**
 * Initialize database connection and create tables
 */
function initialize() {
  try {
    // Get user data path
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'deskeye.db');
    
    console.log('Database path:', dbPath);
    
    // Ensure directory exists
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    
    // Open database
    db = new Database(dbPath);
    
    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');
    
    // Create tables
    createTables();
    
    console.log('Database initialized successfully');
    
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

/**
 * Create database tables
 */
function createTables() {
  // Metrics table - stores aggregated eye health metrics
  db.exec(`
    CREATE TABLE IF NOT EXISTS metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      blink_rate REAL NOT NULL,
      avg_ear REAL NOT NULL,
      strain_score REAL NOT NULL,
      break_taken INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `);
  
  // Create index on timestamp for faster queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_metrics_timestamp 
    ON metrics(timestamp)
  `);
  
  // Settings table (optional, as we use electron-store)
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `);
  
  // Session table - track monitoring sessions
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_time INTEGER NOT NULL,
      end_time INTEGER,
      duration INTEGER,
      total_blinks INTEGER DEFAULT 0,
      breaks_taken INTEGER DEFAULT 0,
      avg_strain_score REAL,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `);
}

/**
 * Save a metric record
 */
function saveMetric(metric) {
  try {
    const stmt = db.prepare(`
      INSERT INTO metrics (timestamp, blink_rate, avg_ear, strain_score, break_taken)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      metric.timestamp || Date.now(),
      metric.blinkRate || 0,
      metric.avgEAR || 0,
      metric.strainScore || 0,
      metric.breakTaken ? 1 : 0
    );
    
    return result.lastInsertRowid;
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
    const stmt = db.prepare(`
      SELECT 
        id,
        timestamp,
        blink_rate as blinkRate,
        avg_ear as avgEAR,
        strain_score as strainScore,
        break_taken as breakTaken,
        created_at as createdAt
      FROM metrics
      WHERE timestamp >= ? AND timestamp <= ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);
    
    const metrics = stmt.all(startDate, endDate, limit);
    return metrics;
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
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as totalRecords,
        AVG(blink_rate) as avgBlinkRate,
        AVG(avg_ear) as avgEAR,
        AVG(strain_score) as avgStrainScore,
        SUM(break_taken) as totalBreaks,
        MIN(timestamp) as firstRecord,
        MAX(timestamp) as lastRecord
      FROM metrics
      WHERE timestamp >= ? AND timestamp <= ?
    `);
    
    const stats = stmt.get(startDate, endDate);
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
    
    const stmt = db.prepare(`
      DELETE FROM metrics
      WHERE timestamp < ?
    `);
    
    const result = stmt.run(cutoffDate);
    console.log(`Deleted ${result.changes} old metric records`);
    
    return result.changes;
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
    const stmt = db.prepare(`
      INSERT INTO sessions (start_time)
      VALUES (?)
    `);
    
    const result = stmt.run(Date.now());
    return result.lastInsertRowid;
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
    const endTime = Date.now();
    
    // Get session start time
    const session = db.prepare('SELECT start_time FROM sessions WHERE id = ?').get(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    const duration = endTime - session.start_time;
    
    // Calculate session statistics
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as totalBlinks,
        SUM(break_taken) as breaksTaken,
        AVG(strain_score) as avgStrainScore
      FROM metrics
      WHERE timestamp >= ? AND timestamp <= ?
    `).get(session.start_time, endTime);
    
    // Update session
    const stmt = db.prepare(`
      UPDATE sessions
      SET 
        end_time = ?,
        duration = ?,
        total_blinks = ?,
        breaks_taken = ?,
        avg_strain_score = ?
      WHERE id = ?
    `);
    
    stmt.run(
      endTime,
      duration,
      stats.totalBlinks || 0,
      stats.breaksTaken || 0,
      stats.avgStrainScore || 0,
      sessionId
    );
    
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
    const stmt = db.prepare(`
      SELECT 
        id,
        start_time as startTime,
        end_time as endTime,
        duration,
        total_blinks as totalBlinks,
        breaks_taken as breaksTaken,
        avg_strain_score as avgStrainScore
      FROM sessions
      WHERE end_time IS NOT NULL
      ORDER BY start_time DESC
      LIMIT ?
    `);
    
    return stmt.all(limit);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    throw error;
  }
}

/**
 * Vacuum database to reclaim space
 */
function vacuum() {
  try {
    db.exec('VACUUM');
    console.log('Database vacuumed successfully');
  } catch (error) {
    console.error('Error vacuuming database:', error);
  }
}

/**
 * Close database connection
 */
function close() {
  if (db) {
    db.close();
    db = null;
    console.log('Database connection closed');
  }
}

/**
 * Get database instance (for advanced queries)
 */
function getDatabase() {
  return db;
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
