import type { ReleaseKind } from "./types.js";

const API = "https://api.deezer.com";

export type MusicRelease = {
  externalId: string;
  title: string;
  artist: string;
  releaseYear: number;
  kind: ReleaseKind;
  coverUrl: string;
  trackCount?: number;
};

export type MusicTrack = {
  externalId: string;
  title: string;
  trackNumber: number;
  discNumber: number;
};

// Albums and tracks are numbered separately, and the prefix also records which
// service the id came from, so older iTunes rows can never be confused for these.
function albumId(id: number): string {
  return `dz-album:${id}`;
}

function trackId(id: number): string {
  return `dz-track:${id}`;
}

type DeezerArtist = { name?: string };

type DeezerAlbum = {
  id: number;
  title?: string;
  artist?: DeezerArtist;
  cover_xl?: string;
  cover_big?: string;
  nb_tracks?: number;
  record_type?: string;
  release_date?: string;
};

type DeezerTrack = {
  id: number;
  title?: string;
  title_short?: string;
  artist?: DeezerArtist;
  album?: DeezerAlbum;
  release_date?: string;
  track_position?: number;
  disk_number?: number;
};

function parseYear(date: string | undefined): number {
  if (!date) return 0;
  const year = Number(date.slice(0, 4));
  return Number.isInteger(year) ? year : 0;
}

async function deezer<T>(path: string): Promise<T> {
  const response = await fetch(`${API}${path}`);

  if (!response.ok) {
    throw new Error(`Deezer request failed: ${response.status}`);
  }

  const data = (await response.json()) as T & { error?: { message?: string } };

  if (data.error) {
    throw new Error(`Deezer error: ${data.error.message ?? "unknown"}`);
  }

  return data;
}

function albumToRelease(album: DeezerAlbum): MusicRelease {
  return {
    externalId: albumId(album.id),
    title: album.title ?? "",
    artist: album.artist?.name ?? "",
    releaseYear: parseYear(album.release_date),
    // Deezer calls EPs and singles by name; anything else is an album.
    kind: album.record_type === "single" ? "SINGLE" : "ALBUM",
    coverUrl: album.cover_xl ?? album.cover_big ?? "",
    trackCount: album.nb_tracks,
  };
}

function trackToRelease(track: DeezerTrack): MusicRelease {
  return {
    externalId: trackId(track.id),
    title: track.title_short ?? track.title ?? "",
    artist: track.artist?.name ?? "",
    releaseYear: parseYear(track.release_date ?? track.album?.release_date),
    kind: "SINGLE",
    coverUrl: track.album?.cover_xl ?? track.album?.cover_big ?? "",
  };
}

function normalise(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Ranks by how directly a result answers the query, so an exact album title
// beats a remix, a tribute or a compilation that merely mentions it.
function relevance(release: MusicRelease, query: string): number {
  const title = normalise(release.title);
  const artist = normalise(release.artist);
  const term = normalise(query);

  let score = 0;

  if (title === term) score += 100;
  else if (title.startsWith(term)) score += 60;
  else if (title.includes(term)) score += 30;

  if (artist === term) score += 50;
  else if (term.includes(artist) && artist.length > 2) score += 35;
  else if (artist.includes(term)) score += 20;

  // "artist album" typed together should still rank both halves.
  const words = term.split(" ").filter((w) => w.length > 2);
  for (const word of words) {
    if (title.includes(word)) score += 10;
    if (artist.includes(word)) score += 6;
  }

  if (release.kind === "ALBUM") score += 8;
  if (release.coverUrl) score += 2;

  return score;
}

export async function searchMusic(query: string): Promise<MusicRelease[]> {
  const term = encodeURIComponent(query);

  const [albums, tracks] = await Promise.all([
    deezer<{ data?: DeezerAlbum[] }>(`/search/album?q=${term}&limit=25`),
    deezer<{ data?: DeezerTrack[] }>(`/search/track?q=${term}&limit=25`),
  ]);

  const seen = new Set<string>();
  const results: MusicRelease[] = [];

  for (const release of [
    ...(albums.data ?? []).map(albumToRelease),
    ...(tracks.data ?? []).map(trackToRelease),
  ]) {
    if (!release.title || seen.has(release.externalId)) continue;
    seen.add(release.externalId);
    results.push(release);
  }

  return results
    .sort((a, b) => relevance(b, query) - relevance(a, query))
    .slice(0, 30);
}

export async function getMusicRelease(
  externalId: string,
): Promise<MusicRelease | null> {
  const [prefix, rawId] = externalId.split(":");

  if (!rawId || !/^\d+$/.test(rawId)) return null;

  try {
    if (prefix === "dz-album") {
      return albumToRelease(await deezer<DeezerAlbum>(`/album/${rawId}`));
    }

    if (prefix === "dz-track") {
      return trackToRelease(await deezer<DeezerTrack>(`/track/${rawId}`));
    }
  } catch {
    return null;
  }

  return null;
}

// Every song on an album, in running order.
export async function getAlbumTracks(
  externalId: string,
): Promise<MusicTrack[]> {
  const [prefix, rawId] = externalId.split(":");

  if (prefix !== "dz-album" || !rawId || !/^\d+$/.test(rawId)) return [];

  try {
    const album = await deezer<{ tracks?: { data?: DeezerTrack[] } }>(
      `/album/${rawId}`,
    );

    const tracks = album.tracks?.data ?? [];

    // The list already comes in running order; position is not always filled in.
    return tracks.map((track, index) => ({
      externalId: trackId(track.id),
      title: track.title ?? "",
      trackNumber: track.track_position ?? index + 1,
      discNumber: track.disk_number ?? 1,
    }));
  } catch {
    return [];
  }
}
