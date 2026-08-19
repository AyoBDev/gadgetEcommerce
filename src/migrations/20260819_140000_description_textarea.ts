import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Convert existing Lexical JSON descriptions to plain paragraph text before
  // the column type changes from jsonb to varchar.
  await db.execute(sql`
    UPDATE "laptops" SET "description" = (
      SELECT to_jsonb(string_agg(para_text, E'\n'))
      FROM (
        SELECT
          (SELECT string_agg(child ->> 'text', '')
           FROM jsonb_array_elements(para -> 'children') AS child
           WHERE child ->> 'type' = 'text') AS para_text
        FROM jsonb_array_elements("laptops"."description" -> 'root' -> 'children') AS para
        WHERE para ->> 'type' = 'paragraph'
      ) sub
      WHERE para_text IS NOT NULL
    )
    WHERE "description" IS NOT NULL;
  `)

  await db.execute(sql`
    ALTER TABLE "laptops" ALTER COLUMN "description" TYPE varchar USING "description" #>> '{}';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "laptops" ALTER COLUMN "description" TYPE jsonb USING to_jsonb("description");
  `)
}