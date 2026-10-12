import { listHistory } from '../services/historyService.js';
import { success } from '../utils/apiResponse.js';

export async function getHistory(req, res, next) {
  try {
    const { startDate, endDate, type } = req.query;
    return success(res, await listHistory({ startDate, endDate, type }), 'History loaded');
  } catch (error) { return next(error); }
}
