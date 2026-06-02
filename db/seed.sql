-- PassPorto PostgreSQL Seed Data
-- Populates immigration offices and sample quota slots for development/testing

-- Clear existing seed data (safe for dev environments)
TRUNCATE quota_slots, waitlists, payments, applications, immigration_offices CASCADE;

-- ─── Immigration Offices (Kanim) ──────────────────────────────────────────────
INSERT INTO immigration_offices (id, name, code, address, latitude, longitude)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567801',
   'Kantor Imigrasi Kelas I Jakarta Selatan',
   'KANIM_JAKSEL',
   'Jl. Warung Buncit Raya No.207, Jakarta Selatan',
   -6.2615, 106.8106),

  ('a1b2c3d4-e5f6-7890-abcd-ef1234567802',
   'Kantor Imigrasi Kelas I Jakarta Pusat',
   'KANIM_JAKPUS',
   'Jl. Merpati Blok B-3, Cempaka Putih, Jakarta Pusat',
   -6.1775, 106.8670),

  ('a1b2c3d4-e5f6-7890-abcd-ef1234567803',
   'Kantor Imigrasi Kelas I Khusus Non TPI Bandara Soekarno-Hatta',
   'KANIM_SOETTA',
   'Bandara Internasional Soekarno-Hatta, Tangerang',
   -6.1256, 106.6558),

  ('a1b2c3d4-e5f6-7890-abcd-ef1234567804',
   'Kantor Imigrasi Kelas I Surabaya',
   'KANIM_SBY',
   'Jl. Juanda No.26, Surabaya',
   -7.2491, 112.7508),

  ('a1b2c3d4-e5f6-7890-abcd-ef1234567805',
   'Kantor Imigrasi Kelas I Yogyakarta',
   'KANIM_YGY',
   'Jl. Solo KM 10, Maguwoharjo, Sleman, Yogyakarta',
   -7.7648, 110.4305);

-- ─── Quota Slots (next 7 days for Jakarta Selatan) ──────────────────────────
INSERT INTO quota_slots (id, office_id, date, capacity, filled)
SELECT
  gen_random_uuid(),
  'a1b2c3d4-e5f6-7890-abcd-ef1234567801',
  CURRENT_DATE + s.day,
  50,
  (random() * 40)::int  -- random fill 0-40 of 50 capacity
FROM generate_series(1, 14) AS s(day);

-- Jakarta Pusat slots
INSERT INTO quota_slots (id, office_id, date, capacity, filled)
SELECT
  gen_random_uuid(),
  'a1b2c3d4-e5f6-7890-abcd-ef1234567802',
  CURRENT_DATE + s.day,
  40,
  (random() * 38)::int
FROM generate_series(1, 14) AS s(day);

-- Surabaya slots
INSERT INTO quota_slots (id, office_id, date, capacity, filled)
SELECT
  gen_random_uuid(),
  'a1b2c3d4-e5f6-7890-abcd-ef1234567804',
  CURRENT_DATE + s.day,
  60,
  (random() * 55)::int
FROM generate_series(1, 14) AS s(day);
