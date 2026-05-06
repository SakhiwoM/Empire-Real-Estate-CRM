const jwt = require("jsonwebtoken");

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "empire_crm_session";
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

if (!JWT_SECRET || !JWT_SECRET.trim()) {
  throw new Error("JWT_SECRET is required. Set it in server/.env before starting the server.");
}

function signAuthToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username,
      role: user.role || "owner",
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
  });
}

function extractToken(req) {
  const cookieToken = req.cookies?.[COOKIE_NAME];
  if (cookieToken) return cookieToken;

  const authHeader = req.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  return null;
}

function decodeToken(req) {
  const token = extractToken(req);
  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return {
      id: Number(payload.sub),
      username: payload.username,
      role: payload.role || "owner",
    };
  } catch {
    return null;
  }
}

function attachAuthUser(req, res, next) {
  req.user = decodeToken(req);
  next();
}

function requireAuth(req, res, next) {
  const user = decodeToken(req);
  if (!user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  req.user = user;
  next();
}

module.exports = {
  signAuthToken,
  setAuthCookie,
  clearAuthCookie,
  attachAuthUser,
  requireAuth,
};
