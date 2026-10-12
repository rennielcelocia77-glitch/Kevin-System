import { Router } from 'express';
import { query } from 'express-validator';
import { getHistory } from '../controllers/historyController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();
router.get('/', authenticate, query('startDate').optional().isISO8601(), query('endDate').optional().isISO8601(), query('type').optional().isIn(['INVENTORY', 'PROCESS', 'EMPLOYEE_ADVANCE']), validateRequest, getHistory);

export default router;
