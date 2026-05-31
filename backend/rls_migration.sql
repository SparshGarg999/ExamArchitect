-- ============================================================
-- ExamArchitect: Row Level Security (RLS) Migration
-- Apply via: psql $DATABASE_URL -f rls_migration.sql
-- ============================================================

-- ─── 1. PUBLIC READ-ONLY tables (exam content) ──────────────
-- These are read by everyone (including unauthenticated visitors).
-- Writes are done ONLY by the backend service role (bypasses RLS).

ALTER TABLE public.exam_categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.papers                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_year_stats      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_versions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_version_topics ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon + authenticated) to SELECT
CREATE POLICY "Public read exam_categories"
  ON public.exam_categories FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public read exams"
  ON public.exams FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public read topics"
  ON public.topics FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public read papers"
  ON public.papers FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public read questions"
  ON public.questions FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public read topic_year_stats"
  ON public.topic_year_stats FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public read predictions"
  ON public.predictions FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public read syllabus_versions"
  ON public.syllabus_versions FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public read syllabus_version_topics"
  ON public.syllabus_version_topics FOR SELECT TO anon, authenticated USING (true);

-- No INSERT/UPDATE/DELETE policies => PostgREST writes are denied.
-- Backend uses the service_role key (which bypasses RLS) for writes.


-- ─── 2. USERS table ─────────────────────────────────────────
-- Users can only read/update their own row. No public access.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT TO authenticated
  USING (id::text = current_setting('request.jwt.claims', true)::json->>'sub'
         OR email = current_setting('request.jwt.claims', true)::json->>'email');

-- No public INSERT (registration is done by backend service_role)
-- No public UPDATE/DELETE


-- ─── 3. USER-OWNED tables ───────────────────────────────────
-- Users can CRUD only their own rows.

ALTER TABLE public.user_generated_exams    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_topic_performance  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_feedbacks      ENABLE ROW LEVEL SECURITY;

-- user_generated_exams
CREATE POLICY "Users manage own generated exams"
  ON public.user_generated_exams FOR ALL TO authenticated
  USING (user_id IN (
    SELECT id FROM public.users
    WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ))
  WITH CHECK (user_id IN (
    SELECT id FROM public.users
    WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

-- user_topic_performance
CREATE POLICY "Users manage own topic performance"
  ON public.user_topic_performance FOR ALL TO authenticated
  USING (user_id IN (
    SELECT id FROM public.users
    WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ))
  WITH CHECK (user_id IN (
    SELECT id FROM public.users
    WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

-- question_feedbacks
CREATE POLICY "Users manage own feedback"
  ON public.question_feedbacks FOR ALL TO authenticated
  USING (user_id IN (
    SELECT id FROM public.users
    WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ))
  WITH CHECK (user_id IN (
    SELECT id FROM public.users
    WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));


-- ─── 4. ADMIN-ONLY tables ───────────────────────────────────
-- activity_logs should never be readable via PostgREST at all.
-- service_role (backend) bypasses RLS; no anon/authenticated policies = denied.

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
-- No policies added = all PostgREST access denied.
-- Backend service_role still has full access (RLS bypass).
