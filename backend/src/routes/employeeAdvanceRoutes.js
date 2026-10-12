import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import * as controller from '../controllers/employeeAdvanceController.js';

const router = Router();
const owner = [authenticate, authorize('OWNER')];
router.get('/', authenticate, controller.getAdvances);
router.post('/', ...owner, body('employeeId').isInt({ min: 1 }), body('advanceDate').isISO8601(), body('amount').isFloat({ gt: 0 }), validateRequest, controller.createAdvance);
router.post('/:id/payments', ...owner, param('id').isInt({ min: 1 }), body('paymentDate').isISO8601(), body('amount').isFloat({ gt: 0 }), validateRequest, controller.createAdvancePayment);

export default router;
