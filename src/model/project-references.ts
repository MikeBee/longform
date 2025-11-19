import type { App } from "obsidian";
import { projectReferences } from "./stores";
import type { Character, Location, ResearchNote, ProjectReferences } from "./types";
import { get } from "svelte/store";

/**
 * Generate a unique ID for reference items.
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Get empty project references.
 */
export function getEmptyProjectReferences(): ProjectReferences {
  return {
    characters: [],
    locations: [],
    researchNotes: [],
  };
}

/**
 * Get references for a project, creating empty if doesn't exist.
 */
export function getProjectReferences(projectTitle: string): ProjectReferences {
  const refs = get(projectReferences);
  return refs[projectTitle] || getEmptyProjectReferences();
}

/**
 * Save project references to the store.
 */
export function saveProjectReferences(
  projectTitle: string,
  refs: ProjectReferences
): void {
  projectReferences.update((current) => ({
    ...current,
    [projectTitle]: refs,
  }));
}

// Character operations
export function addCharacter(projectTitle: string, character: Omit<Character, "id">): Character {
  const refs = getProjectReferences(projectTitle);
  const newCharacter: Character = {
    ...character,
    id: generateId(),
  };
  refs.characters.push(newCharacter);
  saveProjectReferences(projectTitle, refs);
  return newCharacter;
}

export function updateCharacter(projectTitle: string, character: Character): void {
  const refs = getProjectReferences(projectTitle);
  const index = refs.characters.findIndex((c) => c.id === character.id);
  if (index !== -1) {
    refs.characters[index] = character;
    saveProjectReferences(projectTitle, refs);
  }
}

export function deleteCharacter(projectTitle: string, characterId: string): void {
  const refs = getProjectReferences(projectTitle);
  refs.characters = refs.characters.filter((c) => c.id !== characterId);
  // Also remove from relationships
  refs.characters.forEach((c) => {
    if (c.relationships) {
      c.relationships = c.relationships.filter((r) => r.characterId !== characterId);
    }
  });
  saveProjectReferences(projectTitle, refs);
}

export function getCharacter(projectTitle: string, characterId: string): Character | undefined {
  const refs = getProjectReferences(projectTitle);
  return refs.characters.find((c) => c.id === characterId);
}

// Location operations
export function addLocation(projectTitle: string, location: Omit<Location, "id">): Location {
  const refs = getProjectReferences(projectTitle);
  const newLocation: Location = {
    ...location,
    id: generateId(),
  };
  refs.locations.push(newLocation);
  saveProjectReferences(projectTitle, refs);
  return newLocation;
}

export function updateLocation(projectTitle: string, location: Location): void {
  const refs = getProjectReferences(projectTitle);
  const index = refs.locations.findIndex((l) => l.id === location.id);
  if (index !== -1) {
    refs.locations[index] = location;
    saveProjectReferences(projectTitle, refs);
  }
}

export function deleteLocation(projectTitle: string, locationId: string): void {
  const refs = getProjectReferences(projectTitle);
  refs.locations = refs.locations.filter((l) => l.id !== locationId);
  saveProjectReferences(projectTitle, refs);
}

export function getLocation(projectTitle: string, locationId: string): Location | undefined {
  const refs = getProjectReferences(projectTitle);
  return refs.locations.find((l) => l.id === locationId);
}

// Research Note operations
export function addResearchNote(
  projectTitle: string,
  note: Omit<ResearchNote, "id" | "createdAt" | "updatedAt">
): ResearchNote {
  const refs = getProjectReferences(projectTitle);
  const now = new Date();
  const newNote: ResearchNote = {
    ...note,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  refs.researchNotes.push(newNote);
  saveProjectReferences(projectTitle, refs);
  return newNote;
}

export function updateResearchNote(projectTitle: string, note: ResearchNote): void {
  const refs = getProjectReferences(projectTitle);
  const index = refs.researchNotes.findIndex((n) => n.id === note.id);
  if (index !== -1) {
    refs.researchNotes[index] = {
      ...note,
      updatedAt: new Date(),
    };
    saveProjectReferences(projectTitle, refs);
  }
}

export function deleteResearchNote(projectTitle: string, noteId: string): void {
  const refs = getProjectReferences(projectTitle);
  refs.researchNotes = refs.researchNotes.filter((n) => n.id !== noteId);
  saveProjectReferences(projectTitle, refs);
}

export function getResearchNote(projectTitle: string, noteId: string): ResearchNote | undefined {
  const refs = getProjectReferences(projectTitle);
  return refs.researchNotes.find((n) => n.id === noteId);
}

// Get all unique tags from research notes
export function getAllTags(projectTitle: string): string[] {
  const refs = getProjectReferences(projectTitle);
  const tagSet = new Set<string>();
  refs.researchNotes.forEach((note) => {
    note.tags?.forEach((tag) => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
}

// Get research notes by tag
export function getResearchNotesByTag(projectTitle: string, tag: string): ResearchNote[] {
  const refs = getProjectReferences(projectTitle);
  return refs.researchNotes.filter((note) => note.tags?.includes(tag));
}

// Get characters/locations that appear in a scene
export function getSceneCharacters(projectTitle: string, sceneTitle: string): Character[] {
  const refs = getProjectReferences(projectTitle);
  return refs.characters.filter((c) => c.scenes?.includes(sceneTitle));
}

export function getSceneLocations(projectTitle: string, sceneTitle: string): Location[] {
  const refs = getProjectReferences(projectTitle);
  return refs.locations.filter((l) => l.scenes?.includes(sceneTitle));
}

export function getSceneResearchNotes(projectTitle: string, sceneTitle: string): ResearchNote[] {
  const refs = getProjectReferences(projectTitle);
  return refs.researchNotes.filter((n) => n.linkedScenes?.includes(sceneTitle));
}

// Color tag options for characters and locations
export const REFERENCE_COLOR_OPTIONS = [
  { value: "", label: "None" },
  { value: "red", label: "Red" },
  { value: "orange", label: "Orange" },
  { value: "yellow", label: "Yellow" },
  { value: "green", label: "Green" },
  { value: "blue", label: "Blue" },
  { value: "purple", label: "Purple" },
  { value: "pink", label: "Pink" },
  { value: "gray", label: "Gray" },
];
