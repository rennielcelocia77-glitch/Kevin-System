import { Router } from 'express';
import { body } from 'express-validator';
import { listExpenses, getExpense, recordExpense, listGasolineExpenses, recordGasolineExpense } from '../controllers/expenseController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.get('/', authenticate, listExpenses);
router.get('/gasoline/list', authenticate, listGasolineExpenses);
router.post('/gasoline', authenticate, body('totalAmount').isFloat({ gt: 0 }), body('expenseDate').isISO8601(), validateRequest, recordGasolineExpense);
router.get('/:id', authenticate, getExpense);
router.post('/', authenticate, body('category').notEmpty(), body('amount').isFloat({ gt: 0 }), body('expenseDate').isISO8601(), validateRequest, recordExpense);

export default router;
