import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { guard, json } from '@/lib/admin-auth';
import { OWN_PREFIX } from '@/lib/projects-schema';
import { blobToken } from '@/lib/projects-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Hands the browser a short-lived token so images go straight to Blob (they can exceed the 4.5 MB function limit). */
export async function POST(request: Request) {
  const denied = await guard(request);
  if (denied) return denied;
  const token = blobToken();
  if (!token) return json({ error: 'Storage is not configured on the server.' }, 503);

  try {
    const body = (await request.json()) as HandleUploadBody;
    const result = await handleUpload({
      body,
      request,
      token,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(`${OWN_PREFIX}projects/`) || pathname.includes('..')) throw new Error('Invalid upload path.');
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          maximumSizeInBytes: 12 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });
    return json(result, 200);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Upload failed.' }, 400);
  }
}
