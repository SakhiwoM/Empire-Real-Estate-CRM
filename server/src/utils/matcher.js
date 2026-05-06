function normalize(text) {
  return String(text || "")
    .trim()
    .toLowerCase();
}

function matchesLocation(requirementLocation, propertyLocation) {
  const preferred = normalize(requirementLocation);
  const actual = normalize(propertyLocation);
  if (!preferred) return true;
  if (!actual) return false;
  return actual.includes(preferred) || preferred.includes(actual);
}

function listingMatchesPurpose(purpose, listingType) {
  if (!purpose || !listingType) return false;
  if (purpose === "Buy") return listingType === "Sale" || listingType === "Both";
  if (purpose === "Rent") return listingType === "Rent" || listingType === "Both";
  return false;
}

function requirementPurposeMatchesListing(purpose, listingType) {
  return listingMatchesPurpose(purpose, listingType);
}

function budgetMatches(minBudget, maxBudget, price) {
  if (price === null || price === undefined) return false;

  const hasMin = minBudget !== null && minBudget !== undefined;
  const hasMax = maxBudget !== null && maxBudget !== undefined;

  if (!hasMin && !hasMax) return true;
  if (hasMin && price < Number(minBudget)) return false;
  if (hasMax && price > Number(maxBudget)) return false;
  return true;
}

function bedroomsMatch(requiredBedrooms, propertyBedrooms) {
  if (requiredBedrooms === null || requiredBedrooms === undefined) return true;
  if (propertyBedrooms === null || propertyBedrooms === undefined) return false;
  return Number(propertyBedrooms) >= Number(requiredBedrooms);
}

function bathroomsMatch(requiredBathrooms, propertyBathrooms) {
  if (requiredBathrooms === null || requiredBathrooms === undefined) return true;
  if (propertyBathrooms === null || propertyBathrooms === undefined) return false;
  return Number(propertyBathrooms) >= Number(requiredBathrooms);
}

function computeScore(criteria) {
  const applicable = criteria.filter((c) => c.applicable);
  if (applicable.length === 0) return 0;

  const matched = applicable.filter((c) => c.matched).length;
  return Math.round((matched / applicable.length) * 100);
}

function getRequirementToPropertyMatch(requirement, property) {
  const criteria = [
    {
      key: "listing_type",
      label: "Listing type",
      applicable: true,
      matched: listingMatchesPurpose(requirement.purpose, property.listing_type),
      required: true,
    },
    {
      key: "property_type",
      label: "Property type",
      applicable: true,
      matched: normalize(requirement.property_type) === normalize(property.property_type),
      required: true,
    },
    {
      key: "location",
      label: "Location",
      applicable: !!normalize(requirement.preferred_location),
      matched: matchesLocation(requirement.preferred_location, property.location),
      required: false,
    },
    {
      key: "budget",
      label: "Budget",
      applicable: requirement.min_budget !== null || requirement.max_budget !== null,
      matched: budgetMatches(requirement.min_budget, requirement.max_budget, property.price),
      required: false,
    },
    {
      key: "bedrooms",
      label: "Bedrooms",
      applicable: requirement.bedrooms !== null && requirement.bedrooms !== undefined,
      matched: bedroomsMatch(requirement.bedrooms, property.bedrooms),
      required: false,
    },
    {
      key: "bathrooms",
      label: "Bathrooms",
      applicable: requirement.bathrooms !== null && requirement.bathrooms !== undefined,
      matched: bathroomsMatch(requirement.bathrooms, property.bathrooms),
      required: false,
    },
  ];

  const requiredPass = criteria.filter((c) => c.required).every((c) => c.matched);
  const statusPass = property.status === "Available";
  const score = computeScore(criteria);

  return {
    is_match: requiredPass && statusPass,
    status_pass: statusPass,
    score,
    criteria,
  };
}

function getPropertyToRequirementMatch(property, requirement) {
  const criteria = [
    {
      key: "purpose",
      label: "Purpose/listing",
      applicable: true,
      matched: requirementPurposeMatchesListing(requirement.purpose, property.listing_type),
      required: true,
    },
    {
      key: "property_type",
      label: "Property type",
      applicable: true,
      matched: normalize(requirement.property_type) === normalize(property.property_type),
      required: true,
    },
    {
      key: "location",
      label: "Location",
      applicable: !!normalize(requirement.preferred_location),
      matched: matchesLocation(requirement.preferred_location, property.location),
      required: false,
    },
    {
      key: "budget",
      label: "Budget",
      applicable: requirement.min_budget !== null || requirement.max_budget !== null,
      matched: budgetMatches(requirement.min_budget, requirement.max_budget, property.price),
      required: false,
    },
    {
      key: "bedrooms",
      label: "Bedrooms",
      applicable: requirement.bedrooms !== null && requirement.bedrooms !== undefined,
      matched: bedroomsMatch(requirement.bedrooms, property.bedrooms),
      required: false,
    },
    {
      key: "bathrooms",
      label: "Bathrooms",
      applicable: requirement.bathrooms !== null && requirement.bathrooms !== undefined,
      matched: bathroomsMatch(requirement.bathrooms, property.bathrooms),
      required: false,
    },
  ];

  const requiredPass = criteria.filter((c) => c.required).every((c) => c.matched);
  const statusPass = requirement.status === "Active";
  const score = computeScore(criteria);

  return {
    is_match: requiredPass && statusPass,
    status_pass: statusPass,
    score,
    criteria,
  };
}

module.exports = {
  getRequirementToPropertyMatch,
  getPropertyToRequirementMatch,
};
