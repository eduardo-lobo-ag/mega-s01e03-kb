import { causeOf, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'timezone' | 'unplaced';

export const TRACKER = 'https://github.com/eduardo-lobo-ag/mega-s01e03-kb/issues';

export const PROBLEMS: { problem: Problem; title: string; issue: number }[] = [
  { problem: 'parser', title: 'Shared parser reads day-first dates month first', issue: 1 },
  { problem: 'hint', title: 'booking-v3 form hints MM/DD/YYYY but reads the date day first', issue: 2 },
  { problem: 'timezone', title: 'Bookings move by one day: time zone, not a month flip', issue: 3 },
];

// The desk counts a report under its tenant's cause, one-day moves included (CauseTable).
// A one-day move is also its own problem: its day and month are not swapped.
export function problemsOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): Problem[] {
  const filed = causeOf(r, t) ?? 'unplaced';
  return oneDayMove.includes(r.id) ? [filed, 'timezone'] : [filed];
}

export type ProblemRow = {
  problem: Problem;
  title: string;
  issue: number | null;
  reports: Report[];
  tenants: string[];
  channels: string[];
  firstSeen: string;
  lastSeen: string;
  intakeAgrees: number;
  alsoTimezone: number;
};

export function splitByProblem(
  reports: Report[],
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): ProblemRow[] {
  const by = new Map<Problem, Report[]>();
  for (const r of reports) {
    for (const p of problemsOf(r, tenantOf(r), oneDayMove)) by.set(p, [...(by.get(p) ?? []), r]);
  }
  return [...by.entries()]
    .map(([problem, rs]) => {
      const known = PROBLEMS.find((p) => p.problem === problem);
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        title: known?.title ?? 'No cause on file',
        issue: known?.issue ?? null,
        reports: rs,
        tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
        channels: [...new Set(rs.map((r) => r.channel))].sort(),
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
        intakeAgrees: rs.filter((r) => r.meta.intakeTag === problem).length,
        alsoTimezone: problem === 'timezone' ? 0 : rs.filter((r) => oneDayMove.includes(r.id)).length,
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
}
