// PSEUDO: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env vars to enable Supabase Storage.
// Storage buckets:
//   - "origo"         — PUBLIC bucket for avatars/media (CDN-accessible)
//   - "origo-private" — PRIVATE bucket for student IDs (service-role only, never public URL)
// Steps:
//   1. supabase.com → New project
//   2. Project Settings → API → copy Project URL and service_role key
//   3. Storage → create "origo" (public) and "origo-private" (private, RLS off at bucket level)
//   4. Set SUPABASE_URL=https://<ref>.supabase.co and SUPABASE_SERVICE_ROLE_KEY=<service_role_key>

const SUPABASE_URL = process.env['SUPABASE_URL'];
const SUPABASE_SERVICE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'];

export function isSupabaseReady(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);
}

export async function uploadToSupabase(
  bucket: string,
  path: string,
  file: Buffer,
  contentType: string,
): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) throw new Error('Supabase not configured');

  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;
  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body: file,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.status.toString());
    throw new Error(`Supabase upload failed: ${err}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

// Uploads to a private bucket and returns only the storage path (no public URL).
// Access requires a signed URL generated server-side via the Supabase Admin API.
export async function uploadToSupabasePrivate(
  bucket: string,
  path: string,
  file: Buffer,
  contentType: string,
): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) throw new Error('Supabase not configured');

  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;
  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body: file,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.status.toString());
    throw new Error(`Supabase private upload failed: ${err}`);
  }

  // Return only the storage path — never expose a public URL for private files
  return `${bucket}/${path}`;
}
