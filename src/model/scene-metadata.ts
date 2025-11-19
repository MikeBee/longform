import type { App, TFile } from "obsidian";
import { sceneMetadata } from "./stores";
import type { SceneMetadata, Draft } from "./types";

/**
 * Get the key for storing scene metadata in the store.
 */
export function getSceneMetadataKey(draftPath: string, sceneTitle: string): string {
  return `${draftPath}/${sceneTitle}`;
}

/**
 * Read scene metadata from a file's frontmatter.
 */
export async function readSceneMetadata(
  app: App,
  filePath: string
): Promise<SceneMetadata | null> {
  const file = app.vault.getAbstractFileByPath(filePath);
  if (!file || !('extension' in file)) {
    return null;
  }

  const cache = app.metadataCache.getFileCache(file as TFile);
  if (!cache?.frontmatter) {
    return null;
  }

  const longformData = cache.frontmatter.longform;
  if (!longformData) {
    return null;
  }

  return {
    synopsis: longformData.synopsis,
    status: longformData.status,
    colorTag: longformData.colorTag,
    notes: longformData.notes,
  };
}

/**
 * Write scene metadata to a file's frontmatter.
 */
export async function writeSceneMetadata(
  app: App,
  filePath: string,
  metadata: SceneMetadata
): Promise<void> {
  const file = app.vault.getAbstractFileByPath(filePath);
  if (!file || !('extension' in file)) {
    return;
  }

  await app.fileManager.processFrontMatter(file as TFile, (frontmatter) => {
    if (!frontmatter.longform) {
      frontmatter.longform = {};
    }

    // Only set non-empty values
    if (metadata.synopsis) {
      frontmatter.longform.synopsis = metadata.synopsis;
    } else {
      delete frontmatter.longform.synopsis;
    }

    if (metadata.status) {
      frontmatter.longform.status = metadata.status;
    } else {
      delete frontmatter.longform.status;
    }

    if (metadata.colorTag) {
      frontmatter.longform.colorTag = metadata.colorTag;
    } else {
      delete frontmatter.longform.colorTag;
    }

    if (metadata.notes) {
      frontmatter.longform.notes = metadata.notes;
    } else {
      delete frontmatter.longform.notes;
    }

    // Clean up empty longform object
    if (Object.keys(frontmatter.longform).length === 0) {
      delete frontmatter.longform;
    }
  });
}

/**
 * Load all scene metadata for a draft and update the store.
 */
export async function loadDraftSceneMetadata(
  app: App,
  draft: Draft
): Promise<void> {
  if (draft.format !== "scenes") {
    return;
  }

  const updates: Record<string, SceneMetadata> = {};

  for (const scene of draft.scenes) {
    const filePath = `${draft.vaultPath}/${scene.title}.md`;
    const metadata = await readSceneMetadata(app, filePath);
    if (metadata) {
      const key = getSceneMetadataKey(draft.vaultPath, scene.title);
      updates[key] = metadata;
    }
  }

  sceneMetadata.update((current) => ({
    ...current,
    ...updates,
  }));
}

/**
 * Update scene metadata in the store and write to file.
 */
export async function updateSceneMetadata(
  app: App,
  draftPath: string,
  sceneTitle: string,
  metadata: SceneMetadata
): Promise<void> {
  const filePath = `${draftPath}/${sceneTitle}.md`;

  // Write to file
  await writeSceneMetadata(app, filePath, metadata);

  // Update store
  const key = getSceneMetadataKey(draftPath, sceneTitle);
  sceneMetadata.update((current) => ({
    ...current,
    [key]: metadata,
  }));
}

/**
 * Get color options for scene tags.
 */
export const COLOR_TAG_OPTIONS = [
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

/**
 * Get status options for scenes.
 */
export const STATUS_OPTIONS = [
  { value: "", label: "None" },
  { value: "todo", label: "To Do" },
  { value: "in-progress", label: "In Progress" },
  { value: "done", label: "Done" },
  { value: "revision", label: "Needs Revision" },
];
