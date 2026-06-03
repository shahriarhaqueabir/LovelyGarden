-- Create the auth schema and a mock uid() function if they do not exist for shadow database compatibility.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
    CREATE SCHEMA auth;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'auth' AND p.proname = 'uid'
  ) THEN
    CREATE FUNCTION auth.uid() RETURNS uuid AS 'SELECT null::uuid;' LANGUAGE sql STABLE;
  END IF;
EXCEPTION
  WHEN insufficient_privilege THEN
    NULL;
END $$;

-- CreateTable
CREATE TABLE "plant_catalog" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scientific_name" TEXT,
    "description" TEXT,
    "family" TEXT,
    "genus" TEXT,
    "species" TEXT,
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "life_cycle" TEXT,
    "growth_habit" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "photosynthesis_type" TEXT,
    "edible_parts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "toxic_parts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pollination_type" TEXT,
    "sowing_season" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sowing_method" TEXT,
    "stages" JSONB NOT NULL DEFAULT '[]',
    "companions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "antagonists" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "confidence_score" DOUBLE PRECISION,
    "sources" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "seasonality" JSONB,
    "sunlight" TEXT,
    "water_requirements" TEXT,
    "soil_type" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferred_ph" TEXT,
    "common_pests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "common_diseases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "nutrient_preferences" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "source_metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plant_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plant_knowledge_base" (
    "plant_id" TEXT NOT NULL,
    "common_name" TEXT NOT NULL,
    "scientific_name" TEXT,
    "type" TEXT,
    "family" TEXT,
    "growth_stage" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sowing_season" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sowing_method" TEXT,
    "seasonality" JSONB,
    "sunlight" TEXT,
    "water_requirements" TEXT,
    "soil_type" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "companion_plants" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "incompatible_plants" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "common_pests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "common_diseases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "nutrient_preferences" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "preferred_ph" TEXT,
    "life_cycle" TEXT,
    "growth_habit" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "photosynthesis_type" TEXT,
    "edible_parts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "toxic_parts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pollination_type" TEXT,
    "stages" JSONB NOT NULL DEFAULT '[]',
    "source_metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plant_knowledge_base_pkey" PRIMARY KEY ("plant_id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT,
    "credibility_tier" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "owner_id" UUID,
    "first_load_complete" BOOLEAN NOT NULL DEFAULT false,
    "hemisphere" TEXT,
    "city" TEXT,
    "current_day" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "data_version" INTEGER NOT NULL DEFAULT 0,
    "preferences" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gardens" (
    "id" TEXT NOT NULL,
    "owner_id" UUID,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "soil_type" TEXT,
    "sun_exposure" TEXT,
    "grid_width" INTEGER NOT NULL,
    "grid_height" INTEGER NOT NULL,
    "background_color" TEXT,
    "theme" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gardens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "owner_id" UUID,
    "catalog_id" TEXT NOT NULL,
    "acquired_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planted_plants" (
    "id" TEXT NOT NULL,
    "owner_id" UUID,
    "garden_id" TEXT NOT NULL,
    "catalog_id" TEXT NOT NULL,
    "grid_x" INTEGER NOT NULL,
    "grid_y" INTEGER NOT NULL,
    "planted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_watered_at" TIMESTAMPTZ(6),
    "current_stage_index" INTEGER NOT NULL DEFAULT 0,
    "health_status" TEXT NOT NULL DEFAULT 'Healthy',
    "custom_name" TEXT,
    "hydration" INTEGER NOT NULL DEFAULT 100,
    "stress_level" INTEGER NOT NULL DEFAULT 0,
    "nutrients" JSONB NOT NULL DEFAULT '{"n":50,"p":50,"k":50}',
    "observations" JSONB NOT NULL DEFAULT '[]',
    "system_diagnosis" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planted_plants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logbook_entries" (
    "id" TEXT NOT NULL,
    "owner_id" UUID,
    "type" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "category" TEXT,
    "quantity" DOUBLE PRECISION,
    "price" DECIMAL(10,2),
    "currency" TEXT,
    "vendor" TEXT,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "catalog_id" TEXT,
    "garden_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logbook_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "plant_catalog_name_idx" ON "plant_catalog"("name");

-- CreateIndex
CREATE INDEX "plant_knowledge_base_common_name_idx" ON "plant_knowledge_base"("common_name");

-- CreateIndex
CREATE INDEX "user_settings_owner_id_idx" ON "user_settings"("owner_id");

-- CreateIndex
CREATE INDEX "gardens_owner_id_idx" ON "gardens"("owner_id");

-- CreateIndex
CREATE INDEX "inventory_items_catalog_id_idx" ON "inventory_items"("catalog_id");

-- CreateIndex
CREATE INDEX "inventory_items_owner_id_idx" ON "inventory_items"("owner_id");

-- CreateIndex
CREATE INDEX "planted_plants_catalog_id_idx" ON "planted_plants"("catalog_id");

-- CreateIndex
CREATE INDEX "planted_plants_owner_id_idx" ON "planted_plants"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "planted_plants_garden_id_grid_x_grid_y_key" ON "planted_plants"("garden_id", "grid_x", "grid_y");

-- CreateIndex
CREATE INDEX "logbook_entries_catalog_id_idx" ON "logbook_entries"("catalog_id");

-- CreateIndex
CREATE INDEX "logbook_entries_garden_id_idx" ON "logbook_entries"("garden_id");

-- CreateIndex
CREATE INDEX "logbook_entries_occurred_at_idx" ON "logbook_entries"("occurred_at");

-- CreateIndex
CREATE INDEX "logbook_entries_owner_id_idx" ON "logbook_entries"("owner_id");

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "plant_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planted_plants" ADD CONSTRAINT "planted_plants_garden_id_fkey" FOREIGN KEY ("garden_id") REFERENCES "gardens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planted_plants" ADD CONSTRAINT "planted_plants_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "plant_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logbook_entries" ADD CONSTRAINT "logbook_entries_garden_id_fkey" FOREIGN KEY ("garden_id") REFERENCES "gardens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logbook_entries" ADD CONSTRAINT "logbook_entries_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "plant_catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Enable Supabase Row Level Security.
ALTER TABLE "plant_catalog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "plant_knowledge_base" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gardens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "planted_plants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "logbook_entries" ENABLE ROW LEVEL SECURITY;

-- Reference data can be read by the public browser client.
GRANT SELECT ON "plant_catalog" TO anon, authenticated;
GRANT SELECT ON "plant_knowledge_base" TO anon, authenticated;
GRANT SELECT ON "sources" TO anon, authenticated;

CREATE POLICY "Reference plant catalog is publicly readable"
ON "plant_catalog"
FOR SELECT
USING (true);

CREATE POLICY "Reference plant knowledge base is publicly readable"
ON "plant_knowledge_base"
FOR SELECT
USING (true);

CREATE POLICY "Reference sources are publicly readable"
ON "sources"
FOR SELECT
USING (true);

-- User-owned data is only available to the authenticated owner.
GRANT SELECT, INSERT, UPDATE, DELETE ON "user_settings" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "gardens" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "inventory_items" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "planted_plants" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "logbook_entries" TO authenticated;

CREATE POLICY "Users manage their own settings"
ON "user_settings"
FOR ALL
TO authenticated
USING (auth.uid() = "owner_id")
WITH CHECK (auth.uid() = "owner_id");

CREATE POLICY "Users manage their own gardens"
ON "gardens"
FOR ALL
TO authenticated
USING (auth.uid() = "owner_id")
WITH CHECK (auth.uid() = "owner_id");

CREATE POLICY "Users manage their own inventory"
ON "inventory_items"
FOR ALL
TO authenticated
USING (auth.uid() = "owner_id")
WITH CHECK (auth.uid() = "owner_id");

CREATE POLICY "Users manage their own planted plants"
ON "planted_plants"
FOR ALL
TO authenticated
USING (auth.uid() = "owner_id")
WITH CHECK (auth.uid() = "owner_id");

CREATE POLICY "Users manage their own logbook entries"
ON "logbook_entries"
FOR ALL
TO authenticated
USING (auth.uid() = "owner_id")
WITH CHECK (auth.uid() = "owner_id");
