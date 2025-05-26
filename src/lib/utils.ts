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
