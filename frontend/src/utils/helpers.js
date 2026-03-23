// Returns "VALID" | "EXPIRING" | "EXPIRED"
export function getStatus(expiryDate) {
  const days = getDaysLeft(expiryDate);
  if (days < 0)   return "EXPIRED";
  if (days <= 90) return "EXPIRING";
  return "VALID";
}

// Returns how many days until expiry (negative = already expired)
export function getDaysLeft(expiryDate) {
  return Math.floor((new Date(expiryDate) - new Date()) / 86400000);
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