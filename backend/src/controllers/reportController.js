import { getDailyReport, getMonthlyReport, getYearlyReport, getDashboardData, getInventoryReport, getProductionReport, businessDate } from '../services/reportingService.js';
import { success, failure } from '../utils/apiResponse.js';

export async function getDashboard(req, res, next) {
  try {
    const data = await getDashboardData();
    return success(res, data, 'Dashboard data loaded');
  } catch (error) { return next(error); }
}

export async function getDailyReportHandler(req, res, next) {
  try {
    const { date } = req.query;
    if (!date) return failure(res, 'Date is required', 'INVALID_INPUT');
    const report = await getDailyReport(date);
    return success(res, report, 'Daily report generated');
  } catch (error) { return next(error); }
}

export async function getMonthlyReportHandler(req, res, next) {
  try {
    const { month, year } = req.query;
    if (!month || !year) return failure(res, 'Month and year are required', 'INVALID_INPUT');
    const report = await getMonthlyReport(Number(month), Number(year));
    return success(res, report, 'Monthly report generated');
  } catch (error) { return next(error); }
}

export async function getYearlyReportHandler(req, res, next) {
  try {
    const { year } = req.query;
    if (!year) return failure(res, 'Year is required', 'INVALID_INPUT');
    const report = await getYearlyReport(Number(year));
    return success(res, report, 'Yearly report generated');
  } catch (error) { return next(error); }
}

export async function getInventoryReportHandler(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const end = endDate || businessDate();
    const start = startDate || `${businessDate().slice(0, 4)}-01-01`;
    const report = await getInventoryReport(start, end);
    return success(res, report, 'Inventory report generated');
  } catch (error) { return next(error); }
}

export async function getProductionReportHandler(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const end = endDate || businessDate();
    const start = startDate || `${businessDate().slice(0, 4)}-01-01`;
    const report = await getProductionReport(start, end);
    return success(res, report, 'Production report generated');
  } catch (error) { return next(error); }
}
