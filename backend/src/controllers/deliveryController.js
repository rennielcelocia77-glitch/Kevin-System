import { createDelivery, updateDeliveryStatus, getDeliveries, getDeliveryById } from '../services/deliveryService.js';
import { success, failure } from '../utils/apiResponse.js';

export async function listDeliveries(req, res, next) {
  try {
    const { startDate, endDate, customerId, status } = req.query;
    const deliveries = await getDeliveries({ startDate, endDate, customerId, status });
    return success(res, deliveries, 'Deliveries loaded');
  } catch (error) { return next(error); }
}

export async function getDelivery(req, res, next) {
  try {
    const delivery = await getDeliveryById(req.params.id);
    if (!delivery) return failure(res, 'Delivery not found', 'DELIVERY_NOT_FOUND', 404);
    return success(res, delivery, 'Delivery retrieved');
  } catch (error) { return next(error); }
}

export async function recordDelivery(req, res, next) {
  try {
    const { saleId, customerId, deliveryDate, deliveryAddress, driverName, notes } = req.body;
    if (!saleId || !deliveryDate) return failure(res, 'Sale and delivery date are required', 'INVALID_INPUT');
    const deliveryId = await createDelivery({ saleId, customerId, deliveryDate, deliveryAddress, driverName, notes, userId: req.user.id });
    return success(res, { deliveryId }, 'Delivery created', 201);
  } catch (error) {
    if (error.code === 'SALE_NOT_FOUND') return failure(res, error.message, error.code, 404);
    if (error.code === 'CUSTOMER_MISMATCH') return failure(res, error.message, error.code, 422);
    return next(error);
  }
}

export async function updateDelivery(req, res, next) {
  try {
    const { status } = req.body;
    if (!status) return failure(res, 'Status is required', 'INVALID_INPUT');
    await updateDeliveryStatus({ deliveryId: req.params.id, status, userId: req.user.id });
    return success(res, { deliveryId: req.params.id, status }, 'Delivery updated');
  } catch (error) {
    if (error.code === 'INVALID_STATUS' || error.code === 'DELIVERY_NOT_FOUND') return failure(res, error.message, error.code, 400);
    return next(error);
  }
}
