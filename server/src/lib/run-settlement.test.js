import { beforeEach, describe, expect, it, vi } from 'vitest';

// A stand-in for the few PostgREST chains run-settlement uses. Each table
// answers from `db`, which a test rewrites between polls.
const db = { results: 0, pending: 0, rowExists: true, stamped: null, deleted: false };

function builder(table) {
  const q = { table, op: 'select' };
  const chain = {
    select: () => chain,
    eq: () => chain,
    gte: () => chain,
    is: () => chain,
    update: (values) => {
      q.op = 'update';
      q.values = values;
      return chain;
    },
    delete: () => {
      q.op = 'delete';
      return chain;
    },
    then: (resolve) => resolve(answer(q)),
  };
  return chain;
}

function answer(q) {
  if (q.table === 'prompt_results') return { count: db.results, error: null };
  if (q.table === 'cloro_pending_tasks') return { count: db.pending, error: null };
  if (q.table === 'tracking_runs' && q.op === 'update') {
    if (!db.rowExists) return { data: [], error: null };
    db.stamped = q.values;
    return { data: [{ id: 'run-1' }], error: null };
  }
  if (q.table === 'tracking_runs' && q.op === 'delete') {
    db.deleted = true;
    return { error: null };
  }
  throw new Error(`unexpected query on ${q.table}`);
}

vi.mock('../config/supabase.js', () => ({ default: { from: (t) => builder(t) } }));
vi.mock('./insights-rollups.js', () => ({ refreshForCompletedRun: vi.fn(async () => {}) }));
vi.mock('./logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const { settleDecision, settleTrackingRun } = await import('./run-settlement.js');

const run = { brandId: 'b1', runId: 'run-1', startedAt: '2026-09-30T03:09:50Z', plannedTasks: 100 };
const fast = { pollMs: 1, waitMs: 50 };

beforeEach(() => {
  Object.assign(db, { results: 0, pending: 0, rowExists: true, stamped: null, deleted: false });
});

describe('settleDecision', () => {
  it('stamps a complete run', () => {
    expect(settleDecision({ resultCount: 95, plannedTasks: 100, final: false })).toBe('stamp');
  });

  it('waits on a run that is only half in', () => {
    expect(settleDecision({ resultCount: 54, plannedTasks: 100, final: false })).toBe('wait');
  });

  it('stamps a half-in run once waiting cannot help', () => {
    expect(settleDecision({ resultCount: 54, plannedTasks: 100, final: true })).toBe('stamp');
  });

  it('discards a near-empty run once waiting cannot help', () => {
    expect(settleDecision({ resultCount: 30, plannedTasks: 100, final: true })).toBe('discard');
    expect(settleDecision({ resultCount: 0, plannedTasks: 100, final: true })).toBe('discard');
  });

  it('waits on a run with nothing in yet while answers are pending', () => {
    expect(settleDecision({ resultCount: 0, plannedTasks: 100, final: false })).toBe('wait');
  });

  it('stamps any results when nothing was planned', () => {
    expect(settleDecision({ resultCount: 3, plannedTasks: 0, final: false })).toBe('stamp');
  });
});

describe('settleTrackingRun', () => {
  it('stamps at once when the run is complete', async () => {
    db.results = 98;
    db.pending = 2;
    const out = await settleTrackingRun(run, fast);
    expect(out).toEqual({ stamped: true, lateStamp: null });
    expect(db.stamped.result_count).toBe(98);
  });

  it('holds a short run and stamps it once the late answers arrive', async () => {
    db.results = 54;
    db.pending = 46;
    const out = await settleTrackingRun(run, { pollMs: 5, waitMs: 1000 });
    expect(out.stamped).toBe(false);
    expect(db.stamped).toBeNull();

    db.results = 97;
    db.pending = 3;
    await expect(out.lateStamp).resolves.toBe(true);
    expect(db.stamped.result_count).toBe(97);
  });

  it('stamps a short run early when nothing is pending any more', async () => {
    db.results = 80;
    db.pending = 20;
    const out = await settleTrackingRun(run, { pollMs: 5, waitMs: 60_000 });
    db.pending = 0;
    await expect(out.lateStamp).resolves.toBe(true);
    expect(db.stamped.result_count).toBe(80);
  });

  it('stamps what arrived at the deadline when it clears the minimum', async () => {
    db.results = 60;
    db.pending = 40;
    const out = await settleTrackingRun(run, fast);
    await expect(out.lateStamp).resolves.toBe(true);
    expect(db.stamped.result_count).toBe(60);
  });

  it('removes the row at the deadline when too little arrived', async () => {
    db.results = 20;
    db.pending = 80;
    const out = await settleTrackingRun(run, fast);
    await expect(out.lateStamp).resolves.toBe(false);
    expect(db.deleted).toBe(true);
    expect(db.stamped).toBeNull();
  });

  it('does not stamp a run whose row a later run already cleared', async () => {
    db.results = 54;
    db.pending = 46;
    const out = await settleTrackingRun(run, { pollMs: 5, waitMs: 1000 });
    db.rowExists = false;
    db.results = 99;
    await expect(out.lateStamp).resolves.toBe(false);
  });
});
