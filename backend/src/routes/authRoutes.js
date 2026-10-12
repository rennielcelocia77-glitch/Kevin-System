import { Router } from 'express';
import { body } from 'express-validator';
import { login, logout, me } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();
router.post('/login', body('username').trim().notEmpty(), body('password').isString().notEmpty(), validateRequest, login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);
export default router;
