import { Transform, TransformFnParams } from 'class-transformer';

/**
 * Trim whitespace from string inputs
 */
export const Trim = () =>
  Transform(({ value }: TransformFnParams) => {
    if (typeof value === 'string') {
      return value.trim();
    }
    return value;
  });

/**
 * Convert string to lowercase
 */
export const ToLowerCase = () =>
  Transform(({ value }: TransformFnParams) => {
    if (typeof value === 'string') {
      return value.toLowerCase();
    }
    return value;
  });

/**
 * Convert string to uppercase
 */
export const ToUpperCase = () =>
  Transform(({ value }: TransformFnParams) => {
    if (typeof value === 'string') {
      return value.toUpperCase();
    }
    return value;
  });

/**
 * Parse comma-separated string to array
 */
export const ToArray = () =>
  Transform(({ value }: TransformFnParams) => {
    if (typeof value === 'string') {
      return value.split(',').map(item => item.trim()).filter(Boolean);
    }
    if (Array.isArray(value)) {
      return value;
    }
    return [];
  });
