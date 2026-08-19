import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "conversations" ADD COLUMN "buyer_typing_at" timestamp(3) with time zone;
  ALTER TABLE "conversations" ADD COLUMN "admin_typing_at" timestamp(3) with time zone;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "conversations" DROP COLUMN "buyer_typing_at";
  ALTER TABLE "conversations" DROP COLUMN "admin_typing_at";`)
}
