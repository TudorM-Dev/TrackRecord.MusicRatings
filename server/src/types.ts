export type ReleaseKind = "ALBUM" | "SINGLE";

export type FriendshipStatus = "PENDING" | "ACCEPTED" | "DECLINED";

export const PENDING: FriendshipStatus = "PENDING";
export const ACCEPTED: FriendshipStatus = "ACCEPTED";
export const DECLINED: FriendshipStatus = "DECLINED";

// A track is either worth keeping or the one you skip. No middle ground.
export type Verdict = "GOOD" | "BAD";

export const GOOD: Verdict = "GOOD";
export const BAD: Verdict = "BAD";

export type Role = "USER" | "ADMIN";

export const USER: Role = "USER";
export const ADMIN: Role = "ADMIN";

// How the viewer relates to the profile they are looking at.
// The frontend uses this to decide which button to show.
export type Relationship =
  | "self"
  | "friends"
  | "pending_sent"
  | "pending_received"
  | "none";
