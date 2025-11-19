import { App, Modal, Setting } from "obsidian";
import type { ResearchNote } from "src/model/types";
import {
  addResearchNote,
  updateResearchNote,
  getAllTags,
} from "src/model/project-references";

export class ResearchNoteModal extends Modal {
  private projectTitle: string;
  private note: Partial<ResearchNote>;
  private isNew: boolean;
  private onSave: () => void;
  private existingTags: string[];

  constructor(
    app: App,
    projectTitle: string,
    note: ResearchNote | null,
    onSave: () => void
  ) {
    super(app);
    this.projectTitle = projectTitle;
    this.isNew = !note;
    this.note = note ? { ...note } : {
      title: "",
      content: "",
      tags: [],
      sources: [],
      linkedScenes: [],
    };
    this.onSave = onSave;
    this.existingTags = getAllTags(projectTitle);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("longform-research-note-modal");

    contentEl.createEl("h2", {
      text: this.isNew ? "New Research Note" : `Edit: ${this.note.title}`,
    });

    // Title
    new Setting(contentEl)
      .setName("Title")
      .setDesc("Note title")
      .addText((text) => {
        text
          .setPlaceholder("Enter title...")
          .setValue(this.note.title || "")
          .onChange((value) => {
            this.note.title = value;
          });
        text.inputEl.style.width = "100%";
      });

    // Content
    new Setting(contentEl)
      .setName("Content")
      .setDesc("Research content")
      .addTextArea((text) => {
        text
          .setPlaceholder("Enter your research notes...")
          .setValue(this.note.content || "")
          .onChange((value) => {
            this.note.content = value;
          });
        text.inputEl.rows = 8;
        text.inputEl.style.width = "100%";
      });

    // Tags
    const tagsDesc = this.existingTags.length > 0
      ? `Comma-separated tags. Existing: ${this.existingTags.join(", ")}`
      : "Comma-separated tags for organization";

    new Setting(contentEl)
      .setName("Tags")
      .setDesc(tagsDesc)
      .addText((text) => {
        text
          .setPlaceholder("research, history, character-backstory...")
          .setValue(this.note.tags?.join(", ") || "")
          .onChange((value) => {
            this.note.tags = value
              .split(",")
              .map((t) => t.trim().toLowerCase())
              .filter((t) => t);
          });
        text.inputEl.style.width = "100%";
      });

    // Sources
    new Setting(contentEl)
      .setName("Sources")
      .setDesc("URLs or references (one per line)")
      .addTextArea((text) => {
        text
          .setPlaceholder("https://...\nBook: Author, Title...")
          .setValue(this.note.sources?.join("\n") || "")
          .onChange((value) => {
            this.note.sources = value
              .split("\n")
              .map((s) => s.trim())
              .filter((s) => s);
          });
        text.inputEl.rows = 3;
        text.inputEl.style.width = "100%";
      });

    // Buttons
    const buttonContainer = contentEl.createDiv({ cls: "longform-modal-buttons" });

    const cancelButton = buttonContainer.createEl("button", { text: "Cancel" });
    cancelButton.addEventListener("click", () => {
      this.close();
    });

    const saveButton = buttonContainer.createEl("button", {
      text: "Save",
      cls: "mod-cta",
    });
    saveButton.addEventListener("click", () => {
      if (!this.note.title?.trim()) {
        return;
      }

      if (this.isNew) {
        addResearchNote(
          this.projectTitle,
          this.note as Omit<ResearchNote, "id" | "createdAt" | "updatedAt">
        );
      } else {
        updateResearchNote(this.projectTitle, this.note as ResearchNote);
      }

      this.onSave();
      this.close();
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
