<script lang="ts">
  import { sessions, pluginSettings, draftWordCounts } from "src/model/stores";
  import { selectedDraft } from "src/model/stores";
  import { goalProgress } from "../stores";
  import { getContext, onMount } from "svelte";
  import type { App } from "obsidian";

  const app: App = getContext("app");

  // Text Analytics state
  let textAnalytics: {
    fleschKincaid: number;
    avgSentenceLength: number;
    avgWordLength: number;
    sentenceCount: number;
    paragraphCount: number;
    overusedWords: Array<{ word: string; count: number }>;
    readabilityLevel: string;
  } | null = null;
  let isAnalyzing = false;

  // Calculate readability metrics
  function calculateFleschKincaid(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.match(/[a-zA-Z]/));
    const syllables = words.reduce((count, word) => count + countSyllables(word), 0);

    if (sentences.length === 0 || words.length === 0) return 0;

    const score = 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length);
    return Math.max(0, Math.min(100, score));
  }

  function countSyllables(word: string): number {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 3) return 1;

    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  }

  function getReadabilityLevel(score: number): string {
    if (score >= 90) return "Very Easy";
    if (score >= 80) return "Easy";
    if (score >= 70) return "Fairly Easy";
    if (score >= 60) return "Standard";
    if (score >= 50) return "Fairly Difficult";
    if (score >= 30) return "Difficult";
    return "Very Difficult";
  }

  function findOverusedWords(text: string): Array<{ word: string; count: number }> {
    const words = text.toLowerCase().split(/\s+/).filter(w => w.match(/^[a-z]{4,}$/));
    const stopWords = new Set(['that', 'this', 'with', 'have', 'will', 'your', 'from', 'they', 'been', 'were', 'said', 'each', 'which', 'their', 'would', 'there', 'could', 'other', 'into', 'more', 'some', 'very', 'when', 'come', 'made', 'than', 'then', 'them', 'these', 'what', 'about', 'just', 'over', 'such', 'only', 'also', 'back', 'after', 'most', 'even', 'know', 'because', 'through']);

    const wordCounts: Record<string, number> = {};
    words.forEach(word => {
      if (!stopWords.has(word)) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    });

    return Object.entries(wordCounts)
      .filter(([, count]) => count >= 5)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));
  }

  async function analyzeText() {
    if (!$selectedDraft || isAnalyzing) return;

    isAnalyzing = true;
    try {
      let fullText = "";

      if ($selectedDraft.format === "scenes") {
        // Read all scene files
        for (const scene of $selectedDraft.scenes) {
          const filePath = `${$selectedDraft.vaultPath}/${scene.title}.md`;
          const file = app.vault.getAbstractFileByPath(filePath);
          if (file && 'extension' in file) {
            const content = await app.vault.read(file as any);
            fullText += content + "\n\n";
          }
        }
      } else {
        // Single file draft
        const file = app.vault.getAbstractFileByPath($selectedDraft.vaultPath);
        if (file && 'extension' in file) {
          fullText = await app.vault.read(file as any);
        }
      }

      if (fullText.length === 0) {
        textAnalytics = null;
        return;
      }

      // Strip markdown syntax for cleaner analysis
      const cleanText = fullText
        .replace(/^#+\s+/gm, '') // Headers
        .replace(/\*\*|__/g, '') // Bold
        .replace(/\*|_/g, '') // Italic
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
        .replace(/`[^`]+`/g, '') // Inline code
        .replace(/```[\s\S]*?```/g, '') // Code blocks
        .replace(/^>\s+/gm, '') // Blockquotes
        .replace(/^[-*+]\s+/gm, '') // Lists
        .replace(/^\d+\.\s+/gm, ''); // Numbered lists

      const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const words = cleanText.split(/\s+/).filter(w => w.match(/[a-zA-Z]/));
      const paragraphs = cleanText.split(/\n\n+/).filter(p => p.trim().length > 0);

      const fleschKincaid = calculateFleschKincaid(cleanText);
      const avgSentenceLength = sentences.length > 0 ? Math.round(words.length / sentences.length) : 0;
      const avgWordLength = words.length > 0 ?
        (words.reduce((sum, w) => sum + w.replace(/[^a-zA-Z]/g, '').length, 0) / words.length).toFixed(1) : "0";

      textAnalytics = {
        fleschKincaid: Math.round(fleschKincaid),
        avgSentenceLength,
        avgWordLength: parseFloat(avgWordLength),
        sentenceCount: sentences.length,
        paragraphCount: paragraphs.length,
        overusedWords: findOverusedWords(cleanText),
        readabilityLevel: getReadabilityLevel(fleschKincaid)
      };
    } catch (e) {
      console.error("Error analyzing text:", e);
      textAnalytics = null;
    } finally {
      isAnalyzing = false;
    }
  }

  // Re-analyze when draft changes
  $: if ($selectedDraft) {
    analyzeText();
  }

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

  // Writing Analytics
  $: writingAnalytics = (() => {
    if ($sessions.length === 0) return null;

    // Calculate average words per session
    const totalWords = $sessions.reduce((sum, s) => sum + s.total, 0);
    const avgWordsPerSession = Math.round(totalWords / $sessions.length);

    // Find best and worst sessions
    const sortedSessions = [...$sessions].sort((a, b) => b.total - a.total);
    const bestSession = sortedSessions[0];
    const worstSession = sortedSessions.filter(s => s.total > 0).pop() || sortedSessions[sortedSessions.length - 1];

    // Calculate productivity by day of week
    const dayStats: Record<number, { total: number; count: number }> = {};
    $sessions.forEach(session => {
      const day = new Date(session.start).getDay();
      if (!dayStats[day]) {
        dayStats[day] = { total: 0, count: 0 };
      }
      dayStats[day].total += session.total;
      dayStats[day].count++;
    });

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const productivityByDay = dayNames.map((name, i) => ({
      name,
      avg: dayStats[i] ? Math.round(dayStats[i].total / dayStats[i].count) : 0
    }));

    // Find most productive day
    const bestDay = productivityByDay.reduce((best, day) =>
      day.avg > best.avg ? day : best, productivityByDay[0]);

    // Calculate weekly trend (last 4 weeks)
    const weeklyTotals: number[] = [];
    const now = new Date();
    for (let week = 0; week < 4; week++) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (week * 7) - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const weekTotal = $sessions
        .filter(s => {
          const sessionDate = new Date(s.start);
          return sessionDate >= weekStart && sessionDate < weekEnd;
        })
        .reduce((sum, s) => sum + s.total, 0);

      weeklyTotals.unshift(weekTotal);
    }

    // Calculate trend direction
    const recentWeeks = weeklyTotals.slice(-2);
    let trend = 'stable';
    if (recentWeeks.length === 2) {
      const diff = recentWeeks[1] - recentWeeks[0];
      if (diff > 100) trend = 'up';
      else if (diff < -100) trend = 'down';
    }

    return {
      avgWordsPerSession,
      bestSession,
      worstSession,
      productivityByDay,
      bestDay,
      weeklyTotals,
      trend,
      totalSessions: $sessions.length
    };
  })();
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

  <!-- Writing Analytics -->
  {#if writingAnalytics}
    <div class="longform-dashboard-section">
      <h3>Writing Analytics</h3>
      <div class="longform-analytics-grid">
        <div class="longform-analytics-item">
          <span class="longform-analytics-value">{writingAnalytics.avgWordsPerSession.toLocaleString()}</span>
          <span class="longform-analytics-label">Avg Words/Session</span>
        </div>
        <div class="longform-analytics-item">
          <span class="longform-analytics-value">{writingAnalytics.totalSessions}</span>
          <span class="longform-analytics-label">Total Sessions</span>
        </div>
      </div>

      <!-- Productivity by Day -->
      <div class="longform-productivity-chart">
        <div class="longform-chart-label">Productivity by Day</div>
        <div class="longform-day-bars">
          {#each writingAnalytics.productivityByDay as day}
            {@const maxAvg = Math.max(...writingAnalytics.productivityByDay.map(d => d.avg), 1)}
            <div class="longform-day-bar-container">
              <div class="longform-day-bar-track">
                <div
                  class="longform-day-bar-fill"
                  class:best={day.name === writingAnalytics.bestDay.name && day.avg > 0}
                  style="height: {(day.avg / maxAvg) * 100}%"
                />
              </div>
              <span class="longform-day-label">{day.name}</span>
            </div>
          {/each}
        </div>
        <div class="longform-best-day">
          Best day: {writingAnalytics.bestDay.name} ({writingAnalytics.bestDay.avg.toLocaleString()} avg)
        </div>
      </div>

      <!-- Weekly Trend -->
      <div class="longform-weekly-trend">
        <div class="longform-trend-header">
          <span>Weekly Trend</span>
          <span class="longform-trend-indicator" class:up={writingAnalytics.trend === 'up'} class:down={writingAnalytics.trend === 'down'}>
            {#if writingAnalytics.trend === 'up'}
              ↑ Improving
            {:else if writingAnalytics.trend === 'down'}
              ↓ Declining
            {:else}
              → Stable
            {/if}
          </span>
        </div>
        <div class="longform-weekly-bars">
          {#each writingAnalytics.weeklyTotals as weekTotal, i}
            {@const maxWeek = Math.max(...writingAnalytics.weeklyTotals, 1)}
            <div class="longform-week-bar-container" title="Week {i + 1}: {weekTotal.toLocaleString()} words">
              <div class="longform-week-bar-track">
                <div
                  class="longform-week-bar-fill"
                  style="width: {(weekTotal / maxWeek) * 100}%"
                />
              </div>
              <span class="longform-week-value">{weekTotal.toLocaleString()}</span>
            </div>
          {/each}
        </div>
      </div>

      <!-- Best/Worst Sessions -->
      <div class="longform-session-extremes-analytics">
        <div class="longform-extreme-item">
          <span class="longform-extreme-label">Best Session</span>
          <span class="longform-extreme-value">{writingAnalytics.bestSession.total.toLocaleString()} words</span>
          <span class="longform-extreme-date">{formatDate(writingAnalytics.bestSession.start)}</span>
        </div>
        {#if writingAnalytics.worstSession && writingAnalytics.worstSession !== writingAnalytics.bestSession}
          <div class="longform-extreme-item">
            <span class="longform-extreme-label">Lowest Session</span>
            <span class="longform-extreme-value">{writingAnalytics.worstSession.total.toLocaleString()} words</span>
            <span class="longform-extreme-date">{formatDate(writingAnalytics.worstSession.start)}</span>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Text Analytics -->
  {#if textAnalytics}
    <div class="longform-dashboard-section">
      <h3>Text Analytics</h3>

      <!-- Readability Score -->
      <div class="longform-readability-section">
        <div class="longform-readability-score">
          <div class="longform-readability-number">{textAnalytics.fleschKincaid}</div>
          <div class="longform-readability-label">Readability Score</div>
          <div class="longform-readability-level">{textAnalytics.readabilityLevel}</div>
        </div>
      </div>

      <!-- Text Stats -->
      <div class="longform-text-stats-grid">
        <div class="longform-text-stat">
          <span class="longform-text-stat-value">{textAnalytics.avgSentenceLength}</span>
          <span class="longform-text-stat-label">Avg Words/Sentence</span>
        </div>
        <div class="longform-text-stat">
          <span class="longform-text-stat-value">{textAnalytics.avgWordLength}</span>
          <span class="longform-text-stat-label">Avg Word Length</span>
        </div>
        <div class="longform-text-stat">
          <span class="longform-text-stat-value">{textAnalytics.sentenceCount.toLocaleString()}</span>
          <span class="longform-text-stat-label">Sentences</span>
        </div>
        <div class="longform-text-stat">
          <span class="longform-text-stat-value">{textAnalytics.paragraphCount.toLocaleString()}</span>
          <span class="longform-text-stat-label">Paragraphs</span>
        </div>
      </div>

      <!-- Overused Words -->
      {#if textAnalytics.overusedWords.length > 0}
        <div class="longform-overused-words">
          <div class="longform-overused-header">Frequently Used Words</div>
          <div class="longform-word-list">
            {#each textAnalytics.overusedWords as item}
              <div class="longform-word-item">
                <span class="longform-word-text">{item.word}</span>
                <span class="longform-word-count">{item.count}x</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Re-analyze button -->
      <button
        class="longform-analyze-button"
        on:click={analyzeText}
        disabled={isAnalyzing}
      >
        {isAnalyzing ? "Analyzing..." : "Re-analyze Text"}
      </button>
    </div>
  {:else if isAnalyzing}
    <div class="longform-dashboard-section">
      <h3>Text Analytics</h3>
      <!-- Skeleton loading state -->
      <div class="longform-skeleton-container">
        <div class="longform-skeleton longform-skeleton-circle" style="margin: 0 auto var(--size-4-2);"></div>
        <div class="longform-skeleton longform-skeleton-text" style="width: 40%; margin: 0 auto var(--size-4-1);"></div>
        <div class="longform-skeleton longform-skeleton-text" style="width: 30%; margin: 0 auto var(--size-4-3);"></div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--size-4-2);">
          <div class="longform-skeleton longform-skeleton-stat"></div>
          <div class="longform-skeleton longform-skeleton-stat"></div>
          <div class="longform-skeleton longform-skeleton-stat"></div>
          <div class="longform-skeleton longform-skeleton-stat"></div>
        </div>
      </div>
    </div>
  {/if}
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

  /* Writing Analytics */
  .longform-analytics-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--size-4-2);
    margin-bottom: var(--size-4-3);
  }

  .longform-analytics-item {
    display: flex;
    flex-direction: column;
    padding: var(--size-4-2);
    background: var(--background-secondary);
    border-radius: 4px;
  }

  .longform-analytics-value {
    font-size: var(--font-ui-medium);
    font-weight: var(--font-semibold);
    color: var(--text-normal);
  }

  .longform-analytics-label {
    font-size: var(--font-ui-smaller);
    color: var(--text-muted);
  }

  /* Productivity Chart */
  .longform-productivity-chart {
    margin-bottom: var(--size-4-3);
  }

  .longform-chart-label {
    font-size: var(--font-ui-smaller);
    color: var(--text-muted);
    margin-bottom: var(--size-4-2);
  }

  .longform-day-bars {
    display: flex;
    gap: var(--size-4-1);
    align-items: flex-end;
    height: 60px;
    padding: var(--size-4-2);
    background: var(--background-secondary);
    border-radius: 4px;
  }

  .longform-day-bar-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
  }

  .longform-day-bar-track {
    flex: 1;
    width: 100%;
    display: flex;
    align-items: flex-end;
  }

  .longform-day-bar-fill {
    width: 100%;
    background: var(--interactive-accent);
    border-radius: 2px 2px 0 0;
    min-height: 2px;
    transition: height 0.3s ease;
  }

  .longform-day-bar-fill.best {
    background: var(--color-green);
  }

  .longform-day-label {
    font-size: 9px;
    color: var(--text-muted);
    margin-top: var(--size-4-1);
  }

  .longform-best-day {
    font-size: var(--font-ui-smaller);
    color: var(--text-muted);
    margin-top: var(--size-4-2);
  }

  /* Weekly Trend */
  .longform-weekly-trend {
    margin-bottom: var(--size-4-3);
  }

  .longform-trend-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--size-4-2);
    font-size: var(--font-ui-smaller);
    color: var(--text-muted);
  }

  .longform-trend-indicator {
    font-weight: var(--font-medium);
    color: var(--text-muted);
  }

  .longform-trend-indicator.up {
    color: var(--color-green);
  }

  .longform-trend-indicator.down {
    color: var(--color-red);
  }

  .longform-weekly-bars {
    display: flex;
    flex-direction: column;
    gap: var(--size-4-1);
  }

  .longform-week-bar-container {
    display: flex;
    align-items: center;
    gap: var(--size-4-2);
  }

  .longform-week-bar-track {
    flex: 1;
    height: 6px;
    background: var(--background-modifier-border);
    border-radius: 3px;
    overflow: hidden;
  }

  .longform-week-bar-fill {
    height: 100%;
    background: var(--interactive-accent);
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .longform-week-value {
    font-size: var(--font-ui-smaller);
    color: var(--text-muted);
    min-width: 50px;
    text-align: right;
  }

  /* Session Extremes Analytics */
  .longform-session-extremes-analytics {
    display: flex;
    flex-direction: column;
    gap: var(--size-4-2);
  }

  .longform-extreme-item {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--size-4-1);
    padding: var(--size-4-2);
    background: var(--background-secondary);
    border-radius: 4px;
  }

  .longform-extreme-label {
    font-size: var(--font-ui-smaller);
    color: var(--text-muted);
    min-width: 80px;
  }

  .longform-extreme-value {
    font-size: var(--font-ui-small);
    font-weight: var(--font-medium);
    color: var(--text-normal);
  }

  .longform-extreme-date {
    font-size: var(--font-ui-smaller);
    color: var(--text-faint);
    margin-left: auto;
  }

  /* Text Analytics */
  .longform-readability-section {
    margin-bottom: var(--size-4-3);
  }

  .longform-readability-score {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--size-4-3);
    background: var(--background-secondary);
    border-radius: 8px;
  }

  .longform-readability-number {
    font-size: 2.5em;
    font-weight: var(--font-bold);
    color: var(--interactive-accent);
    line-height: 1;
  }

  .longform-readability-label {
    font-size: var(--font-ui-smaller);
    color: var(--text-muted);
    margin-top: var(--size-4-1);
  }

  .longform-readability-level {
    font-size: var(--font-ui-small);
    font-weight: var(--font-medium);
    color: var(--text-normal);
    margin-top: var(--size-4-1);
  }

  .longform-text-stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--size-4-2);
    margin-bottom: var(--size-4-3);
  }

  .longform-text-stat {
    display: flex;
    flex-direction: column;
    padding: var(--size-4-2);
    background: var(--background-secondary);
    border-radius: 4px;
  }

  .longform-text-stat-value {
    font-size: var(--font-ui-medium);
    font-weight: var(--font-semibold);
    color: var(--text-normal);
  }

  .longform-text-stat-label {
    font-size: var(--font-ui-smaller);
    color: var(--text-muted);
  }

  .longform-overused-words {
    margin-bottom: var(--size-4-3);
  }

  .longform-overused-header {
    font-size: var(--font-ui-smaller);
    color: var(--text-muted);
    margin-bottom: var(--size-4-2);
  }

  .longform-word-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-4-1);
  }

  .longform-word-item {
    display: flex;
    align-items: center;
    gap: var(--size-4-1);
    padding: var(--size-2-1) var(--size-4-2);
    background: var(--background-secondary);
    border-radius: 12px;
    font-size: var(--font-ui-smaller);
  }

  .longform-word-text {
    color: var(--text-normal);
  }

  .longform-word-count {
    color: var(--text-muted);
    font-size: 10px;
  }

  .longform-analyze-button {
    width: 100%;
    padding: var(--size-4-2);
    background: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 4px;
    color: var(--text-muted);
    font-size: var(--font-ui-smaller);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .longform-analyze-button:hover:not(:disabled) {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }

  .longform-analyze-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .longform-analyzing {
    padding: var(--size-4-3);
    text-align: center;
    color: var(--text-muted);
    font-size: var(--font-ui-smaller);
  }
</style>
