// Validates person names (letters, spaces, dots, hyphens, and apostrophes only - NO digits)
export const isValidName = (name) => {
  if (!name || typeof name !== "string") return false;
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 50) return false;
  // Disallow numbers / digits
  if (/\d/.test(trimmed)) return false;
  // Must match letters, spaces, dots, hyphens, apostrophes
  if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) return false;
  const letterCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
  return letterCount >= 2;
};

// Strips numbers and illegal symbols while typing in name fields
export const sanitizeNameInput = (value) => {
  if (!value) return "";
  return value.replace(/[^a-zA-Z\s.'-]/g, "").slice(0, 50);
};

// Validates 10-digit Indian mobile number (or 10-15 international digits)
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== "string") return false;
  const trimmed = phone.trim();
  const cleanDigits = trimmed.replace(/[\s\-+()]/g, "");
  if (!/^\d+$/.test(cleanDigits)) return false;
  if (cleanDigits.length === 10) {
    return /^[6-9]\d{9}$/.test(cleanDigits);
  }
  if (cleanDigits.length === 12 && cleanDigits.startsWith("91")) {
    return /^91[6-9]\d{9}$/.test(cleanDigits);
  }
  return cleanDigits.length >= 10 && cleanDigits.length <= 15;
};

// Strips non-digits while typing in phone fields (max 10 digits for standard mobile)
export const sanitizePhoneInput = (value) => {
  if (!value) return "";
  return value.replace(/\D/g, "").slice(0, 10);
};

// Validates email address format
export const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

// Validates username (3-30 chars, alphanumeric + underscores, at least 1 letter)
export const isValidUsername = (username) => {
  if (!username || typeof username !== "string") return false;
  const trimmed = username.trim();
  return /^[a-zA-Z0-9_]{3,30}$/.test(trimmed) && /[a-zA-Z]/.test(trimmed);
};

// Strips illegal characters while typing username
export const sanitizeUsernameInput = (value) => {
  if (!value) return "";
  return value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 30);
};
