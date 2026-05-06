function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateRequiredString(body, fieldName, errors, label = fieldName) {
  if (!isNonEmptyString(body[fieldName])) {
    errors.push(`${label} is required`);
  }
}

function validateEnum(body, fieldName, allowedValues, errors, label = fieldName) {
  if (body[fieldName] !== undefined && !allowedValues.includes(body[fieldName])) {
    errors.push(`${label} must be one of: ${allowedValues.join(", ")}`);
  }
}

function validateNumber(body, fieldName, errors, opts = {}) {
  const value = body[fieldName];
  if (value === undefined || value === null || value === "") {
    return;
  }

  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    errors.push(`${fieldName} must be a valid number`);
    return;
  }

  if (opts.min !== undefined && numeric < opts.min) {
    errors.push(`${fieldName} must be at least ${opts.min}`);
  }
  if (opts.max !== undefined && numeric > opts.max) {
    errors.push(`${fieldName} must be at most ${opts.max}`);
  }
}

function validateInteger(body, fieldName, errors, opts = {}) {
  const value = body[fieldName];
  if (value === undefined || value === null || value === "") {
    return;
  }

  const numeric = Number(value);
  if (!Number.isInteger(numeric)) {
    errors.push(`${fieldName} must be an integer`);
    return;
  }

  if (opts.min !== undefined && numeric < opts.min) {
    errors.push(`${fieldName} must be at least ${opts.min}`);
  }
}

function parseNullableNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const numeric = Number(value);
  return Number.isNaN(numeric) ? null : numeric;
}

function parseNullableInteger(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const numeric = Number(value);
  return Number.isNaN(numeric) ? null : Math.trunc(numeric);
}

function parseNullableString(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const text = String(value).trim();
  return text.length === 0 ? null : text;
}

module.exports = {
  isNonEmptyString,
  validateRequiredString,
  validateEnum,
  validateNumber,
  validateInteger,
  parseNullableNumber,
  parseNullableInteger,
  parseNullableString,
};
