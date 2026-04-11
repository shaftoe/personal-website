import type { CollectionEntry } from "astro:content"

/**
 * Shortens a string by removing words at the end until it fits within a certain length.
 */
export const getShortDescription = (content: string, maxLength = 20) => {
  const splitByWord = content.split(" ")
  const length = splitByWord.length
  return length > maxLength
    ? `${splitByWord.slice(0, maxLength).join(" ")}...`
    : content
}

/**
 * Formats a Date as "Mon 5, 2026".
 */
export const processArticleDate = (date: Date) => {
  const monthSmall = date.toLocaleString("default", { month: "short" })
  const day = date.getDate()
  const year = date.getFullYear()
  return `${monthSmall} ${day}, ${year}`
}

/**
 * Sorts blog articles by timestamp, newest first.
 */
export const sortArticlesByDate = (
  articles: CollectionEntry<"blog">[],
): CollectionEntry<"blog">[] =>
  articles.toSorted(
    (a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime(),
  )
