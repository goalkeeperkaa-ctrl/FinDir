import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: any) => {
  // Handle null, undefined, NaN, or non-numeric values
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (numAmount === null || numAmount === undefined || isNaN(numAmount)) {
    return '0 ₽';
  }

  try {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0,
    }).format(numAmount);
  } catch (error) {
    return '0 ₽';
  }
};
