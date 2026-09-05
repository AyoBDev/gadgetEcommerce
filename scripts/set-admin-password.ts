/**
 * Reset (or create) a local admin user's password.
 *
 * Local development helper — Users.create requires an existing admin, which is
 * a chicken-and-egg problem on a fresh database.
 *
 *   pnpm payload run scripts/set-admin-password.ts <email> <password>
 */
import { getPayload } from 'payload';
import config from '@/payload.config';

const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error('Usage: pnpm payload run scripts/set-admin-password.ts <email> <password>');
  process.exit(1);
}

const payload = await getPayload({ config });

const existing = await payload.find({
  collection: 'users',
  where: { email: { equals: email } },
  limit: 1,
});

const found = existing.docs[0];

// payload-types.ts is hand-maintained and omits auth fields such as `password`
// (see the note in payload.config.ts), so these calls need a cast.
if (found) {
  await payload.update({
    collection: 'users',
    id: found.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { password } as any,
  });
  console.log(`Updated password for existing user ${email}`);
} else {
  await payload.create({
    collection: 'users',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { email, password, name: 'Admin', role: 'admin' } as any,
  });
  console.log(`Created new admin user ${email}`);
}

process.exit(0);
