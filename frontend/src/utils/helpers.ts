// src/utils/helpers.ts
import clsx, { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge"; // Installe tailwind-merge si besoin

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
