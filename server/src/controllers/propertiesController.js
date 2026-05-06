const fs = require("fs");
const path = require("path");
const { db } = require("../db/database");
const {
  PROPERTY_TYPES,
  LISTING_TYPES,
  PROPERTY_STATUSES,
} = require("../utils/constants");
const {
  validateEnum,
  validateRequiredString,
  validateNumber,
  validateInteger,
  parseNullableNumber,
  parseNullableInteger,
  parseNullableString,
} = require("../utils/validation");
const { badRequest, notFound } = require("../utils/http");
const { getPropertyToRequirementMatch } = require("../utils/matcher");
const { propertyUploadsDir } = require("../middleware/upload");

function buildPropertyQuery(whereClause) {
  return `
    SELECT
      p.*,
      c.full_name AS owner_name,
      c.phone AS owner_phone,
      COUNT(pi.id) AS image_count
    FROM properties p
    LEFT JOIN contacts c ON c.id = p.owner_contact_id
    LEFT JOIN property_images pi ON pi.property_id = p.id
    ${whereClause}
    GROUP BY p.id
  `;
}

function mapImageRow(req, row) {
  return {
    ...row,
    url: `${req.protocol}://${req.get("host")}/api/uploads/${row.relative_path}`,
  };
}

function getPropertyImages(req, propertyId) {
  const rows = db
    .prepare(
      `
      SELECT id, property_id, original_name, file_name, relative_path, created_at
      FROM property_images
      WHERE property_id = ?
      ORDER BY datetime(created_at) DESC
    `
    )
    .all(propertyId);

  return rows.map((row) => mapImageRow(req, row));
}

function listProperties(req, res) {
  const { q, listing_type, status, property_type, min_price, max_price, location } = req.query;
  const where = [];
  const params = {};

  if (q) {
    where.push("(p.title LIKE @q OR p.location LIKE @q OR p.property_type LIKE @q)");
    params.q = `%${q}%`;
  }
  if (listing_type) {
    where.push("p.listing_type = @listing_type");
    params.listing_type = listing_type;
  }
  if (status) {
    where.push("p.status = @status");
    params.status = status;
  }
  if (property_type) {
    where.push("p.property_type = @property_type");
    params.property_type = property_type;
  }
  if (location) {
    where.push("p.location LIKE @location");
    params.location = `%${location}%`;
  }
  if (min_price !== undefined && min_price !== "") {
    where.push("p.price >= @min_price");
    params.min_price = Number(min_price);
  }
  if (max_price !== undefined && max_price !== "") {
    where.push("p.price <= @max_price");
    params.max_price = Number(max_price);
  }

  const sql = `${buildPropertyQuery(where.length ? `WHERE ${where.join(" AND ")}` : "")}
    ORDER BY datetime(p.created_at) DESC
  `;

  const rows = db.prepare(sql).all(params);
  return res.json(rows);
}

function getProperty(req, res) {
  const id = Number(req.params.id);
  const property = db.prepare(buildPropertyQuery("WHERE p.id = ?")).get(id);

  if (!property) return notFound(res, "Property");

  const followUps = db
    .prepare(
      `
      SELECT f.*, c.full_name AS contact_name
      FROM follow_ups f
      JOIN contacts c ON c.id = f.contact_id
      WHERE f.property_id = ?
      ORDER BY date(f.due_date) ASC, datetime(f.created_at) DESC
    `
    )
    .all(id);

  const viewings = db
    .prepare(
      `
      SELECT v.*, c.full_name AS contact_name
      FROM viewings v
      JOIN contacts c ON c.id = v.contact_id
      WHERE v.property_id = ?
      ORDER BY date(v.viewing_date) DESC, time(v.viewing_time) DESC
    `
    )
    .all(id);

  return res.json({
    ...property,
    images: getPropertyImages(req, id),
    follow_ups: followUps,
    viewings,
  });
}

function validatePropertyPayload(body, errors) {
  validateRequiredString(body, "title", errors, "Title");
  validateRequiredString(body, "property_type", errors, "Property type");
  validateRequiredString(body, "listing_type", errors, "Listing type");
  validateRequiredString(body, "location", errors, "Location");

  validateEnum(body, "property_type", PROPERTY_TYPES, errors, "Property type");
  validateEnum(body, "listing_type", LISTING_TYPES, errors, "Listing type");
  validateEnum(body, "status", PROPERTY_STATUSES, errors, "Status");

  validateNumber(body, "price", errors, { min: 0 });
  validateInteger(body, "bedrooms", errors, { min: 0 });
  validateInteger(body, "bathrooms", errors, { min: 0 });
  validateNumber(body, "latitude", errors, { min: -90, max: 90 });
  validateNumber(body, "longitude", errors, { min: -180, max: 180 });

  const hasLatitude = body.latitude !== undefined && body.latitude !== null && body.latitude !== "";
  const hasLongitude = body.longitude !== undefined && body.longitude !== null && body.longitude !== "";
  if (hasLatitude !== hasLongitude) {
    errors.push("latitude and longitude must both be provided together");
  }
}

function ensureOwnerExists(ownerId) {
  if (ownerId === undefined || ownerId === null || ownerId === "") return true;
  return db.prepare("SELECT id FROM contacts WHERE id = ?").get(Number(ownerId));
}

function createProperty(req, res) {
  const errors = [];
  validatePropertyPayload(req.body, errors);
  if (errors.length) return badRequest(res, errors);

  const ownerExists = ensureOwnerExists(req.body.owner_contact_id);
  if (!ownerExists) return badRequest(res, "Owner contact does not exist");

  const stmt = db.prepare(`
    INSERT INTO properties (
      owner_contact_id, title, property_type, listing_type, location, latitude, longitude,
      location_notes, price, bedrooms, bathrooms, description, status, commission_notes,
      document_notes, created_at, updated_at
    )
    VALUES (
      @owner_contact_id, @title, @property_type, @listing_type, @location, @latitude, @longitude,
      @location_notes, @price, @bedrooms, @bathrooms, @description, @status, @commission_notes,
      @document_notes, datetime('now'), datetime('now')
    )
  `);

  const payload = {
    owner_contact_id: parseNullableInteger(req.body.owner_contact_id),
    title: req.body.title.trim(),
    property_type: req.body.property_type,
    listing_type: req.body.listing_type,
    location: req.body.location.trim(),
    latitude: parseNullableNumber(req.body.latitude),
    longitude: parseNullableNumber(req.body.longitude),
    location_notes: parseNullableString(req.body.location_notes),
    price: parseNullableNumber(req.body.price),
    bedrooms: parseNullableInteger(req.body.bedrooms),
    bathrooms: parseNullableInteger(req.body.bathrooms),
    description: parseNullableString(req.body.description),
    status: req.body.status || "Available",
    commission_notes: parseNullableString(req.body.commission_notes),
    document_notes: parseNullableString(req.body.document_notes),
  };

  const info = stmt.run(payload);
  const inserted = db.prepare("SELECT * FROM properties WHERE id = ?").get(info.lastInsertRowid);
  return res.status(201).json(inserted);
}

function updateProperty(req, res) {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT * FROM properties WHERE id = ?").get(id);
  if (!existing) return notFound(res, "Property");

  const errors = [];
  validatePropertyPayload(req.body, errors);
  if (errors.length) return badRequest(res, errors);

  const ownerExists = ensureOwnerExists(req.body.owner_contact_id);
  if (!ownerExists) return badRequest(res, "Owner contact does not exist");

  const stmt = db.prepare(`
    UPDATE properties
    SET
      owner_contact_id = @owner_contact_id,
      title = @title,
      property_type = @property_type,
      listing_type = @listing_type,
      location = @location,
      latitude = @latitude,
      longitude = @longitude,
      location_notes = @location_notes,
      price = @price,
      bedrooms = @bedrooms,
      bathrooms = @bathrooms,
      description = @description,
      status = @status,
      commission_notes = @commission_notes,
      document_notes = @document_notes,
      updated_at = datetime('now')
    WHERE id = @id
  `);

  stmt.run({
    id,
    owner_contact_id: parseNullableInteger(req.body.owner_contact_id),
    title: req.body.title.trim(),
    property_type: req.body.property_type,
    listing_type: req.body.listing_type,
    location: req.body.location.trim(),
    latitude: parseNullableNumber(req.body.latitude),
    longitude: parseNullableNumber(req.body.longitude),
    location_notes: parseNullableString(req.body.location_notes),
    price: parseNullableNumber(req.body.price),
    bedrooms: parseNullableInteger(req.body.bedrooms),
    bathrooms: parseNullableInteger(req.body.bathrooms),
    description: parseNullableString(req.body.description),
    status: req.body.status || "Available",
    commission_notes: parseNullableString(req.body.commission_notes),
    document_notes: parseNullableString(req.body.document_notes),
  });

  const updated = db.prepare("SELECT * FROM properties WHERE id = ?").get(id);
  return res.json(updated);
}

function deleteProperty(req, res) {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT id FROM properties WHERE id = ?").get(id);
  if (!existing) return notFound(res, "Property");

  const images = db
    .prepare("SELECT relative_path FROM property_images WHERE property_id = ?")
    .all(id);

  db.prepare("DELETE FROM properties WHERE id = ?").run(id);

  images.forEach((image) => {
    const filePath = path.join(propertyUploadsDir, path.basename(image.relative_path));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });

  return res.json({ message: "Property deleted" });
}

function getPropertyMatches(req, res) {
  const id = Number(req.params.id);
  const property = db.prepare("SELECT * FROM properties WHERE id = ?").get(id);
  if (!property) return notFound(res, "Property");

  const requirements = db
    .prepare(
      `
      SELECT r.*, c.full_name AS contact_name, c.phone AS contact_phone
      FROM requirements r
      JOIN contacts c ON c.id = r.contact_id
      WHERE r.status = 'Active'
    `
    )
    .all();

  const matches = requirements
    .map((reqRow) => {
      const result = getPropertyToRequirementMatch(property, reqRow);
      return {
        ...reqRow,
        match_score: result.score,
        is_match: result.is_match,
        criteria: result.criteria,
      };
    })
    .filter((m) => m.is_match)
    .sort((a, b) => b.match_score - a.match_score);

  return res.json({
    property,
    total_matches: matches.length,
    matches,
  });
}

function listPropertyImages(req, res) {
  const propertyId = Number(req.params.id);
  const property = db.prepare("SELECT id FROM properties WHERE id = ?").get(propertyId);
  if (!property) return notFound(res, "Property");

  return res.json(getPropertyImages(req, propertyId));
}

function uploadPropertyImages(req, res) {
  const propertyId = Number(req.params.id);
  const property = db.prepare("SELECT id FROM properties WHERE id = ?").get(propertyId);
  if (!property) return notFound(res, "Property");

  if (!req.files || !req.files.length) {
    return badRequest(res, "Please select one or more images to upload");
  }

  const insertStmt = db.prepare(`
    INSERT INTO property_images (property_id, original_name, file_name, relative_path, created_at)
    VALUES (@property_id, @original_name, @file_name, @relative_path, datetime('now'))
  `);

  const created = [];
  const transaction = db.transaction((files) => {
    files.forEach((file) => {
      const relativePath = `properties/${file.filename}`;
      const info = insertStmt.run({
        property_id: propertyId,
        original_name: file.originalname,
        file_name: file.filename,
        relative_path: relativePath,
      });

      const row = db
        .prepare(
          "SELECT id, property_id, original_name, file_name, relative_path, created_at FROM property_images WHERE id = ?"
        )
        .get(info.lastInsertRowid);

      created.push(mapImageRow(req, row));
    });
  });

  transaction(req.files);

  return res.status(201).json({
    message: "Images uploaded",
    images: created,
  });
}

function deletePropertyImage(req, res) {
  const propertyId = Number(req.params.id);
  const imageId = Number(req.params.imageId);

  const image = db
    .prepare(
      `
      SELECT id, relative_path
      FROM property_images
      WHERE id = ? AND property_id = ?
    `
    )
    .get(imageId, propertyId);

  if (!image) return notFound(res, "Property image");

  db.prepare("DELETE FROM property_images WHERE id = ?").run(imageId);

  const filePath = path.join(propertyUploadsDir, path.basename(image.relative_path));
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  return res.json({ message: "Property image deleted" });
}

module.exports = {
  listProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  getPropertyMatches,
  listPropertyImages,
  uploadPropertyImages,
  deletePropertyImage,
};
