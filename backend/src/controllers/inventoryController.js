import { listInventory, getInventoryItemDetails, createOpeningStock } from '../services/inventoryService.js';
import { failure, success } from '../utils/apiResponse.js';

export async function getInventory(req, res, next) {
  try { return success(res, await listInventory(), 'Inventory loaded'); } catch (error) { return next(error); }
}

export async function getInventoryItem(req, res, next) {
  try { return success(res, await getInventoryItemDetails(Number(req.params.id)), 'Inventory item details loaded'); }
  catch (error) { return error.code === 'ITEM_NOT_FOUND' ? failure(res, error.message, error.code, 404) : next(error); }
}

export async function openingStock(req, res, next) {
  try {
    const result = await createOpeningStock({ ...req.body, userId: req.user.id });
    return success(res, result, 'Opening stock recorded', 201);
  } catch (error) {
    const status = error.code === 'ITEM_NOT_FOUND' ? 404 : error.code === 'INVALID_QUANTITY' ? 422 : 400;
    return failure(res, error.message, error.code || 'OPENING_STOCK_FAILED', status);
  }
}
