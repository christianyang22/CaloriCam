import { regexSoloLetras } from '../config/constants';

export function validatePassword(password) {
  return {
    isLengthValid: password.length >= 8,
    hasUpperLower: /[A-Z]/.test(password) && /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[^A-Za-z0-9]/.test(password),
  };
}

export function isStrongPassword(password) {
  const rules = validatePassword(password);
  return Object.values(rules).every(Boolean);
}

export function isValidName(value, required = true) {
  const normalized = value.trim();
  return (!required && normalized === '') || (normalized !== '' && regexSoloLetras.test(normalized));
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
