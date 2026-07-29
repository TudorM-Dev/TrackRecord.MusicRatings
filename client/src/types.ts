export type ReleaseKind = "ALBUM" | "SINGLE";

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
