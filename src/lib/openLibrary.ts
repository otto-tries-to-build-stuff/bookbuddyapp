/**
 * openLibrary.ts — Open Library API Integration
 *
 * This file handles searching for books using the Open Library API
 * (a free, public book database). When a user types a book title in
 * the search box, this code fetches matching results.
 *
 * Open Library provides:
 * - Book titles and authors
 * - Cover image IDs (which we convert to image URLs)
 * - Publication years
 *
 * API docs: https://openlibrary.org/dev/docs/api/search
 */

// Define what a search result looks like
export interface OpenLibraryBook {
  title: string;
  author: string;
  coverId: number | null;          // Used to build a cover image URL
  firstPublishYear: number | null;
  editionKey: string | null;       // Unique edition identifier
}

/**
 * Search Open Library for books matching a query string.
 *
 * @param query - The search text (e.g. "atomic habits")
 * @returns An array of matching books, sorted by relevance
 */
export async function searchOpenLibrary(query: string): Promise<OpenLibraryBook[]> {
  // Don't search if the query is too short
  if (!query || query.length < 2) return [];

  // Build the API URL with the search query
  // encodeURIComponent makes the query URL-safe (handles spaces, special characters)
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=60&fields=title,author_name,cover_i,first_publish_year,edition_key`;

  const resp = await fetch(url);
  if (!resp.ok) return [];  // If the API fails, return empty results

  const data = await resp.json();

  // Transform the API response into our OpenLibraryBook format
  // The API returns fields like "author_name" (array) and "cover_i" (number)
  // which we map to our cleaner interface
  const books: OpenLibraryBook[] = (data.docs || []).map((doc: any) => ({
    title: doc.title || "",
    author: doc.author_name?.[0] || "Unknown",  // Take first author only
    coverId: doc.cover_i ?? null,
    firstPublishYear: doc.first_publish_year ?? null,
    editionKey: doc.edition_key?.[0] ?? null,
  }));

  // Sort results by relevance to the search query
  // Priority: exact match > starts with query > contains query word > other
  const q = query.toLowerCase();
  const wordBoundary = new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");

  books.sort((a, b) => {
    const score = (title: string) => {
      const t = title.toLowerCase();
      if (t === q) return 0;              // Exact match — best
      if (t.startsWith(q)) return 1;      // Starts with query — very good
      if (wordBoundary.test(title)) return 2; // Contains query as a word — good
      return 3;                           // Everything else
    };
    return score(a.title) - score(b.title);
  });

  return books.slice(0, 50);  // Return top 50 results
}

/**
 * Convert an Open Library cover ID into an image URL.
 *
 * @param coverId - The cover ID from the search results
 * @param size - "S" (small, 40px), "M" (medium, 180px), "L" (large, 500px)
 * @returns The image URL, or null if no cover ID is available
 */
export function getCoverUrl(coverId: number | null, size: "S" | "M" | "L" = "S"): string | null {
  if (!coverId) return null;
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}
