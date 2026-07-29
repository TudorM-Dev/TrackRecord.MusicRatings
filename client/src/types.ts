export type ReleaseKind = "ALBUM" | "SINGLE";

export type Role = "USER" | "ADMIN";

export type Verdict = "GOOD" | "BAD";

export type Relationship =
  | "self"
  | "friends"
  | "pending_sent"
  | "pending_received"
  | "none";

export type CurrentUser = {
  id: number;
  email: string;
  username: string;
  displayName: string;
  bio?: string;
  role?: Role;
};

export type PublicUser = {
  id: number;
  username: string;
  displayName: string;
};

export type Release = {
  id: number;
  externalId: string;
  title: string;
  artist: string;
  releaseYear: number;
  kind: ReleaseKind;
  coverUrl: string;
};

export type ReleaseDetail = Release & {
  averageScore: number | null;
  ratingCount: number;
  myScore: number | null;
};

export type Track = {
  id: number;
  title: string;
  trackNumber: number;
  discNumber: number;
  myVerdict: Verdict | null;
};

export type Rating = {
  id: number;
  score: number;
  createdAt: string;
  updatedAt: string;
  release: Release;
};

export type Profile = PublicUser & {
  relationship: Relationship;
  bio?: string;
  createdAt?: string;
  ratings?: Rating[];
};

export type FriendRequest = {
  id: number;
  status: string;
  createdAt: string;
  requester?: PublicUser;
  receiver?: PublicUser;
};

export type MusicResult = {
  externalId: string;
  title: string;
  artist: string;
  releaseYear: number;
  kind: ReleaseKind;
  coverUrl: string;
};

export type AdminStats = {
  users: number;
  releases: number;
  tracks: number;
  ratings: number;
  verdicts: number;
  friendships: number;
  pendingRequests: number;
  averageScore: number | null;
};

export type AdminUser = {
  id: number;
  email: string;
  username: string;
  displayName: string;
  role: Role;
  createdAt: string;
  _count: { ratings: number; verdicts: number; sessions: number };
};

export type AdminRelease = Release & {
  _count: { ratings: number; tracks: number };
};
