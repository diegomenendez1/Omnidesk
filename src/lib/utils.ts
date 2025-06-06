
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getISOWeek, getISOWeekYear, startOfISOWeek, endOfISOWeek, eachWeekOfInterval, formatISO } from 'date-fns';


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
  if (endDate < startDate) return 0;

  // Normalize times to midnight to avoid timezone issues
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  // Total days including start and end
  const totalDays = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;

  // Full weeks contribute 5 business days each
  const fullWeeks = Math.floor(totalDays / 7);
  let businessDays = fullWeeks * 5;

  // Handle remaining days after full weeks
  const remainingDays = totalDays % 7;
  let dayOfWeek = start.getDay();
  for (let i = 0; i < remainingDays; i++) {
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      businessDays++;
    }
    dayOfWeek = (dayOfWeek + 1) % 7;
  }

  return businessDays;
}

/**
 * Gets a week identifier string (e.g., "2023-W40") for a given date.
 * Uses ISO week date standard.
 * @param date The date.
 * @returns The week identifier string.
 */
export function getWeekIdentifier(date: Date): string {
  const year = getISOWeekYear(date);
  const week = getISOWeek(date);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/**
 * Gets an array of week identifier strings within a given date interval.
 * @param startDate The start of the interval.
 * @param endDate The end of the interval.
 * @returns An array of week identifier strings.
 */
export function getWeeksInRange(startDate: Date, endDate: Date): string[] {
  if (startDate > endDate) return [];
  const weeks = eachWeekOfInterval(
    { start: startDate, end: endDate },
    { weekStartsOn: 1 } // Monday
  );
  return weeks.map(getWeekIdentifier);
}

/**
 * Gets the start date of an ISO week.
 * @param year The ISO week year.
 * @param week The ISO week number.
 * @returns The start date of the week.
 */
export function getStartOfISOWeek(year: number, week: number): Date {
    // Simple approximation: this might need a more robust library for perfect ISO week date conversion
    // For date-fns, you'd use parseISO or construct from year and then setISOWeek.
    // This is a simplified version. For production, use date-fns's setISOWeek and startOfISOWeek.
    const d = new Date(year, 0, 1 + (week - 1) * 7);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
}

/**
 * Gets the end date of an ISO week.
 * @param year The ISO week year.
 * @param week The ISO week number.
 * @returns The end date of the week.
 */
export function getEndOfISOWeek(year: number, week: number): Date {
    const startDate = getStartOfISOWeek(year, week);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    return endDate;
}

export function parseWeekIdentifier(weekIdentifier: string): { year: number; week: number; startOfWeek: Date; endOfWeek: Date } {
  const [year, week] = weekIdentifier.split('-W').map(Number);
  const startOfWeek = getStartOfISOWeek(year, week);
  const endOfWeek = getEndOfISOWeek(year, week);
  
  return {
    year,
    week,
    startOfWeek,
    endOfWeek
  };
}

/**
 * Calculates task statistics for chart display
 * @param tasks Array of tasks to analyze
 * @param groupBy Field to group tasks by (default: 'status')
 * @returns Array of chart data objects with name and value
 */
export function calculateTaskStats(
  tasks: any[],
  groupBy: string = 'status'
): Array<{ name: string; value: number }> {
  if (!tasks || tasks.length === 0) return [];

  // Group tasks by the specified field
  const grouped = tasks.reduce((acc, task) => {
    const key = task[groupBy] || 'Unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Convert to array of { name, value } objects
  return Object.entries(grouped).map(([name, value]) => ({
    name,
    value: value as number
  }));
}

