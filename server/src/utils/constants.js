const CONTACT_TYPES = ["Buyer", "Seller", "Tenant", "Landlord", "Investor", "Other"];
const CONTACT_STATUSES = [
  "New Lead",
  "Contacted",
  "Interested",
  "Viewing Scheduled",
  "Negotiating",
  "Closed",
  "Lost",
  "Inactive",
];

const PURPOSES = ["Buy", "Rent"];
const PROPERTY_TYPES = ["House", "Apartment", "Land", "Commercial", "Office", "Shop", "Other"];
const REQUIREMENT_URGENCY = ["Low", "Medium", "High"];
const REQUIREMENT_STATUS = ["Active", "Paused", "Fulfilled", "Cancelled"];

const LISTING_TYPES = ["Sale", "Rent", "Both"];
const PROPERTY_STATUSES = ["Available", "Under Offer", "Rented", "Sold", "Unavailable"];

const FOLLOW_UP_PRIORITIES = ["Low", "Medium", "High"];
const FOLLOW_UP_STATUS = ["Pending", "Completed", "Cancelled"];

const VIEWING_STATUS = ["Scheduled", "Completed", "Cancelled", "No Show"];

module.exports = {
  CONTACT_TYPES,
  CONTACT_STATUSES,
  PURPOSES,
  PROPERTY_TYPES,
  REQUIREMENT_URGENCY,
  REQUIREMENT_STATUS,
  LISTING_TYPES,
  PROPERTY_STATUSES,
  FOLLOW_UP_PRIORITIES,
  FOLLOW_UP_STATUS,
  VIEWING_STATUS,
};
