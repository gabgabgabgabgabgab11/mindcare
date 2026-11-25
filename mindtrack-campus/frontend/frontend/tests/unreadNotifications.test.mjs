import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const { outputText } = ts.transpileModule(readFileSync(new URL('../src/utils/unreadNotifications.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { createUnreadNotificationTracker } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const deferred = () => { let resolve; const promise = new Promise(yes => { resolve = yes; }); return { promise, resolve }; };

test('badge counts only unread notifications and clears at zero', async () => {
  const counts = [];
  let items = [{ is_read: false }, { is_read: true }, { is_read: false }];
  const tracker = createUnreadNotificationTracker(async () => items, count => counts.push(count));
  await tracker.refresh();
  items = [];
  await tracker.refresh();
  assert.deepEqual(counts, [2, 0]);
});

test('marking read during a pending poll queues a fresh request and ignores the stale result', async () => {
  const old = deferred(); const counts = []; let calls = 0;
  const tracker = createUnreadNotificationTracker(() => ++calls === 1 ? old.promise : Promise.resolve([]), count => counts.push(count));
  const first = tracker.refresh();
  tracker.refresh();
  assert.equal(calls, 1);
  old.resolve([{ is_read: false }]);
  await first;
  assert.equal(calls, 2);
  assert.deepEqual(counts, [0]);
});

test('logout/disposal ignores late responses and stops future refreshes', async () => {
  const old = deferred(); const counts = []; let calls = 0;
  const tracker = createUnreadNotificationTracker(() => { calls++; return old.promise; }, count => counts.push(count));
  const request = tracker.refresh(); tracker.dispose(); old.resolve([{ is_read: false }]);
  await request; await tracker.refresh();
  assert.deepEqual(counts, []); assert.equal(calls, 1);
});

test('temporary fetch failures preserve the last known count', async () => {
  const counts = []; let calls = 0;
  const tracker = createUnreadNotificationTracker(async () => {
    if (++calls > 1) throw new Error('offline');
    return [{ is_read: false }];
  }, count => counts.push(count));
  await tracker.refresh(); await tracker.refresh();
  assert.deepEqual(counts, [1]);
});
