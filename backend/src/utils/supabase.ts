// PSEUDO: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env vars to enable Supabase Storage.
// Steps:
//   1. Go to supabase.com → New project
//   2. Project Settings → API → copy Project URL and service_role key
//   3. Storage → New bucket → name it "origo" → make it Public
//   4. Set SUPABASE_URL=https://<ref>.supabase.co and SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
// When both are set, file uploads (avatars, student IDs) are stored in Supabase Storage automatically.

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
