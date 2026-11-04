import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** GitHub Pages gibi alt yolda (/depo-adi) yayınlandığında düz <a href> ve paylaşım linkleri için ön ek. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ""

export function withBase(path: string) {
  return `${BASE_PATH}${path}`
}
