<script lang="ts">
  import { getContext } from "svelte";
  import type { App } from "obsidian";
  import { selectedDraft, projectReferences } from "src/model/stores";
  import type { Character, Location, ResearchNote } from "src/model/types";
  import {
    getProjectReferences,
    deleteCharacter,
    deleteLocation,
    deleteResearchNote,
  } from "src/model/project-references";
  import { CharacterModal } from "../references/CharacterModal";
  import { LocationModal } from "../references/LocationModal";
  import { ResearchNoteModal } from "../references/ResearchNoteModal";

  const app: App = getContext("app");

  // Current project title
  $: projectTitle = $selectedDraft?.title || "";

  // Get references for current project
  $: refs = projectTitle ? getProjectReferences(projectTitle) : null;

  // Re-fetch when store updates
  $: if ($projectReferences && projectTitle) {
    refs = getProjectReferences(projectTitle);
  }

  // Active section
  let activeSection: "characters" | "locations" | "research" = "characters";

  // Search/filter
  let searchQuery = "";

  // Filtered items
  $: filteredCharacters = refs?.characters.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  $: filteredLocations = refs?.locations.filter(l =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  $: filteredNotes = refs?.researchNotes.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.tags?.some(t => t.includes(searchQuery.toLowerCase()))
  ) || [];

  function refresh() {
    refs = getProjectReferences(projectTitle);
  }

  // Character actions
  function addNewCharacter() {
    new CharacterModal(app, projectTitle, null, refresh).open();
  }

  function editCharacter(character: Character) {
    new CharacterModal(app, projectTitle, character, refresh).open();
  }

  function removeCharacter(character: Character) {
    if (confirm(`Delete character "${character.name}"?`)) {
      deleteCharacter(projectTitle, character.id);
      refresh();
    }
  }

  // Location actions
  function addNewLocation() {
    new LocationModal(app, projectTitle, null, refresh).open();
  }

  function editLocation(location: Location) {
    new LocationModal(app, projectTitle, location, refresh).open();
  }

  function removeLocation(location: Location) {
    if (confirm(`Delete location "${location.name}"?`)) {
      deleteLocation(projectTitle, location.id);
      refresh();
    }
  }

  // Research note actions
  function addNewNote() {
    new ResearchNoteModal(app, projectTitle, null, refresh).open();
  }

  function editNote(note: ResearchNote) {
    new ResearchNoteModal(app, projectTitle, note, refresh).open();
  }

  function removeNote(note: ResearchNote) {
    if (confirm(`Delete note "${note.title}"?`)) {
      deleteResearchNote(projectTitle, note.id);
      refresh();
    }
  }

  // Get character name by ID for relationships
  function getCharacterName(id: string): string {
    return refs?.characters.find(c => c.id === id)?.name || "Unknown";
  }
</script>

<div class="longform-references">
  {#if !$selectedDraft}
    <div class="longform-references-empty">
      Select a project to view references
    </div>
  {:else}
    <!-- Section tabs -->
    <div class="longform-references-tabs">
      <button
        class="longform-ref-tab"
        class:active={activeSection === "characters"}
        on:click={() => activeSection = "characters"}
      >
        Characters ({refs?.characters.length || 0})
      </button>
      <button
        class="longform-ref-tab"
        class:active={activeSection === "locations"}
        on:click={() => activeSection = "locations"}
      >
        Locations ({refs?.locations.length || 0})
      </button>
      <button
        class="longform-ref-tab"
        class:active={activeSection === "research"}
        on:click={() => activeSection = "research"}
      >
        Research ({refs?.researchNotes.length || 0})
      </button>
    </div>

    <!-- Search -->
    <div class="longform-references-search">
      <input
        type="text"
        placeholder="Search..."
        bind:value={searchQuery}
      />
    </div>

    <!-- Characters section -->
    {#if activeSection === "characters"}
      <div class="longform-references-section">
        <button class="longform-add-button" on:click={addNewCharacter}>
          + Add Character
        </button>

        {#if filteredCharacters.length === 0}
          <div class="longform-references-empty-list">
            No characters yet
          </div>
        {:else}
          <div class="longform-references-list">
            {#each filteredCharacters as character}
              <div class="longform-reference-item" on:dblclick={() => editCharacter(character)}>
                <div class="longform-ref-header">
                  {#if character.colorTag}
                    <span class="longform-ref-color longform-color-{character.colorTag}"></span>
                  {/if}
                  <span class="longform-ref-name">{character.name}</span>
                  <div class="longform-ref-actions">
                    <button on:click={() => editCharacter(character)} title="Edit">Edit</button>
                    <button on:click={() => removeCharacter(character)} title="Delete">Del</button>
                  </div>
                </div>
                {#if character.description}
                  <div class="longform-ref-description">{character.description}</div>
                {/if}
                {#if character.traits && character.traits.length > 0}
                  <div class="longform-ref-traits">
                    {#each character.traits as trait}
                      <span class="longform-trait-tag">{trait}</span>
                    {/each}
                  </div>
                {/if}
                {#if character.relationships && character.relationships.length > 0}
                  <div class="longform-ref-relationships">
                    {#each character.relationships as rel}
                      <span class="longform-relationship">
                        {getCharacterName(rel.characterId)}: {rel.relationship}
                      </span>
                    {/each}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    <!-- Locations section -->
    {#if activeSection === "locations"}
      <div class="longform-references-section">
        <button class="longform-add-button" on:click={addNewLocation}>
          + Add Location
        </button>

        {#if filteredLocations.length === 0}
          <div class="longform-references-empty-list">
            No locations yet
          </div>
        {:else}
          <div class="longform-references-list">
            {#each filteredLocations as location}
              <div class="longform-reference-item" on:dblclick={() => editLocation(location)}>
                <div class="longform-ref-header">
                  {#if location.colorTag}
                    <span class="longform-ref-color longform-color-{location.colorTag}"></span>
                  {/if}
                  <span class="longform-ref-name">{location.name}</span>
                  <div class="longform-ref-actions">
                    <button on:click={() => editLocation(location)} title="Edit">Edit</button>
                    <button on:click={() => removeLocation(location)} title="Delete">Del</button>
                  </div>
                </div>
                {#if location.description}
                  <div class="longform-ref-description">{location.description}</div>
                {/if}
                {#if location.details}
                  <div class="longform-ref-details">{location.details}</div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    <!-- Research section -->
    {#if activeSection === "research"}
      <div class="longform-references-section">
        <button class="longform-add-button" on:click={addNewNote}>
          + Add Research Note
        </button>

        {#if filteredNotes.length === 0}
          <div class="longform-references-empty-list">
            No research notes yet
          </div>
        {:else}
          <div class="longform-references-list">
            {#each filteredNotes as note}
              <div class="longform-reference-item" on:dblclick={() => editNote(note)}>
                <div class="longform-ref-header">
                  <span class="longform-ref-name">{note.title}</span>
                  <div class="longform-ref-actions">
                    <button on:click={() => editNote(note)} title="Edit">Edit</button>
                    <button on:click={() => removeNote(note)} title="Delete">Del</button>
                  </div>
                </div>
                {#if note.content}
                  <div class="longform-ref-content">
                    {note.content.slice(0, 150)}{note.content.length > 150 ? '...' : ''}
                  </div>
                {/if}
                {#if note.tags && note.tags.length > 0}
                  <div class="longform-ref-tags">
                    {#each note.tags as tag}
                      <span class="longform-tag">{tag}</span>
                    {/each}
                  </div>
                {/if}
                {#if note.sources && note.sources.length > 0}
                  <div class="longform-ref-sources">
                    {note.sources.length} source{note.sources.length !== 1 ? 's' : ''}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  {/if}
</div>

<style>
  .longform-references {
    padding: var(--size-4-2);
  }

  .longform-references-empty {
    color: var(--text-muted);
    text-align: center;
    padding: var(--size-4-4);
  }

  .longform-references-tabs {
    display: flex;
    gap: var(--size-4-1);
    margin-bottom: var(--size-4-2);
  }

  .longform-ref-tab {
    flex: 1;
    padding: var(--size-4-1) var(--size-4-2);
    background: var(--background-secondary);
    border: none;
    border-radius: 4px;
    font-size: var(--font-ui-smaller);
    color: var(--text-muted);
    cursor: pointer;
  }

  .longform-ref-tab.active {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
  }

  .longform-references-search {
    margin-bottom: var(--size-4-2);
  }

  .longform-references-search input {
    width: 100%;
    padding: var(--size-4-1) var(--size-4-2);
    border: 1px solid var(--background-modifier-border);
    border-radius: 4px;
    background: var(--background-primary);
    color: var(--text-normal);
    font-size: var(--font-ui-smaller);
  }

  .longform-add-button {
    width: 100%;
    padding: var(--size-4-2);
    margin-bottom: var(--size-4-2);
    background: var(--background-secondary);
    border: 1px dashed var(--background-modifier-border);
    border-radius: 4px;
    color: var(--text-muted);
    font-size: var(--font-ui-smaller);
    cursor: pointer;
  }

  .longform-add-button:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }

  .longform-references-empty-list {
    color: var(--text-muted);
    text-align: center;
    padding: var(--size-4-2);
    font-size: var(--font-ui-smaller);
  }

  .longform-references-list {
    display: flex;
    flex-direction: column;
    gap: var(--size-4-2);
  }

  .longform-reference-item {
    padding: var(--size-4-2);
    background: var(--background-secondary);
    border-radius: 4px;
    cursor: pointer;
  }

  .longform-reference-item:hover {
    background: var(--background-modifier-hover);
  }

  .longform-ref-header {
    display: flex;
    align-items: center;
    gap: var(--size-4-1);
    margin-bottom: var(--size-4-1);
  }

  .longform-ref-color {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .longform-ref-name {
    flex: 1;
    font-weight: var(--font-medium);
    font-size: var(--font-ui-small);
  }

  .longform-ref-actions {
    display: flex;
    gap: var(--size-4-1);
  }

  .longform-ref-actions button {
    padding: 2px 6px;
    font-size: 10px;
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 3px;
    color: var(--text-muted);
    cursor: pointer;
  }

  .longform-ref-actions button:hover {
    color: var(--text-normal);
  }

  .longform-ref-description,
  .longform-ref-content {
    font-size: var(--font-ui-smaller);
    color: var(--text-muted);
    margin-bottom: var(--size-4-1);
    line-height: 1.4;
  }

  .longform-ref-details {
    font-size: var(--font-ui-smaller);
    color: var(--text-faint);
    font-style: italic;
  }

  .longform-ref-traits,
  .longform-ref-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-4-1);
    margin-top: var(--size-4-1);
  }

  .longform-trait-tag,
  .longform-tag {
    padding: 2px 6px;
    background: var(--background-primary);
    border-radius: 8px;
    font-size: 10px;
    color: var(--text-muted);
  }

  .longform-ref-relationships {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: var(--size-4-1);
    font-size: var(--font-ui-smaller);
    color: var(--text-faint);
  }

  .longform-ref-sources {
    font-size: 10px;
    color: var(--text-faint);
    margin-top: var(--size-4-1);
  }

  /* Color tags - reuse from SceneList */
  .longform-color-red { background-color: var(--color-red); }
  .longform-color-orange { background-color: var(--color-orange); }
  .longform-color-yellow { background-color: var(--color-yellow); }
  .longform-color-green { background-color: var(--color-green); }
  .longform-color-blue { background-color: var(--color-blue); }
  .longform-color-purple { background-color: var(--color-purple); }
  .longform-color-pink { background-color: var(--color-pink); }
  .longform-color-gray { background-color: var(--text-muted); }
</style>
