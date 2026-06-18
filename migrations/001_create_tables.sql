-- Migration: 001_create_tables.sql
-- Description: Create initial tables for Artist's Way Support App
-- Date: 2026-06-19

-- Users table: Store user information
CREATE TABLE IF NOT EXISTS Users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_active_at DATETIME,
  auth_provider TEXT
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON Users(email);

-- MorningPages table: Store daily morning page entries
CREATE TABLE IF NOT EXISTS MorningPages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  entry_date DATE NOT NULL,
  content TEXT NOT NULL,
  character_count INTEGER NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
  UNIQUE(user_id, entry_date)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_morning_pages_user_id ON MorningPages(user_id);
CREATE INDEX IF NOT EXISTS idx_morning_pages_entry_date ON MorningPages(entry_date);
CREATE INDEX IF NOT EXISTS idx_morning_pages_user_date ON MorningPages(user_id, entry_date);

-- ArtistDates table: Store weekly artist date records
CREATE TABLE IF NOT EXISTS ArtistDates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  week_number INTEGER NOT NULL CHECK(week_number >= 1 AND week_number <= 12),
  went_out BOOLEAN NOT NULL DEFAULT 0,
  excited BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
  UNIQUE(user_id, week_number)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_artist_dates_user_id ON ArtistDates(user_id);
CREATE INDEX IF NOT EXISTS idx_artist_dates_week_number ON ArtistDates(week_number);
CREATE INDEX IF NOT EXISTS idx_artist_dates_user_week ON ArtistDates(user_id, week_number);

-- Progress table: Optional cache for weekly progress aggregation
-- This table can be used to cache progress calculations or computed on-the-fly
CREATE TABLE IF NOT EXISTS Progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  week_number INTEGER NOT NULL CHECK(week_number >= 1 AND week_number <= 12),
  morning_page_done BOOLEAN NOT NULL DEFAULT 0,
  artist_date_done BOOLEAN NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
  UNIQUE(user_id, week_number)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON Progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_week_number ON Progress(week_number);
CREATE INDEX IF NOT EXISTS idx_progress_user_week ON Progress(user_id, week_number);
