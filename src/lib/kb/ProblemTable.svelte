<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { uniqueById, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { splitByProblem, TRACKER } from '#lib/kb/problems';

  let { ticket }: { ticket: number } = $props();

  const rows = (reports as Report[]).filter((r) => r.mergedInto === ticket);
  const merged = uniqueById(rows);
  const problems = splitByProblem(merged, tenantOf, notes.oneDayMove);
  const total = problems.reduce((n, p) => n + p.reports.length, 0);
</script>

<p class="sum">
  <strong>{merged.length}</strong> reports in #{ticket} ({rows.length - merged.length} duplicate rows in the export dropped) ·
  <strong>{problems.length}</strong> problems · {total === merged.length ? 'every report counted once' : `${merged.length - total} reports missing`}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>channels</th><th>seen</th><th>intake agreed</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each problems as p (p.problem)}
      <tr>
        <td><code>{p.problem}</code><br /><span class="muted">{p.title}</span></td>
        <td><strong>{p.reports.length}</strong></td>
        <td>{p.tenants.length}</td>
        <td>{p.channels.join(', ')}</td>
        <td>{p.firstSeen} → {p.lastSeen}</td>
        <td>{p.intakeAgrees} of {p.reports.length}</td>
        <td>{#if p.issue}<a href="{TRACKER}/{p.issue}">#{p.issue}</a>{:else}none{/if}</td>
      </tr>
    {/each}
  </tbody>
</table>

{#each problems.filter((p) => p.reports.length < 50) as p (p.problem)}
  <p class="muted"><code>{p.problem}</code> ({p.tenants.join(', ')}): {p.reports.map((r) => r.id).join(' ')}</p>
{/each}

<style>
  .sum { font-size: 1.05rem; }
  .muted { color: var(--muted); font-size: 0.85em; }
</style>
