const { db } = require("./database");

const createTablesSQL = `
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  location TEXT,
  contact_type TEXT NOT NULL DEFAULT 'Other',
  status TEXT NOT NULL DEFAULT 'New Lead',
  notes TEXT,
  last_contacted_date TEXT,
  next_follow_up_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'owner',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS requirements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER NOT NULL,
  purpose TEXT NOT NULL,
  property_type TEXT NOT NULL,
  preferred_location TEXT,
  min_budget REAL,
  max_budget REAL,
  bedrooms INTEGER,
  bathrooms INTEGER,
  urgency TEXT NOT NULL DEFAULT 'Medium',
  move_in_or_purchase_timeframe TEXT,
  special_requirements TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_contact_id INTEGER,
  title TEXT NOT NULL,
  property_type TEXT NOT NULL,
  listing_type TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  location_notes TEXT,
  price REAL,
  bedrooms INTEGER,
  bathrooms INTEGER,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Available',
  commission_notes TEXT,
  document_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (owner_contact_id) REFERENCES contacts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS property_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  original_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  relative_path TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS follow_ups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER NOT NULL,
  property_id INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'Pending',
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS viewings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER NOT NULL,
  property_id INTEGER NOT NULL,
  viewing_date TEXT NOT NULL,
  viewing_time TEXT NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'Scheduled',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(contact_type);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_requirements_contact ON requirements(contact_id);
CREATE INDEX IF NOT EXISTS idx_requirements_status ON requirements(status);
CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_contact_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_property_images_property ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_followups_contact ON follow_ups(contact_id);
CREATE INDEX IF NOT EXISTS idx_followups_status ON follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_followups_due_date ON follow_ups(due_date);
CREATE INDEX IF NOT EXISTS idx_viewings_date ON viewings(viewing_date);
CREATE INDEX IF NOT EXISTS idx_viewings_status ON viewings(status);
`;

function ensureColumn(tableName, columnName, definition) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  const exists = columns.some((column) => column.name === columnName);
  if (!exists) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

function initDb() {
  db.exec(createTablesSQL);
  ensureColumn("properties", "latitude", "REAL");
  ensureColumn("properties", "longitude", "REAL");
  ensureColumn("properties", "location_notes", "TEXT");
}

module.exports = { initDb };
