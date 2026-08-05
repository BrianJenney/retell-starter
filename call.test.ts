import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCallRequest } from './call';

const now = new Date('2026-08-04T15:00:00Z');
const ok = { name: 'Brian', reason: 'cleaning', phone: '+15551234567' };

test('accepts a good body and defaults datetime to now', () => {
  const r = parseCallRequest(ok, undefined, now);
  assert.equal(r.ok, true);
  assert.equal(r.ok && r.call.to, '+15551234567');
  assert.ok(r.ok && r.call.datetime.length > 0);
});

test('falls back to CALL_TO_NUMBER when phone is missing', () => {
  const r = parseCallRequest({ name: 'Brian', reason: 'x' }, '+15559998888', now);
  assert.equal(r.ok && r.call.to, '+15559998888');
});

test('rejects missing fields and bad phone numbers', () => {
  assert.equal(parseCallRequest({ reason: 'x', phone: ok.phone }, undefined, now).ok, false);
  assert.equal(parseCallRequest({ name: 'Brian', phone: ok.phone }, undefined, now).ok, false);
  assert.equal(parseCallRequest({ ...ok, phone: '5551234567' }, undefined, now).ok, false);
  assert.equal(parseCallRequest(null, undefined, now).ok, false);
});
