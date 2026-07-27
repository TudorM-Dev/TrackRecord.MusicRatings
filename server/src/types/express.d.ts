import type { User } from "../generated/prisma/client.js";

// Adds `req.user`, set by the auth middleware after a valid session is found.
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
