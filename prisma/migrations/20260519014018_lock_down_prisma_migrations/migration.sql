-- Lock down Prisma's internal migration history table for Supabase exposed schemas.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_prisma_migrations') THEN
    ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;

    REVOKE ALL ON public._prisma_migrations FROM PUBLIC;
    REVOKE ALL ON public._prisma_migrations FROM anon;
    REVOKE ALL ON public._prisma_migrations FROM authenticated;

    DROP POLICY IF EXISTS "_prisma_migrations_service_read" ON public._prisma_migrations;

    CREATE POLICY "_prisma_migrations_service_read"
    ON public._prisma_migrations
    FOR SELECT
    TO service_role
    USING (true);
  END IF;
END $$;