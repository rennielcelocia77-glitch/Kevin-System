import { createExpense, createGasolineExpense, getExpenses, getExpenseById, getGasolineExpenses } from '../services/expenseService.js';
import { success, failure } from '../utils/apiResponse.js';

export async function listExpenses(req, res, next) {
  try {
    const { startDate, endDate, category } = req.query;
    const expenses = await getExpenses({ startDate, endDate, category });
    return success(res, expenses, 'Expenses loaded');
  } catch (error) { return next(error); }
}

export async function getExpense(req, res, next) {
  try {
    const expense = await getExpenseById(req.params.id);
    if (!expense) return failure(res, 'Expense not found', 'EXPENSE_NOT_FOUND', 404);
    return success(res, expense, 'Expense retrieved');
  } catch (error) { return next(error); }
}

export async function recordExpense(req, res, next) {
  try {
    const { category, description, amount, expenseDate, deliveryId, referenceNumber, notes } = req.body;
    if (!category || !amount || !expenseDate) return failure(res, 'Category, amount, and date are required', 'INVALID_INPUT');
    const expenseId = await createExpense({ category, description, amount, expenseDate, deliveryId, referenceNumber, notes, userId: req.user.id });
    return success(res, { expenseId }, 'Expense recorded', 201);
  } catch (error) {
    if (error.code === 'INVALID_AMOUNT') return failure(res, error.message, error.code, 422);
    return next(error);
  }
}

export async function listGasolineExpenses(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const expenses = await getGasolineExpenses({ startDate, endDate });
    return success(res, expenses, 'Gasoline expenses loaded');
  } catch (error) { return next(error); }
}

export async function recordGasolineExpense(req, res, next) {
  try {
    const { quantityLiters, pricePerLiter, totalAmount, expenseDate, vehicleDescription, deliveryId, notes } = req.body;
    if (!totalAmount || !expenseDate) return failure(res, 'Amount and date are required', 'INVALID_INPUT');
    const expenseId = await createGasolineExpense({ quantityLiters, pricePerLiter, totalAmount, expenseDate, vehicleDescription, deliveryId, notes, userId: req.user.id });
    return success(res, { expenseId }, 'Gasoline expense recorded', 201);
  } catch (error) {
    if (error.code === 'INVALID_AMOUNT') return failure(res, error.message, error.code, 422);
    return next(error);
  }
}
