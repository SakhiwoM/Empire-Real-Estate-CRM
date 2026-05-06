const { db } = require("../db/database");

function getReports(req, res) {
  const contactsByType = db
    .prepare(
      `
      SELECT contact_type AS label, COUNT(*) AS count
      FROM contacts
      GROUP BY contact_type
      ORDER BY count DESC
    `
    )
    .all();

  const propertiesByStatus = db
    .prepare(
      `
      SELECT status AS label, COUNT(*) AS count
      FROM properties
      GROUP BY status
      ORDER BY count DESC
    `
    )
    .all();

  const propertiesByListingType = db
    .prepare(
      `
      SELECT listing_type AS label, COUNT(*) AS count
      FROM properties
      GROUP BY listing_type
      ORDER BY count DESC
    `
    )
    .all();

  const followUpsByStatus = db
    .prepare(
      `
      SELECT status AS label, COUNT(*) AS count
      FROM follow_ups
      GROUP BY status
      ORDER BY count DESC
    `
    )
    .all();

  res.json({
    contacts_by_type: contactsByType,
    properties_by_status: propertiesByStatus,
    properties_by_listing_type: propertiesByListingType,
    follow_ups_by_status: followUpsByStatus,
    deals: {
      ready_for_future_module: true,
      note: "Deals report structure placeholder for v2.",
    },
  });
}

module.exports = { getReports };
