import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { getSuppliers, postSupplier } from '../controllers/supplierController.js';
import { SUPPLIER_ITEM_CATEGORIES } from '../services/supplierService.js';

const router = Router();
router.get('/', authenticate, getSuppliers);
router.post('/', authenticate, authorize('OWNER'), body('supplierName').trim().notEmpty(), body('itemCategories').optional().isArray(), body('itemCategories.*').optional().isIn(SUPPLIER_ITEM_CATEGORIES), validateRequest, postSupplier);
export default router;