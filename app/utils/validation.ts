// Validation utility functions for Shallot system

import { isValidSuiObjectId, isValidSuiAddress } from "@mysten/sui/utils";
import { VALIDATION } from "../constants";
import type {
  ForumValidationResult,
  JoinForumValidationResult,
  PollValidationResult,
  ValidationResult,
  ValidationError,
} from "../types";

// ===== Basic Input Validation =====

/**
 * Validate if string is not empty and within length limits
 */
export function validateStringLength(
  value: string,
  minLength: number,
  maxLength: number,
  fieldName: string = 'Field'
): ValidationError | null {
  if (!value || value.trim().length === 0) {
    return {
      field: fieldName.toLowerCase(),
      message: `${fieldName} is required`,
    };
  }
  
  const trimmed = value.trim();
  
  if (trimmed.length < minLength) {
    return {
      field: fieldName.toLowerCase(),
      message: `${fieldName} must be at least ${minLength} characters long`,
    };
  }
  
  if (trimmed.length > maxLength) {
    return {
      field: fieldName.toLowerCase(),
      message: `${fieldName} must be no more than ${maxLength} characters long`,
    };
  }
  
  return null;
}

/**
 * Validate email format (if needed for future features)
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ===== Sui-specific Validation =====

/**
 * Validate Sui object ID
 */
export function validateObjectId(objectId: string): ValidationError | null {
  if (!objectId || objectId.trim().length === 0) {
    return {
      field: 'objectId',
      message: 'Object ID is required',
    };
  }
  
  if (!isValidSuiObjectId(objectId)) {
    return {
      field: 'objectId',
      message: 'Invalid Sui object ID format',
    };
  }
  
  return null;
}

/**
 * Validate Sui address
 */
export function validateAddress(address: string): ValidationError | null {
  if (!address || address.trim().length === 0) {
    return {
      field: 'address',
      message: 'Address is required',
    };
  }
  
  if (!isValidSuiAddress(address)) {
    return {
      field: 'address',
      message: 'Invalid Sui address format',
    };
  }
  
  return null;
}

// ===== Forum Validation =====

/**
 * Validate forum name
 */
export function validateForumName(name: string): ValidationError | null {
  return validateStringLength(
    name,
    VALIDATION.MIN_FORUM_NAME_LENGTH,
    VALIDATION.MAX_FORUM_NAME_LENGTH,
    'Forum name'
  );
}

/**
 * Validate forum description
 */
export function validateForumDescription(description: string): ValidationError | null {
  // Description can be empty, but if provided, must be within limits
  if (!description) return null;
  
  return validateStringLength(
    description,
    VALIDATION.MIN_DESCRIPTION_LENGTH,
    VALIDATION.MAX_DESCRIPTION_LENGTH,
    'Description'
  );
}

/**
 * Validate forum password
 */
export function validatePassword(password: string): ValidationError | null {
  return validateStringLength(
    password,
    VALIDATION.MIN_PASSWORD_LENGTH,
    VALIDATION.MAX_PASSWORD_LENGTH,
    'Password'
  );
}

/**
 * Validate complete forum creation form
 */
export function validateCreateForumForm(data: {
  name: string;
  description: string;
  password: string;
}): ForumValidationResult {
  const errors: Record<string, string> = {};
  
  const nameError = validateForumName(data.name);
  if (nameError) {
    errors.name = nameError.message;
  }
  
  const descError = validateForumDescription(data.description);
  if (descError) {
    errors.description = descError.message;
  }
  
  const passwordError = validatePassword(data.password);
  if (passwordError) {
    errors.password = passwordError.message;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// ===== Membership Validation =====

/**
 * Validate join forum form
 */
export function validateJoinForumForm(data: {
  password: string;
}): JoinForumValidationResult {
  const errors: Record<string, string> = {};
  
  const passwordError = validatePassword(data.password);
  if (passwordError) {
    errors.password = passwordError.message;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// ===== Poll Validation =====

/**
 * Validate poll title
 */
export function validatePollTitle(title: string): ValidationError | null {
  return validateStringLength(
    title,
    VALIDATION.MIN_FORUM_NAME_LENGTH, // Reuse forum name validation
    VALIDATION.MAX_FORUM_NAME_LENGTH,
    'Poll title'
  );
}

/**
 * Validate poll description
 */
export function validatePollDescription(description: string): ValidationError | null {
  return validateStringLength(
    description,
    VALIDATION.MIN_DESCRIPTION_LENGTH,
    VALIDATION.MAX_DESCRIPTION_LENGTH,
    'Poll description'
  );
}

/**
 * Validate poll duration
 */
export function validatePollDuration(durationMs: number): ValidationError | null {
  if (!durationMs || durationMs <= 0) {
    return {
      field: 'duration',
      message: 'Poll duration is required',
    };
  }
  
  if (durationMs < VALIDATION.MIN_POLL_DURATION) {
    return {
      field: 'duration',
      message: `Poll duration must be at least ${VALIDATION.MIN_POLL_DURATION / 60000} minutes`,
    };
  }
  
  if (durationMs > VALIDATION.MAX_POLL_DURATION) {
    const maxDays = VALIDATION.MAX_POLL_DURATION / (24 * 60 * 60 * 1000);
    return {
      field: 'duration',
      message: `Poll duration must be no more than ${maxDays} days`,
    };
  }
  
  return null;
}

/**
 * Validate proposed forum name (for polls)
 */
export function validateProposedName(name: string): ValidationError | null {
  return validateStringLength(
    name,
    VALIDATION.MIN_FORUM_NAME_LENGTH,
    VALIDATION.MAX_FORUM_NAME_LENGTH,
    'Proposed name'
  );
}

/**
 * Validate proposed forum description (for polls)
 */
export function validateProposedDescription(description: string): ValidationError | null {
  return validateStringLength(
    description,
    VALIDATION.MIN_DESCRIPTION_LENGTH,
    VALIDATION.MAX_DESCRIPTION_LENGTH,
    'Proposed description'
  );
}

/**
 * Validate complete poll creation form
 */
export function validateCreatePollForm(data: {
  title: string;
  description: string;
  proposedName: string;
  proposedDescription: string;
  duration: number; // in hours
}): PollValidationResult {
  const errors: Record<string, string> = {};
  
  const titleError = validatePollTitle(data.title);
  if (titleError) {
    errors.title = titleError.message;
  }
  
  const descError = validatePollDescription(data.description);
  if (descError) {
    errors.description = descError.message;
  }
  
  const nameError = validateProposedName(data.proposedName);
  if (nameError) {
    errors.proposedName = nameError.message;
  }
  
  const propDescError = validateProposedDescription(data.proposedDescription);
  if (propDescError) {
    errors.proposedDescription = propDescError.message;
  }
  
  // Convert hours to milliseconds for validation
  const durationMs = data.duration * 60 * 60 * 1000;
  const durationError = validatePollDuration(durationMs);
  if (durationError) {
    errors.duration = durationError.message;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// ===== Time and Date Validation =====

/**
 * Validate timestamp is in the future
 */
export function validateFutureTimestamp(timestamp: number): ValidationError | null {
  if (!timestamp || timestamp <= 0) {
    return {
      field: 'timestamp',
      message: 'Timestamp is required',
    };
  }
  
  if (timestamp <= Date.now()) {
    return {
      field: 'timestamp',
      message: 'Timestamp must be in the future',
    };
  }
  
  return null;
}

/**
 * Validate timestamp is in the past
 */
export function validatePastTimestamp(timestamp: number): ValidationError | null {
  if (!timestamp || timestamp <= 0) {
    return {
      field: 'timestamp',
      message: 'Timestamp is required',
    };
  }
  
  if (timestamp >= Date.now()) {
    return {
      field: 'timestamp',
      message: 'Timestamp must be in the past',
    };
  }
  
  return null;
}

// ===== Number Validation =====

/**
 * Validate positive integer
 */
export function validatePositiveInteger(
  value: number,
  fieldName: string = 'Value'
): ValidationError | null {
  if (typeof value !== 'number' || isNaN(value)) {
    return {
      field: fieldName.toLowerCase(),
      message: `${fieldName} must be a valid number`,
    };
  }
  
  if (value < 0) {
    return {
      field: fieldName.toLowerCase(),
      message: `${fieldName} must be positive`,
    };
  }
  
  if (!Number.isInteger(value)) {
    return {
      field: fieldName.toLowerCase(),
      message: `${fieldName} must be a whole number`,
    };
  }
  
  return null;
}

/**
 * Validate number within range
 */
export function validateNumberRange(
  value: number,
  min: number,
  max: number,
  fieldName: string = 'Value'
): ValidationError | null {
  if (typeof value !== 'number' || isNaN(value)) {
    return {
      field: fieldName.toLowerCase(),
      message: `${fieldName} must be a valid number`,
    };
  }
  
  if (value < min) {
    return {
      field: fieldName.toLowerCase(),
      message: `${fieldName} must be at least ${min}`,
    };
  }
  
  if (value > max) {
    return {
      field: fieldName.toLowerCase(),
      message: `${fieldName} must be no more than ${max}`,
    };
  }
  
  return null;
}

// ===== Utility Validation Functions =====

/**
 * Check if string contains only alphanumeric characters and spaces
 */
export function isAlphanumericWithSpaces(text: string): boolean {
  if (!text) return false;
  return /^[a-zA-Z0-9\s]+$/.test(text);
}

/**
 * Check if string contains only safe characters (no special chars that could cause issues)
 */
export function isSafeText(text: string): boolean {
  if (!text) return false;
  // Allow alphanumeric, spaces, and common punctuation
  return /^[a-zA-Z0-9\s.,!?()-]+$/.test(text);
}

/**
 * Validate array is not empty
 */
export function validateNonEmptyArray<T>(
  array: T[],
  fieldName: string = 'Array'
): ValidationError | null {
  if (!Array.isArray(array) || array.length === 0) {
    return {
      field: fieldName.toLowerCase(),
      message: `${fieldName} cannot be empty`,
    };
  }
  
  return null;
}

/**
 * Batch validate multiple fields
 */
export function batchValidate(
  validations: (() => ValidationError | null)[]
): ValidationResult {
  const errors: ValidationError[] = [];
  
  for (const validate of validations) {
    const error = validate();
    if (error) {
      errors.push(error);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ===== Security Validation =====

/**
 * Basic XSS prevention - check for potentially dangerous characters
 */
export function validateSafeHtml(text: string): ValidationError | null {
  if (!text) return null;
  
  const dangerousChars = /<script|<iframe|javascript:|data:|vbscript:/i;
  
  if (dangerousChars.test(text)) {
    return {
      field: 'content',
      message: 'Content contains potentially unsafe characters',
    };
  }
  
  return null;
}

/**
 * Validate password strength (basic)
 */
export function validatePasswordStrength(password: string): {
  score: number; // 0-4
  feedback: string[];
} {
  if (!password) {
    return {
      score: 0,
      feedback: ['Password is required'],
    };
  }
  
  const feedback: string[] = [];
  let score = 0;
  
  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Use at least 8 characters');
  }
  
  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include lowercase letters');
  }
  
  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include uppercase letters');
  }
  
  // Number check
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include numbers');
  }
  
  // Special character check
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include special characters');
  }
  
  // Cap score at 4
  score = Math.min(score, 4);
  
  if (score >= 3) {
    feedback.length = 0; // Clear feedback for strong passwords
    feedback.push('Strong password');
  }
  
  return { score, feedback };
}