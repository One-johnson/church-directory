/**
 * Professional categories for the UD Professionals Directory
 * Centralized category list used across the application
 */

export const CATEGORIES = [
  "Healthcare",
  "Engineering",
  "Education",
  "IT",
  "Business Finance",
  "Legal",
  "Trades Construction",
  "Creative Media",
  "Sales Marketing",
  "Hospitality Tourism",
  "Nonprofit Social work",
  "Public Service",
] as const;

export type Category = typeof CATEGORIES[number];

/**
 * Get all available categories
 */
export function getCategories(): readonly string[] {
  return CATEGORIES;
}

/**
 * Get category options for select components
 */
export function getCategoryOptions(): Array<{ value: string; label: string }> {
  return CATEGORIES.map((category) => ({
    value: category,
    label: category,
  }));
}
