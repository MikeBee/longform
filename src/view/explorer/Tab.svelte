<script lang="ts">
  import { type ExplorerTab, selectedTab } from "src/view/stores";

  export let tab: ExplorerTab;
</script>

<button
  class="tab-button"
  class:selected={$selectedTab === tab}
  on:click={() => selectedTab.set(tab)}
>
  {#if tab == "Scenes"}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="clickable-icon lucide lucide-gallery-horizontal-end"
      ><path d="M2 7v10" /><path d="M6 5v14" /><rect
        width="12"
        height="18"
        x="10"
        y="3"
        rx="2"
      /></svg
    >
  {/if}
  {#if tab == "Project"}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="clickable-icon lucide lucide-book-text"
      ><path
        d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"
      /><path d="M8 11h8" /><path d="M8 7h6" /></svg
    >
  {/if}
  {#if tab == "Compile"}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="clickable-icon lucide lucide-blocks"
      ><rect width="7" height="7" x="14" y="3" rx="1" /><path
        d="M10 21V8a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H3"
      /></svg
    >
  {/if}
  {#if tab == "Dashboard"}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="clickable-icon lucide lucide-layout-dashboard"
      ><rect width="7" height="9" x="3" y="3" rx="1" /><rect
        width="7"
        height="5"
        x="14"
        y="3"
        rx="1"
      /><rect width="7" height="9" x="14" y="12" rx="1" /><rect
        width="7"
        height="5"
        x="3"
        y="16"
        rx="1"
      /></svg
    >
  {/if}
  {#if tab == "References"}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="clickable-icon lucide lucide-library"
      ><path d="m16 6 4 14" /><path d="M12 6v14" /><path
        d="M8 8v12" /><path d="M4 4v16" /></svg
    >
  {/if}
  {tab}
</button>

<style>
  .tab-button {
    display: inline-flex;
    align-items: center;
    gap: 0.35em;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    border-radius: 0;
    padding: 0.6em 0.8em;
    box-shadow: none;
    margin: 0;
    color: var(--text-muted);
    font-size: var(--font-ui-smaller);
    font-weight: var(--font-medium);
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.15s ease;
    position: relative;
  }

  .tab-button svg {
    width: 14px;
    height: 14px;
    opacity: 0.7;
    transition: opacity 0.15s ease;
  }

  .tab-button:hover {
    color: var(--text-normal);
    background-color: var(--background-modifier-hover);
  }

  .tab-button:hover svg {
    opacity: 1;
  }

  .tab-button.selected {
    color: var(--text-accent);
    border-bottom-color: var(--text-accent);
    background: none;
  }

  .tab-button.selected svg {
    opacity: 1;
  }

  .tab-button:active {
    transform: scale(0.98);
  }
</style>
