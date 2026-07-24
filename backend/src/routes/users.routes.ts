import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { UserService } from '../services/user.service';
import { isSupabaseReady, uploadToSupabase } from '../utils/supabase';
import {
  UpdateProfileSchema,
  UpdateInterestsSchema,
  ReportUserSchema,
  PushTokenSchema,
} from '../schemas/user.schema';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024 } });

router.get('/me', authMiddleware, async (req, res) => {
  try { res.json(await UserService.getMe(req.user!.userId)); }
  catch (e: unknown) { res.status(404).json({ error: e instanceof Error ? e.message : 'Not found' }); }
});

// SEC-16: Zod strips unknown keys before the service sees them; updateMe only picks safe fields
router.patch('/me', authMiddleware, validate(UpdateProfileSchema), async (req, res) => {
  try { res.json(await UserService.updateMe(req.user!.userId, req.body)); }
  catch { res.status(400).json({ error: 'Update failed' }); }
});

router.post('/me/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
  const mime = req.file.mimetype;
  if (!mime.startsWith('image/')) { res.status(400).json({ error: 'Only image files are allowed' }); return; }

  let avatarUrl: string;
  if (isSupabaseReady()) {
    // PSEUDO: Supabase Storage — set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to activate
    try {
      const ext = mime.split('/')[1] ?? 'jpg';
      avatarUrl = await uploadToSupabase('origo', `avatars/${req.user!.userId}.${ext}`, req.file.buffer, mime);
    } catch { res.status(500).json({ error: 'Upload to storage failed' }); return; }
  } else {
    // Fallback: base64 data URI (fine for dev; Supabase preferred for production)
    avatarUrl = `data:${mime};base64,${req.file.buffer.toString('base64')}`;
  }

  try {
    const user = await UserService.updateMe(req.user!.userId, { avatarUrl });
    res.json({ avatarUrl: (user as { avatarUrl?: string }).avatarUrl ?? avatarUrl });
  } catch { res.status(400).json({ error: 'Failed to update avatar' }); }
});

router.put('/me/interests', authMiddleware, validate(UpdateInterestsSchema), async (req, res) => {
  try {
    const { interestIds } = req.body as { interestIds: string[] };
    res.json(await UserService.updateInterests(req.user!.userId, interestIds));
  } catch { res.status(400).json({ error: 'Failed to update interests' }); }
});

router.get('/interests', authMiddleware, async (_req, res) => {
  try { res.json(await UserService.getAllInterests()); }
  catch { res.status(500).json({ error: 'Failed to fetch interests' }); }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try { res.json(await UserService.getPublicProfile(req.params['id']!, req.user!.userId)); }
  catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Not found';
    res.status(msg === 'BLOCKED' || msg === 'FORBIDDEN' ? 403 : 404).json({ error: msg });
  }
});

router.post('/block/:id', authMiddleware, async (req, res) => {
  try { res.json(await UserService.blockUser(req.user!.userId, req.params['id']!)); }
  catch { res.status(400).json({ error: 'Failed' }); }
});

router.delete('/block/:id', authMiddleware, async (req, res) => {
  try { res.json(await UserService.unblockUser(req.user!.userId, req.params['id']!)); }
  catch { res.status(400).json({ error: 'Failed' }); }
});

router.post('/report/:id', authMiddleware, validate(ReportUserSchema), async (req, res) => {
  try { res.json(await UserService.reportUser(req.user!.userId, req.params['id']!, req.body.reason)); }
  catch { res.status(400).json({ error: 'Failed' }); }
});

router.post('/push-token', authMiddleware, validate(PushTokenSchema), async (req, res) => {
  try { res.json(await UserService.registerPushToken(req.user!.userId, req.body.token)); }
  catch { res.status(400).json({ error: 'Failed' }); }
});

export default router;
