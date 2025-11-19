<script lang="ts">
  import { sessions, pluginSettings, draftWordCounts } from "src/model/stores";
  import { selectedDraft } from "src/model/stores";
  import { goalProgress } from "../stores";

  // Calculate total words for current draft
  $: currentDraftWords = (() => {
    if (!$selectedDraft || !$draftWordCounts) return 0;
    const counts = $draftWordCounts[$selectedDraft.vaultPath];
    if (!counts) return 0;
    if (typeof counts === "number") return counts;
    return Object.values(counts).reduce((a, b) => a + b, 0);
  })();

  // Calculate reading time (average reading speed: 200 wpm)
  $: readingTime = Math.ceil(currentDraftWords / 200);

  // Get current session words
  $: sessionWords = $sessions.length > 0 ? $sessions[0].total : 0;

  // Calculate writing streak
  $: streak = (() => {
    if ($sessions.length === 0) return 0;
    let count = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < $sessions.length; i++) {
      const sessionDate = new Date($sessions[i].start);
      sessionDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);

      if (sessionDate.getTime() === expectedDate.getTime()) {
        if ($sessions[i].total > 0) {
          count++;
        } else {
          break;
        }
      } else if (sessionDate.getTime() < expectedDate.getTime()) {
        break;
      }
    }
    return count;
  })();

  // Format date for display
  function formatDate(date: Date): string {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  }

  // Get recent sessions (last 7)
  $: recentSessions = $sessions.slice(0, 7);

  // Goal progress percentage (capped at 100 for display)
  $: progressPercent = Math.min($goalProgress * 100, 100);
  $: isGoalComplete = $goalProgress >= 1;
</script>

<div class="longform-dashboard">
  <!-- Goal Progress Section -->
  <div class="longform-dashboard-section">
    <h3>Today's Goal</h3>
    <div class="longform-goal-progress">
      <div class="longform-goal-progress-bar">
        <div
          class="longform-goal-progress-fill"
          class:complete={isGoalComplete}
          style="width: {progressPercent}%"
        />
      </div>
      <div class="longform-goal-stats">
        <span>{sessionWords.toLocaleString()} / {$pluginSettings.sessionGoal.toLocaleString()} words</span>
        <span>{Math.round($goalProgress * 100)}%</span>
      </div>
    </div>
  </div>

  <!-- Current Project Stats -->
  <div class="longform-dashboard-section">
    <h3>Project Stats</h3>
    <div class="longform-stats-grid">
      <div class="longform-stat-item">
        <span class="longform-stat-value">{currentDraftWords.toLocaleString()}</span>
        <span class="longform-stat-label">Total Words</span>
      </div>
      <div class="longform-stat-item">
        <span class="longform-stat-value">{readingTime} min</span>
        <span class="longform-stat-label">Reading Time</span>
      </div>
    </div>
  </div>

  <!-- Writing Streak -->
  <div class="longform-dashboard-section">
    <h3>Writing Streak</h3>
    <div class="longform-streak-display">
      <span class="longform-streak-number">{streak}</span>
      <span class="longform-streak-label">{streak === 1 ? "day" : "days"}</span>
    </div>
  </div>

  <!-- Recent Sessions -->
  <div class="longform-dashboard-section">
    <h3>Recent Sessions</h3>
    <div class="longform-session-history">
      {#if recentSessions.length === 0}
        <div class="longform-session-item">
          <span class="longform-session-date">No sessions yet</span>
        </div>
      {:else}
        {#each recentSessions as session}
          <div class="longform-session-item">
            <span class="longform-session-date">{formatDate(session.start)}</span>
            <span class="longform-session-words">{session.total.toLocaleString()} words</span>
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>

<style>
  .longform-dashboard {
    padding: var(--size-4-2);
  }

  .longform-dashboard-section {
    margin-bottom: var(--size-4-4);
  }

  .longform-dashboard-section h3 {
    margin: 0 0 var(--size-4-2) 0;
    font-size: var(--font-ui-small);
    font-weight: var(--font-semibold);
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .longform-goal-progress {
    display: flex;
    flex-direction: column;
    gap: var(--size-4-2);
  }

  .longform-goal-progress-bar {
    height: 8px;
    background: var(--background-modifier-border);
    border-radius: 4px;
    overflow: hidden;
  }

  .longform-goal-progress-fill {
    height: 100%;
    background: var(--interactive-accent);
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .longform-goal-progress-fill.complete {
    background: var(--color-green);
  }

  .longform-goal-stats {
    display: flex;
    justify-content: space-between;
    font-size: var(--font-ui-smaller);
    color: var(--text-muted);
  }

  .longform-stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--size-4-2);
  }

  .longform-stat-item {
    display: flex;
    flex-direction: column;
    padding: var(--size-4-2);
    background: var(--background-secondary);
    border-radius: 4px;
  }

  .longform-stat-value {
    font-size: var(--font-ui-medium);
    font-weight: var(--font-semibold);
    color: var(--text-normal);
  }

  .longform-stat-label {
    font-size: var(--font-ui-smaller);
    color: var(--text-muted);
  }

  .longform-streak-display {
    display: flex;
    align-items: baseline;
    gap: var(--size-4-2);
    padding: var(--size-4-2);
    background: var(--background-secondary);
    border-radius: 4px;
  }

  .longform-streak-number {
    font-size: var(--font-ui-large);
    font-weight: var(--font-bold);
    color: var(--interactive-accent);
  }

  .longform-streak-label {
    font-size: var(--font-ui-small);
    color: var(--text-muted);
  }

  .longform-session-history {
    display: flex;
    flex-direction: column;
    gap: var(--size-4-1);
  }

  .longform-session-item {
    display: flex;
    justify-content: space-between;
    padding: var(--size-4-1) var(--size-4-2);
    background: var(--background-secondary);
    border-radius: 4px;
    font-size: var(--font-ui-smaller);
  }

  .longform-session-date {
    color: var(--text-muted);
  }

  .longform-session-words {
    color: var(--text-normal);
    font-weight: var(--font-medium);
  }
</style>
