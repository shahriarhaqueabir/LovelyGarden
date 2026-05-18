-- Lock down Prisma's internal migration history table for Supabase exposed schemas.
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