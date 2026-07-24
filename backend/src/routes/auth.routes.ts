import { Router } from 'express';
import multer from 'multer';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validate';
import { RegisterSchema, LoginSchema, CollegeEmailSchema, OtpSchema } from '../schemas/auth.schema';
import { isSupabaseReady, uploadToSupabasePrivate } from '../utils/supabase';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/register', authLimiter, validate(RegisterSchema), AuthController.register);
router.post('/google', authLimiter, AuthController.googleAuth);
router.post('/login', authLimiter, validate(LoginSchema), AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', authMiddleware, AuthController.logout);
router.post('/set-dob', authMiddleware, AuthController.setDob);
router.post('/verify-college-email', authMiddleware, otpLimiter, validate(CollegeEmailSchema), AuthController.verifyCollegeEmail);
router.post('/confirm-college-otp', authMiddleware, validate(OtpSchema), AuthController.confirmOtp);
router.post('/upload-student-id', authMiddleware, upload.single('file'), async (req, res) => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
  const userId = req.user!.userId;
  const ext = req.file.mimetype === 'image/png' ? 'png' : req.file.mimetype === 'image/webp' ? 'webp' : 'jpg';
  let storagePath = `users/${userId}/student-id.${ext}`;
  if (isSupabaseReady()) {
    try {
      storagePath = await uploadToSupabasePrivate('origo-private', storagePath, req.file.buffer, req.file.mimetype);
    } catch (err) {
      console.error('[student-id upload]', err);
      res.status(500).json({ error: 'Upload failed' });
      return;
    }
  }
  const { AuthService } = await import('../services/auth.service');
  await AuthService.uploadStudentId(userId, storagePath);
  res.json({ message: 'Student ID uploaded, under review' });
});
router.delete('/account', authMiddleware, AuthController.deleteAccount);

export default router;
