import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  } catch (error) {
    console.error("Error formatting currency:", error);
    // Fallback for environments where Intl might not be fully supported or for invalid values
    return typeof value === 'number' ? `$${value.toFixed(2)}` : 'N/A';
  }
}

/**
 * Checks if a given date is a business day (Monday to Friday).
 * @param date The date to check.
 * @returns True if the date is a business day, false otherwise.
 */
export function isBusinessDay(date: Date): boolean {
  const day = date.getDay(); // Sunday - Saturday : 0 - 6
  return day >= 1 && day <= 5; // Monday to Friday
}

/**
 * Calculates the number of business days (Monday to Friday) between two dates, inclusive of start and end if they are business days.
 * @param startDate The start date.
 * @param endDate The end date.
 * @returns The number of business days.
 */
export function calculateBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const currentDate = new Date(startDate.valueOf());

  if (endDate < startDate) return 0;

  while (currentDate <= endDate) {
    if (isBusinessDay(currentDate)) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return count;
}