/**
 * Validation utilities
 */

export interface ValidationRule {
	validate: (value: unknown) => boolean;
	message: string;
}

export interface ValidationResult {
	isValid: boolean;
	errors: string[];
}

/**
 * Validates a value against multiple rules
 */
export function validate(value: unknown, rules: ValidationRule[]): ValidationResult {
	const errors: string[] = [];

	for (const rule of rules) {
		if (!rule.validate(value)) {
			errors.push(rule.message);
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

/**
 * Common validation rules
 */
export const validators = {
	required: (message = 'This field is required'): ValidationRule => ({
		validate: (value) => {
			if (value === null || value === undefined) return false;
			if (typeof value === 'string') return value.trim().length > 0;
			return true;
		},
		message,
	}),

	minLength: (min: number, message?: string): ValidationRule => ({
		validate: (value) => {
			if (typeof value !== 'string') return false;
			return value.length >= min;
		},
		message: message || `Must be at least ${min} characters`,
	}),

	maxLength: (max: number, message?: string): ValidationRule => ({
		validate: (value) => {
			if (typeof value !== 'string') return false;
			return value.length <= max;
		},
		message: message || `Must be at most ${max} characters`,
	}),

	email: (message = 'Invalid email address'): ValidationRule => ({
		validate: (value) => {
			if (typeof value !== 'string') return false;
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			return emailRegex.test(value);
		},
		message,
	}),

	url: (message = 'Invalid URL'): ValidationRule => ({
		validate: (value) => {
			if (typeof value !== 'string') return false;
			try {
				new URL(value);
				return true;
			} catch {
				return false;
			}
		},
		message,
	}),

	pattern: (regex: RegExp, message: string): ValidationRule => ({
		validate: (value) => {
			if (typeof value !== 'string') return false;
			return regex.test(value);
		},
		message,
	}),

	min: (min: number, message?: string): ValidationRule => ({
		validate: (value) => {
			const num = Number(value);
			return !isNaN(num) && num >= min;
		},
		message: message || `Must be at least ${min}`,
	}),

	max: (max: number, message?: string): ValidationRule => ({
		validate: (value) => {
			const num = Number(value);
			return !isNaN(num) && num <= max;
		},
		message: message || `Must be at most ${max}`,
	}),
};


