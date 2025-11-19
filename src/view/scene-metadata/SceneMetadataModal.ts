import { App, Modal, Setting } from "obsidian";
import type { SceneMetadata, SceneStatus } from "src/model/types";
import {
  updateSceneMetadata,
  COLOR_TAG_OPTIONS,
  STATUS_OPTIONS,
} from "src/model/scene-metadata";

export class SceneMetadataModal extends Modal {
  private draftPath: string;
  private sceneTitle: string;
  private metadata: SceneMetadata;
  private onSave: () => void;

  constructor(
    app: App,
    draftPath: string,
    sceneTitle: string,
    metadata: SceneMetadata,
    onSave: () => void
  ) {
    super(app);
    this.draftPath = draftPath;
    this.sceneTitle = sceneTitle;
    this.metadata = { ...metadata };
    this.onSave = onSave;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("longform-scene-metadata-modal");

    contentEl.createEl("h2", { text: `Scene: ${this.sceneTitle}` });

    // Synopsis
    new Setting(contentEl)
      .setName("Synopsis")
      .setDesc("A brief summary of this scene")
      .addTextArea((text) => {
        text
          .setPlaceholder("Enter a brief synopsis...")
          .setValue(this.metadata.synopsis || "")
          .onChange((value) => {
            this.metadata.synopsis = value;
          });
        text.inputEl.rows = 3;
        text.inputEl.style.width = "100%";
      });

    // Status
    new Setting(contentEl)
      .setName("Status")
      .setDesc("Current status of this scene")
      .addDropdown((dropdown) => {
        STATUS_OPTIONS.forEach((option) => {
          dropdown.addOption(option.value, option.label);
        });
        dropdown.setValue(this.metadata.status || "");
        dropdown.onChange((value) => {
          this.metadata.status = value as SceneStatus || undefined;
        });
      });

    // Color tag
    new Setting(contentEl)
      .setName("Color tag")
      .setDesc("Color code for themes, characters, or categories")
      .addDropdown((dropdown) => {
        COLOR_TAG_OPTIONS.forEach((option) => {
          dropdown.addOption(option.value, option.label);
        });
        dropdown.setValue(this.metadata.colorTag || "");
        dropdown.onChange((value) => {
          this.metadata.colorTag = value || undefined;
        });
      });

    // Private notes
    new Setting(contentEl)
      .setName("Private notes")
      .setDesc("Notes that won't appear in the compiled output")
      .addTextArea((text) => {
        text
          .setPlaceholder("Add private notes...")
          .setValue(this.metadata.notes || "")
          .onChange((value) => {
            this.metadata.notes = value;
          });
        text.inputEl.rows = 4;
        text.inputEl.style.width = "100%";
      });

    // Save button
    const buttonContainer = contentEl.createDiv({ cls: "longform-modal-buttons" });

    const cancelButton = buttonContainer.createEl("button", { text: "Cancel" });
    cancelButton.addEventListener("click", () => {
      this.close();
    });

    const saveButton = buttonContainer.createEl("button", {
      text: "Save",
      cls: "mod-cta",
    });
    saveButton.addEventListener("click", async () => {
      await updateSceneMetadata(
        this.app,
        this.draftPath,
        this.sceneTitle,
        this.metadata
      );
      this.onSave();
      this.close();
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
