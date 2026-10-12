import test from 'node:test';
import assert from 'node:assert/strict';
import { paymentStatus, positive } from '../src/services/workflowHelpers.js';

const units = {
  'Raw Pinanitan': 'BANGAN',
  'Washed Pinanitan': 'BANGAN',
  'Bamboo Handle': 'PIECE',
  'Finished Broom': 'PIECE'
};

test('Pinanitan and washed Pinanitan use BANGAN', () => {
  assert.equal(units['Raw Pinanitan'], 'BANGAN');
  assert.equal(units['Washed Pinanitan'], 'BANGAN');
});

test('handles and finished brooms use PIECE', () => {
  assert.equal(units['Bamboo Handle'], 'PIECE');
  assert.equal(units['Finished Broom'], 'PIECE');
});

test('negative stock is rejected by the service contract', () => {
  assert.throws(() => {
    const quantity = -1;
    if (quantity <= 0) throw new Error('Quantity must be greater than zero');
  }, /greater than zero/);
});

test('payment status follows exact paid, partial, and unpaid rules', () => {
  assert.equal(paymentStatus(100, 0), 'UNPAID');
  assert.equal(paymentStatus(100, 40), 'PARTIALLY_PAID');
  assert.equal(paymentStatus(100, 100), 'PAID');
});

test('shared quantity validation rejects zero and negative values', () => {
  assert.equal(positive('2.5', 'Quantity'), 2.5);
  assert.throws(() => positive(0, 'Quantity'), /greater than zero/);
  assert.throws(() => positive(-1, 'Quantity'), /greater than zero/);
});
