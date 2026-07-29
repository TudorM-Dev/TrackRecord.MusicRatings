import bcrypt from "bcryptjs";
import { prisma } from "./prisma.js";
import { ADMIN } from "./types.js";

// Creates the admin account from environment variables on boot, so a fresh
// deployment has one without anybody registering it by hand. Does nothing when
// the variables are absent.
export async function ensureAdminAccount() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) return;

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role !== ADMIN) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: ADMIN },
      });
      console.log(`Promoted ${email} to admin`);
    }
    return;
  }

  const username = process.env.ADMIN_USERNAME ?? "admin";
  const cost = Number(process.env.BCRYPT_COST ?? 10);

  await prisma.user.create({
    data: {
      email,
      username,
      displayName: username,
      passwordHash: await bcrypt.hash(password, cost),
      role: ADMIN,
    },
  });

  console.log(`Created admin account for ${email}`);
}
