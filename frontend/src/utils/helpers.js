function normalizeDateOnly(value) {
  const parsedDate = new Date(value);
  parsedDate.setHours(0, 0, 0, 0);
  return parsedDate;
}

// Returns how many days until expiry (negative = already expired)
export function getDaysLeft(expiryDate) {
  const today = normalizeDateOnly(new Date());
  const normalizedExpiryDate = normalizeDateOnly(expiryDate);
  return Math.floor((normalizedExpiryDate - today) / 86400000);
}

// Returns today as YYYY-MM-DD string
export function today() {
  return new Date().toISOString().split("T")[0];
}

// Returns a date string N days from a base date
export function addDaysToDate(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}
