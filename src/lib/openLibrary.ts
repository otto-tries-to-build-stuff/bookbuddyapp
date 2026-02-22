export interface OpenLibraryBook {
  title: string;
  author: string;
  coverId: number | null;
  firstPublishYear: number | null;
  editionKey: string | null;
}

export async function searchOpenLibrary(query: string): Promise<OpenLibraryBook[]> {
  if (!query || query.length < 2) return [];

  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8&fields=title,author_name,cover_i,first_publish_year,edition_key`;
  const resp = await fetch(url);
  if (!resp.ok) return [];

  const data = await resp.json();
  return (data.docs || []).map((doc: any) => ({
    title: doc.title || "",
    author: doc.author_name?.[0] || "Unknown",
    coverId: doc.cover_i ?? null,
    firstPublishYear: doc.first_publish_year ?? null,
    editionKey: doc.edition_key?.[0] ?? null,
  }));
}

export function getCoverUrl(coverId: number | null, size: "S" | "M" | "L" = "S"): string | null {
  if (!coverId) return null;
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}
