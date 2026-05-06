const { db } = require("../db/database");

function getDashboard(req, res) {
  const summary = db
    .prepare(
      `
      SELECT
        COUNT(*) AS total_contacts,
        SUM(CASE WHEN contact_type = 'Buyer' THEN 1 ELSE 0 END) AS total_buyers,
        SUM(CASE WHEN contact_type = 'Seller' THEN 1 ELSE 0 END) AS total_sellers,
        SUM(CASE WHEN contact_type = 'Tenant' THEN 1 ELSE 0 END) AS total_tenants,
        SUM(CASE WHEN contact_type = 'Landlord' THEN 1 ELSE 0 END) AS total_landlords
      FROM contacts
    `
    )
    .get();

  const propertySummary = db
    .prepare(
      `
      SELECT
        COUNT(*) AS total_properties,
        SUM(CASE WHEN status = 'Available' AND listing_type IN ('Rent', 'Both') THEN 1 ELSE 0 END) AS available_rentals,
        SUM(CASE WHEN status = 'Available' AND listing_type IN ('Sale', 'Both') THEN 1 ELSE 0 END) AS available_for_sale
      FROM properties
    `
    )
    .get();

  const followUpSummary = db
    .prepare(
      `
      SELECT
        SUM(CASE WHEN status = 'Pending' AND date(due_date) = date('now', 'localtime') THEN 1 ELSE 0 END) AS follow_ups_due_today,
        SUM(CASE WHEN status = 'Pending' AND date(due_date) < date('now', 'localtime') THEN 1 ELSE 0 END) AS overdue_follow_ups
      FROM follow_ups
    `
    )
    .get();

  const upcomingViewings = db
    .prepare(
      `
      SELECT
        v.id,
        v.viewing_date,
        v.viewing_time,
        v.status,
        c.full_name AS contact_name,
        p.title AS property_title,
        v.location
      FROM viewings v
      JOIN contacts c ON c.id = v.contact_id
      JOIN properties p ON p.id = v.property_id
      WHERE v.status = 'Scheduled'
        AND date(v.viewing_date) >= date('now', 'localtime')
      ORDER BY date(v.viewing_date) ASC, time(v.viewing_time) ASC
      LIMIT 10
    `
    )
    .all();

  res.json({
    ...summary,
    ...propertySummary,
    ...followUpSummary,
    upcoming_viewings_count: upcomingViewings.length,
    upcoming_viewings: upcomingViewings,
  });
}

module.exports = { getDashboard };
