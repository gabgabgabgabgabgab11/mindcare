import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Use the project's TypeScript compiler so tests also run on the installed Node 20.
const source = readFileSync(new URL('../src/utils/sessionInactivity.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const {
  SESSION_INACTIVITY_MS, inactivityExpired, sessionActivityKey,
  isSessionInactive, recordSessionActivity,
} = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

const store = new Map();
globalThis.window = { localStorage: {
  getItem: (key) => store.get(key) ?? null,
  setItem: (key, value) => store.set(key, value),
} };
const session = (id) => ({
  access_token: `header.${Buffer.from(JSON.stringify({ session_id: id })).toString('base64url')}.signature`,
  user: { id: 'same-user' },
});
const start = 1_800_000_000_000;

test('expires at seven days, not six days or just before the boundary', () => {
  assert.equal(inactivityExpired(start, start + SESSION_INACTIVITY_MS - 1), false);
  assert.equal(inactivityExpired(start, start + SESSION_INACTIVITY_MS), true);
  assert.equal(inactivityExpired(start, start + SESSION_INACTIVITY_MS + 1), true);
});

test('automatic checks and token refreshes do not extend inactivity', () => {
  const s = session('passive');
  assert.equal(isSessionInactive(s, start), false);
  assert.equal(isSessionInactive(s, start + 6 * 86_400_000), false);
  const refreshed = { ...s, access_token: s.access_token.replace('header', 'new-header') };
  assert.equal(isSessionInactive(refreshed, start + SESSION_INACTIVITY_MS), true);
});

test('real activity before expiry starts a new seven-day window', () => {
  const s = session('active');
  isSessionInactive(s, start);
  const used = start + 6 * 86_400_000;
  assert.equal(recordSessionActivity(s, used), true);
  assert.equal(isSessionInactive(s, start + SESSION_INACTIVITY_MS), false);
  assert.equal(isSessionInactive(s, used + SESSION_INACTIVITY_MS), true);
});

test('returning after expiry cannot revive the existing session', () => {
  const s = session('returning');
  isSessionInactive(s, start);
  assert.equal(recordSessionActivity(s, start + SESSION_INACTIVITY_MS), false);
  assert.equal(store.get(sessionActivityKey(s)), String(start));
});

test('activity is shared between tabs for the same session', () => {
  const s = session('tabs');
  isSessionInactive(s, start);
  store.set(sessionActivityKey(s), String(start + 86_400_000));
  assert.equal(isSessionInactive(s, start + SESSION_INACTIVITY_MS), false);
});

test('a new login has a separate activity window even for the same account', () => {
  const old = session('old-login');
  const fresh = session('new-login');
  isSessionInactive(old, start);
  assert.equal(isSessionInactive(old, start + SESSION_INACTIVITY_MS), true);
  assert.equal(isSessionInactive(fresh, start + SESSION_INACTIVITY_MS), false);
});

test('corrupt and future timestamps fail closed', () => {
  const s = session('corrupt');
  for (const value of ['garbage', '', '0', String(start + 1000)]) {
    store.set(sessionActivityKey(s), value);
    assert.equal(isSessionInactive(s, start), true);
  }
});
