import { Router } from 'express';
import { body } from 'express-validator';
import { listDeliveries, getDelivery, recordDelivery, updateDelivery } from '../controllers/deliveryController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.get('/', authenticate, listDeliveries);
router.get('/:id', authenticate, getDelivery);
router.post('/', authenticate, body('saleId').isInt({ min: 1 }), body('deliveryDate').isISO8601(), validateRequest, recordDelivery);
router.put('/:id', authenticate, body('status').isIn(['PENDING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']), validateRequest, updateDelivery);

export default router;
