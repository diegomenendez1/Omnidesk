import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateBusinessDays } from './utils';

const monday = new Date('2024-04-01'); // Monday
const friday = new Date('2024-04-05'); // Friday
const saturday = new Date('2024-04-06'); // Saturday
const sunday = new Date('2024-04-07'); // Sunday
const nextMonday = new Date('2024-04-08');

describe('calculateBusinessDays', () => {
  it('counts business days within a single work week', () => {
    const days = calculateBusinessDays(monday, friday);
    assert.equal(days, 5);
  });

  it('ignores weekends when spanning over them', () => {
    const days = calculateBusinessDays(friday, nextMonday);
    assert.equal(days, 2);
  });

  it('returns zero for a range entirely on the weekend', () => {
    const days = calculateBusinessDays(saturday, sunday);
    assert.equal(days, 0);
  });

  it('returns zero when end date is before start date', () => {
    const days = calculateBusinessDays(friday, monday);
    assert.equal(days, 0);
  });
});
