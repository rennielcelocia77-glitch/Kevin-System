import { createSupplier, listSuppliers } from '../services/supplierService.js';
import { success } from '../utils/apiResponse.js';

export async function getSuppliers(req, res, next) {
  try { return success(res, await listSuppliers(), 'Suppliers loaded'); } catch (error) { return next(error); }
}

export async function postSupplier(req, res, next) {
  try { return success(res, await createSupplier({ ...req.body, userId: req.user.id }), 'Supplier created', 201); } catch (error) { return next(error); }
}