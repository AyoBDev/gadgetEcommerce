import { describe, it, expect } from 'vitest';
import { getSessionToken, canAdmin, canManage } from '@/lib/admin-auth';

describe('getSessionToken', () => {
  it('returns the payload-token value when present', () => {
    expect(getSessionToken({ 'payload-token': 'abc.def.ghi', other: 'x' })).toBe('abc.def.ghi');
  });
  it('returns null when the cookie map is undefined', () => {
    expect(getSessionToken(undefined)).toBeNull();
  });
  it('returns null when the token cookie is absent', () => {
    expect(getSessionToken({ other: 'x' })).toBeNull();
  });
  it('returns null when the token is an empty string', () => {
    expect(getSessionToken({ 'payload-token': '' })).toBeNull();
  });
});

describe('role gates', () => {
  it('canAdmin is true only for admin role', () => {
    expect(canAdmin({ role: 'admin' })).toBe(true);
    expect(canAdmin({ role: 'staff' })).toBe(false);
    expect(canAdmin(null)).toBe(false);
    expect(canAdmin(undefined)).toBe(false);
    expect(canAdmin({})).toBe(false);
  });
  it('canManage is true for admin and staff, false otherwise', () => {
    expect(canManage({ role: 'admin' })).toBe(true);
    expect(canManage({ role: 'staff' })).toBe(true);
    expect(canManage(null)).toBe(false);
    expect(canManage({})).toBe(false);
  });
});