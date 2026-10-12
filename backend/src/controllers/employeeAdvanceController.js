import { addAdvance, listAdvances, payAdvance } from '../services/employeeAdvanceService.js';
import { success } from '../utils/apiResponse.js';

export async function getAdvances(req, res, next) {
  try { return success(res, await listAdvances(), 'Employee cash advances loaded'); } catch (error) { return next(error); }
}

export async function createAdvance(req, res, next) {
  try { return success(res, await addAdvance({ ...req.body, userId: req.user.id }), 'Cash advance added', 201); } catch (error) { return next(error); }
}

export async function createAdvancePayment(req, res, next) {
  try { return success(res, await payAdvance({ advanceId: Number(req.params.id), ...req.body, userId: req.user.id }), 'Advance payment recorded', 201); } catch (error) { return next(error); }
}
