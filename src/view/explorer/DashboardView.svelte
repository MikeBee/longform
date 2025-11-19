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

  // Scene statistics for multi-scene drafts
  $: sceneStats = (() => {
    if (!$selectedDraft || $selectedDraft.format !== "scenes" || !$draftWordCounts) {
      return null;
    }
    const counts = $draftWordCounts[$selectedDraft.vaultPath];
    if (!counts || typeof counts === "number") return null;

    const scenes = $selectedDraft.scenes;
    const sceneData = scenes.map(scene => ({
      title: scene.title,
      words: counts[scene.title] || 0,
      indent: scene.indent
    }));

    const totalScenes = scenes.length;
    const avgWords = totalScenes > 0 ? Math.round(currentDraftWords / totalScenes) : 0;
    const maxWords = Math.max(...sceneData.map(s => s.words), 1);
    const minWords = Math.min(...sceneData.filter(s => s.words > 0).map(s => s.words), 0);

    // Find longest and shortest scenes
    const sortedByWords = [...sceneData].sort((a, b) => b.words - a.words);
    const longest = sortedByWords[0];
    const shortest = sortedByWords.filter(s => s.words > 0).pop();

    return {
      sceneData,
      totalScenes,
      avgWords,
      maxWords,
      minWords,
      longest,
      shortest
    };
  })();

  // Estimated complexity based on word count patterns
  $: complexity = (() => {
    if (!sceneStats || sceneStats.totalScenes === 0) return null;

    // Calculate variance in scene lengths
    const variance = sceneStats.sceneData.reduce((sum, scene) => {
      return sum + Math.pow(scene.words - sceneStats.avgWords, 2);
    }, 0) / sceneStats.totalScenes;

    const stdDev = Math.sqrt(variance);
    const coeffOfVariation = sceneStats.avgWords > 0 ? (stdDev / sceneStats.avgWords) * 100 : 0;

    // Rough reading level estimate based on avg scene length
    let readingLevel = "Easy";
    if (sceneStats.avgWords > 2000) readingLevel = "Complex";
    else if (sceneStats.avgWords > 1000) readingLevel = "Moderate";

    return {
      stdDev: Math.round(stdDev),
      coeffOfVariation: Math.round(coeffOfVariation),
      readingLevel
    };
  })();

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
      {#if sceneStats}
        <div class="longform-stat-item">
          <span class="longform-stat-value">{sceneStats.totalScenes}</span>
          <span class="longform-stat-label">Scenes</span>
        </div>
        <div class="longform-stat-item">
          <span class="longform-stat-value">{sceneStats.avgWords.toLocaleString()}</span>
          <span class="longform-stat-label">Avg Words/Scene</span>
        </div>
      {/if}
    </div>
  </div>

  <!-- Scene Distribution -->
  {#if sceneStats && sceneStats.sceneData.length > 0}
    <div class="longform-dashboard-section">
      <h3>Scene Distribution</h3>
      <div class="longform-scene-distribution">
        {#each sceneStats.sceneData as scene}
          <div class="longform-scene-bar-container" title="{scene.title}: {scene.words.toLocaleString()} words">
            <div class="longform-scene-bar-label">{scene.title}</div>
            <div class="longform-scene-bar-track">
              <div
                class="longform-scene-bar-fill"
                style="width: {(scene.words / sceneStats.maxWords) * 100}%"
              />
            </div>
            <div class="longform-scene-bar-value">{scene.words.toLocaleString()}</div>
          </div>
        {/each}
      </div>
      {#if sceneStats.longest && sceneStats.shortest}
        <div class="longform-scene-extremes">
          <span>Longest: {sceneStats.longest.title} ({sceneStats.longest.words.toLocaleString()}w)</span>
          {#if sceneStats.shortest && sceneStats.shortest !== sceneStats.longest}
            <span>Shortest: {sceneStats.shortest.title} ({sceneStats.shortest.words.toLocaleString()}w)</span>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Complexity Analysis -->
    {#if complexity}
      <div class="longform-dashboard-section">
        <h3>Analysis</h3>
        <div class="longform-complexity-grid">
          <div class="longform-complexity-item">
            <span class="longform-complexity-label">Scene Length Variance</span>
            <span class="longform-complexity-value">{complexity.coeffOfVariation}%</span>
          </div>
          <div class="longform-complexity-item">
            <span class="longform-complexity-label">Structure</span>
            <span class="longform-complexity-value">{complexity.readingLevel}</span>
          </div>
        </div>
      </div>
    {/if}
  {/if}

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

  /* Scene Distribution */
  .longform-scene-distribution {
    display: flex;
    flex-direction: column;
    gap: var(--size-4-1);
    max-height: 200px;
    overflow-y: auto;
  }

  .longform-scene-bar-container {
    display: grid;
    grid-template-columns: 80px 1fr 50px;
    gap: var(--size-4-1);
    align-items: center;
    font-size: var(--font-ui-smaller);
  }

  .longform-scene-bar-label {
    color: var(--text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .longform-scene-bar-track {
    height: 6px;
    background: var(--background-modifier-border);
    border-radius: 3px;
    overflow: hidden;
  }

  .longform-scene-bar-fill {
    height: 100%;
    background: var(--interactive-accent);
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .longform-scene-bar-value {
    color: var(--text-muted);
    text-align: right;
    font-size: var(--font-ui-smaller);
  }

  .longform-scene-extremes {
    display: flex;
    flex-direction: column;
    gap: var(--size-4-1);
    margin-top: var(--size-4-2);
    font-size: var(--font-ui-smaller);
    color: var(--text-muted);
  }

  /* Complexity Analysis */
  .longform-complexity-grid {
    display: flex;
    flex-direction: column;
    gap: var(--size-4-1);
  }

  .longform-complexity-item {
    display: flex;
    justify-content: space-between;
    padding: var(--size-4-1) var(--size-4-2);
    background: var(--background-secondary);
    border-radius: 4px;
    font-size: var(--font-ui-smaller);
  }

  .longform-complexity-label {
    color: var(--text-muted);
  }

  .longform-complexity-value {
    color: var(--text-normal);
    font-weight: var(--font-medium);
  }
</style>
