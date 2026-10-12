import { Router } from 'express';
import { body, param } from 'express-validator';
import { getInventory, getInventoryItem, openingStock } from '../controllers/inventoryController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();
router.get('/', authenticate, getInventory);
router.get('/:id', authenticate, param('id').isInt({ min: 1 }), validateRequest, getInventoryItem);
router.post('/opening-stock', authenticate, authorize('OWNER'), body('itemId').isInt({ min: 1 }), body('quantity').isFloat({ gt: 0 }), validateRequest, openingStock);
export default router;
