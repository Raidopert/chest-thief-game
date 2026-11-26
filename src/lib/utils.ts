import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { BASE_PATH } from "@/lib/base-path-generated"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Строит абсолютный URL к статическому ассету (картинке) с учётом basePath.
 * Используется для CSS background-image: url(...) — относительные пути
 * ломаются когда edge-сервер (Vercel/Cloudflare) убирает trailing slash
 * у URL страницы, поэтому все пути к картинкам должны быть абсолютными.
 *
 * Пример: assetUrl("bg/thief-new.png") → "/chest-thief/bg/thief-new.png"
 */
export function assetUrl(path: string): string {
  // Убираем ведущий слеш у path, если есть — добавим сами
  const cleanPath = path.startsWith("/") ? path.slice(1) : path
  return `${BASE_PATH}/${cleanPath}`
}

