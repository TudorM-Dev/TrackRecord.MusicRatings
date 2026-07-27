export type ReleaseKind = "ALBUM" | "SINGLE";

export type FriendshipStatus = "PENDING" | "ACCEPTED" | "DECLINED";

export const PENDING: FriendshipStatus = "PENDING";
export const ACCEPTED: FriendshipStatus = "ACCEPTED";
export const DECLINED: FriendshipStatus = "DECLINED";

// How the viewer relates to the profile they are looking at.
// The frontend uses this to decide which button to show.
export type Relationship =
  | "self"
  | "friends"
  | "pending_sent"
  | "pending_received"
  | "none";
