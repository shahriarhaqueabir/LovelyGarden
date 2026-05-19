CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "user_settings" WHERE "owner_id" IS NULL) THEN
    RAISE EXCEPTION 'Cannot harden user_settings: rows with NULL owner_id exist';
  END IF;

  IF EXISTS (SELECT 1 FROM "gardens" WHERE "owner_id" IS NULL) THEN
    RAISE EXCEPTION 'Cannot harden gardens: rows with NULL owner_id exist';
  END IF;

  IF EXISTS (SELECT 1 FROM "inventory_items" WHERE "owner_id" IS NULL) THEN
    RAISE EXCEPTION 'Cannot harden inventory_items: rows with NULL owner_id exist';
  END IF;

  IF EXISTS (SELECT 1 FROM "planted_plants" WHERE "owner_id" IS NULL) THEN
    RAISE EXCEPTION 'Cannot harden planted_plants: rows with NULL owner_id exist';
  END IF;

  IF EXISTS (SELECT 1 FROM "logbook_entries" WHERE "owner_id" IS NULL) THEN
    RAISE EXCEPTION 'Cannot harden logbook_entries: rows with NULL owner_id exist';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "user_settings"
    GROUP BY "owner_id"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot harden user_settings: duplicate owner_id rows exist';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "gardens"
    GROUP BY "owner_id", "id"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot harden gardens: duplicate owner_id/id rows exist';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "inventory_items"
    GROUP BY "owner_id", "id"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot harden inventory_items: duplicate owner_id/id rows exist';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "planted_plants"
    GROUP BY "owner_id", "id"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot harden planted_plants: duplicate owner_id/id rows exist';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "planted_plants"
    GROUP BY "owner_id", "garden_id", "grid_x", "grid_y"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot harden planted_plants: duplicate owner garden grid rows exist';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "logbook_entries"
    GROUP BY "owner_id", "id"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot harden logbook_entries: duplicate owner_id/id rows exist';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "planted_plants" planted
    LEFT JOIN "gardens" garden
      ON garden."owner_id" = planted."owner_id"
     AND garden."id" = planted."garden_id"
    WHERE garden."id" IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot harden planted_plants: owner-scoped garden_id references are missing';
  END IF;
END $$;

REVOKE ALL ON TABLE
  "user_settings",
  "gardens",
  "inventory_items",
  "planted_plants",
  "logbook_entries"
FROM PUBLIC;

REVOKE ALL ON TABLE
  "user_settings",
  "gardens",
  "inventory_items",
  "planted_plants",
  "logbook_entries"
FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  "user_settings",
  "gardens",
  "inventory_items",
  "planted_plants",
  "logbook_entries"
TO authenticated;

ALTER TABLE "planted_plants" DROP CONSTRAINT IF EXISTS "planted_plants_garden_id_fkey";
ALTER TABLE "logbook_entries" DROP CONSTRAINT IF EXISTS "logbook_entries_garden_id_fkey";
ALTER TABLE "planted_plants" DROP CONSTRAINT IF EXISTS "planted_plants_garden_id_grid_x_grid_y_key";

ALTER TABLE "user_settings" ALTER COLUMN "owner_id" SET NOT NULL;
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_owner_id_key" UNIQUE ("owner_id");

ALTER TABLE "gardens" DROP CONSTRAINT IF EXISTS "gardens_pkey";
ALTER TABLE "gardens" ADD COLUMN IF NOT EXISTS "db_id" UUID;
UPDATE "gardens" SET "db_id" = gen_random_uuid() WHERE "db_id" IS NULL;
ALTER TABLE "gardens" ALTER COLUMN "db_id" SET DEFAULT gen_random_uuid();
ALTER TABLE "gardens" ALTER COLUMN "db_id" SET NOT NULL;
ALTER TABLE "gardens" ALTER COLUMN "owner_id" SET NOT NULL;
ALTER TABLE "gardens" ADD CONSTRAINT "gardens_pkey" PRIMARY KEY ("db_id");
ALTER TABLE "gardens" ADD CONSTRAINT "gardens_owner_id_id_key" UNIQUE ("owner_id", "id");

ALTER TABLE "inventory_items" DROP CONSTRAINT IF EXISTS "inventory_items_pkey";
ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "db_id" UUID;
UPDATE "inventory_items" SET "db_id" = gen_random_uuid() WHERE "db_id" IS NULL;
ALTER TABLE "inventory_items" ALTER COLUMN "db_id" SET DEFAULT gen_random_uuid();
ALTER TABLE "inventory_items" ALTER COLUMN "db_id" SET NOT NULL;
ALTER TABLE "inventory_items" ALTER COLUMN "owner_id" SET NOT NULL;
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("db_id");
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_owner_id_id_key" UNIQUE ("owner_id", "id");

ALTER TABLE "planted_plants" DROP CONSTRAINT IF EXISTS "planted_plants_pkey";
ALTER TABLE "planted_plants" ADD COLUMN IF NOT EXISTS "db_id" UUID;
UPDATE "planted_plants" SET "db_id" = gen_random_uuid() WHERE "db_id" IS NULL;
ALTER TABLE "planted_plants" ALTER COLUMN "db_id" SET DEFAULT gen_random_uuid();
ALTER TABLE "planted_plants" ALTER COLUMN "db_id" SET NOT NULL;
ALTER TABLE "planted_plants" ALTER COLUMN "owner_id" SET NOT NULL;
ALTER TABLE "planted_plants" ADD CONSTRAINT "planted_plants_pkey" PRIMARY KEY ("db_id");
ALTER TABLE "planted_plants" ADD CONSTRAINT "planted_plants_owner_id_id_key" UNIQUE ("owner_id", "id");
ALTER TABLE "planted_plants" ADD CONSTRAINT "planted_plants_owner_id_garden_id_grid_x_grid_y_key" UNIQUE ("owner_id", "garden_id", "grid_x", "grid_y");
ALTER TABLE "planted_plants" ADD CONSTRAINT "planted_plants_owner_id_garden_id_fkey" FOREIGN KEY ("owner_id", "garden_id") REFERENCES "gardens"("owner_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "logbook_entries" DROP CONSTRAINT IF EXISTS "logbook_entries_pkey";
ALTER TABLE "logbook_entries" ADD COLUMN IF NOT EXISTS "db_id" UUID;
UPDATE "logbook_entries" SET "db_id" = gen_random_uuid() WHERE "db_id" IS NULL;
ALTER TABLE "logbook_entries" ALTER COLUMN "db_id" SET DEFAULT gen_random_uuid();
ALTER TABLE "logbook_entries" ALTER COLUMN "db_id" SET NOT NULL;
ALTER TABLE "logbook_entries" ALTER COLUMN "owner_id" SET NOT NULL;
ALTER TABLE "logbook_entries" ADD CONSTRAINT "logbook_entries_pkey" PRIMARY KEY ("db_id");
ALTER TABLE "logbook_entries" ADD CONSTRAINT "logbook_entries_owner_id_id_key" UNIQUE ("owner_id", "id");
