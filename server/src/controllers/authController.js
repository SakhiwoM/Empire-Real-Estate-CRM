const bcrypt = require("bcryptjs");
const { db } = require("../db/database");
const { badRequest } = require("../utils/http");
const {
  isNonEmptyString,
  parseNullableString,
} = require("../utils/validation");
const {
  signAuthToken,
  setAuthCookie,
  clearAuthCookie,
} = require("../middleware/auth");

function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

function getUsersCount() {
  const row = db.prepare("SELECT COUNT(*) AS count FROM users").get();
  return row?.count || 0;
}

function getAuthStatus(req, res) {
  const requiresSetup = getUsersCount() === 0;
  if (!req.user) {
    return res.json({
      authenticated: false,
      requires_setup: requiresSetup,
      user: null,
    });
  }

  const user = db
    .prepare(
      "SELECT id, username, full_name, role, created_at, updated_at FROM users WHERE id = ?"
    )
    .get(req.user.id);

  return res.json({
    authenticated: !!user,
    requires_setup: requiresSetup,
    user: sanitizeUser(user),
  });
}

function setupOwner(req, res) {
  if (getUsersCount() > 0) {
    return res.status(409).json({ message: "Owner account already exists. Use login." });
  }

  const errors = [];
  const username = parseNullableString(req.body.username);
  const password = parseNullableString(req.body.password);
  const fullName = parseNullableString(req.body.full_name);

  if (!isNonEmptyString(username)) {
    errors.push("username is required");
  }
  if (!isNonEmptyString(password)) {
    errors.push("password is required");
  }
  if (username && username.length < 3) {
    errors.push("username must be at least 3 characters");
  }
  if (password && password.length < 8) {
    errors.push("password must be at least 8 characters");
  }

  if (errors.length) return badRequest(res, errors);

  const passwordHash = bcrypt.hashSync(password, 10);
  const stmt = db.prepare(`
    INSERT INTO users (username, password_hash, full_name, role, created_at, updated_at)
    VALUES (@username, @password_hash, @full_name, 'owner', datetime('now'), datetime('now'))
  `);

  const info = stmt.run({
    username,
    password_hash: passwordHash,
    full_name: fullName,
  });

  const user = db
    .prepare("SELECT id, username, full_name, role, created_at, updated_at FROM users WHERE id = ?")
    .get(info.lastInsertRowid);

  const token = signAuthToken(user);
  setAuthCookie(res, token);

  return res.status(201).json({
    message: "Owner account created",
    user: sanitizeUser(user),
  });
}

function login(req, res) {
  const username = parseNullableString(req.body.username);
  const password = parseNullableString(req.body.password);
  const errors = [];

  if (!isNonEmptyString(username)) {
    errors.push("username is required");
  }
  if (!isNonEmptyString(password)) {
    errors.push("password is required");
  }
  if (errors.length) return badRequest(res, errors);

  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (!user) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const validPassword = bcrypt.compareSync(password, user.password_hash);
  if (!validPassword) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const token = signAuthToken(user);
  setAuthCookie(res, token);

  return res.json({
    message: "Login successful",
    user: sanitizeUser(user),
  });
}

function logout(req, res) {
  clearAuthCookie(res);
  return res.json({ message: "Logged out" });
}

function me(req, res) {
  const user = db
    .prepare("SELECT id, username, full_name, role, created_at, updated_at FROM users WHERE id = ?")
    .get(req.user.id);

  if (!user) {
    clearAuthCookie(res);
    return res.status(401).json({ message: "Session is no longer valid" });
  }

  return res.json({ user: sanitizeUser(user) });
}

module.exports = {
  getAuthStatus,
  setupOwner,
  login,
  logout,
  me,
};
