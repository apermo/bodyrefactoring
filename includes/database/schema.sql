-- Body Refactoring Schedule Database Schema
-- Version: 1.0.0
-- Compatible with MySQL 8.0+

-- Weekly schedule templates (imported from JSON files)
CREATE TABLE IF NOT EXISTS schedule_templates (
	id INT AUTO_INCREMENT PRIMARY KEY,
	name VARCHAR(100) NOT NULL,
	start_date DATE NOT NULL,
	end_date DATE DEFAULT NULL,
	is_active BOOLEAN DEFAULT TRUE,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	INDEX idx_active_dates (is_active, start_date, end_date),
	INDEX idx_start_date (start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Day configurations within a template
CREATE TABLE IF NOT EXISTS schedule_days (
	id INT AUTO_INCREMENT PRIMARY KEY,
	template_id INT NOT NULL,
	day_index TINYINT UNSIGNED NOT NULL,
	day_id VARCHAR(10) NOT NULL,
	name VARCHAR(50) NOT NULL,
	theme VARCHAR(100) DEFAULT NULL,
	icon VARCHAR(50) DEFAULT NULL,
	color_class VARCHAR(50) DEFAULT NULL,
	bg_class VARCHAR(50) DEFAULT NULL,
	FOREIGN KEY (template_id) REFERENCES schedule_templates(id) ON DELETE CASCADE,
	UNIQUE KEY uk_template_day (template_id, day_index),
	INDEX idx_template_id (template_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exercises within a day
CREATE TABLE IF NOT EXISTS schedule_exercises (
	id INT AUTO_INCREMENT PRIMARY KEY,
	day_id INT NOT NULL,
	exercise_id VARCHAR(50) NOT NULL,
	sort_order INT DEFAULT 0,
	type ENUM('warmup', 'main', 'cool', 'custom', 'alternatives') NOT NULL,
	title VARCHAR(200) NOT NULL,
	description TEXT DEFAULT NULL,
	weight VARCHAR(20) DEFAULT NULL,
	default_unit VARCHAR(10) DEFAULT NULL,
	timers JSON DEFAULT NULL,
	rep_counter JSON DEFAULT NULL,
	custom_label VARCHAR(50) DEFAULT NULL,
	date_condition JSON DEFAULT NULL,
	date_description VARCHAR(100) DEFAULT NULL,
	FOREIGN KEY (day_id) REFERENCES schedule_days(id) ON DELETE CASCADE,
	INDEX idx_day_id (day_id),
	INDEX idx_sort_order (day_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One-time date overrides (holidays, special events)
CREATE TABLE IF NOT EXISTS date_overrides (
	id INT AUTO_INCREMENT PRIMARY KEY,
	target_date DATE NOT NULL,
	override_type ENUM('replace', 'add', 'skip') NOT NULL,
	day_config JSON DEFAULT NULL,
	exercises JSON DEFAULT NULL,
	note VARCHAR(255) DEFAULT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	UNIQUE KEY uk_target_date (target_date),
	INDEX idx_target_date (target_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit log for tracking changes (optional, for debugging)
CREATE TABLE IF NOT EXISTS schedule_audit (
	id INT AUTO_INCREMENT PRIMARY KEY,
	table_name VARCHAR(50) NOT NULL,
	record_id INT NOT NULL,
	action ENUM('insert', 'update', 'delete') NOT NULL,
	old_values JSON DEFAULT NULL,
	new_values JSON DEFAULT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	INDEX idx_table_record (table_name, record_id),
	INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
