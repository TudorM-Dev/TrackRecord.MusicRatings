import type { ReleaseKind } from "./types.js";

const SEARCH_URL = "https://itunes.apple.com/search";
const LOOKUP_URL = "https://itunes.apple.com/lookup";

export type MusicRelease = {
  externalId: string;
  title: string;
  artist: string;
  releaseYear: number;
  kind: ReleaseKind;
  coverUrl: string;
};

function makeExternalId(kind: ReleaseKind, id: number): string {
  return `${kind === "ALBUM" ? "album" : "song"}:${id}`;
}

type ItunesItem = {
  wrapperType: string;
  collectionId?: number;
  collectionName?: string;
  trackId?: number;
  trackName?: string;
  artistName: string;
  releaseDate?: string;
  artworkUrl100?: string;
};

function upscaleArtwork(url: string | undefined): string {
  if (!url) return "";
  return url.replace("100x100", "600x600");
}

function parseYear(releaseDate: string | undefined): number {
  if (!releaseDate) return 0;
  return Number(releaseDate.slice(0, 4));
}

function toRelease(item: ItunesItem): MusicRelease | null {
  if (item.wrapperType === "collection" && item.collectionId) {
    return {
      externalId: makeExternalId("ALBUM", item.collectionId),
      title: item.collectionName ?? "",
      artist: item.artistName,
      releaseYear: parseYear(item.releaseDate),
      kind: "ALBUM",
      coverUrl: upscaleArtwork(item.artworkUrl100),
    };
  }

  if (item.wrapperType === "track" && item.trackId) {
    return {
      externalId: makeExternalId("SINGLE", item.trackId),
      title: item.trackName ?? "",
      artist: item.artistName,
      releaseYear: parseYear(item.releaseDate),
      kind: "SINGLE",
      coverUrl: upscaleArtwork(item.artworkUrl100),
    };
  }

  return null;
}

async function fetchItunes(url: string): Promise<ItunesItem[]> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`iTunes request failed: ${response.status}`);
  }

  // The endpoint answers with text/javascript, so response.json() refuses it.
  const body = await response.text();
  const data = JSON.parse(body) as { results?: ItunesItem[] };

  return data.results ?? [];
}

export async function searchMusic(query: string): Promise<MusicRelease[]> {
  const term = encodeURIComponent(query);

  const [albums, songs] = await Promise.all([
    fetchItunes(`${SEARCH_URL}?term=${term}&entity=album&limit=12`),
    fetchItunes(`${SEARCH_URL}?term=${term}&entity=song&limit=12`),
  ]);

  return [...albums, ...songs]
    .map(toRelease)
    .filter((release): release is MusicRelease => release !== null);
}

export async function getMusicRelease(
  externalId: string,
): Promise<MusicRelease | null> {
  const [, rawId] = externalId.split(":");

  if (!rawId || !/^\d+$/.test(rawId)) return null;

  const results = await fetchItunes(`${LOOKUP_URL}?id=${rawId}`);
  const first = results[0];

  return first ? toRelease(first) : null;
}
