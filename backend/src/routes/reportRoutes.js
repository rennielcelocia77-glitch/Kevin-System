import { Router } from 'express';
import { getDashboard, getDailyReportHandler, getMonthlyReportHandler, getYearlyReportHandler, getInventoryReportHandler, getProductionReportHandler } from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/dashboard', authenticate, getDashboard);
router.get('/daily', authenticate, getDailyReportHandler);
router.get('/monthly', authenticate, getMonthlyReportHandler);
router.get('/yearly', authenticate, getYearlyReportHandler);
router.get('/inventory', authenticate, getInventoryReportHandler);
router.get('/production', authenticate, getProductionReportHandler);

export default router;
