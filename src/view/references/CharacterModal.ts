import { App, Modal, Setting } from "obsidian";
import type { Character } from "src/model/types";
import {
  addCharacter,
  updateCharacter,
  getProjectReferences,
  REFERENCE_COLOR_OPTIONS,
} from "src/model/project-references";

export class CharacterModal extends Modal {
  private projectTitle: string;
  private character: Partial<Character>;
  private isNew: boolean;
  private onSave: () => void;
  private allCharacters: Character[];

  constructor(
    app: App,
    projectTitle: string,
    character: Character | null,
    onSave: () => void
  ) {
    super(app);
    this.projectTitle = projectTitle;
    this.isNew = !character;
    this.character = character ? { ...character } : {
      name: "",
      description: "",
      traits: [],
      relationships: [],
      notes: "",
      colorTag: "",
      scenes: [],
    };
    this.onSave = onSave;
    this.allCharacters = getProjectReferences(projectTitle).characters.filter(
      (c) => c.id !== character?.id
    );
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("longform-character-modal");

    contentEl.createEl("h2", {
      text: this.isNew ? "New Character" : `Edit: ${this.character.name}`,
    });

    // Name
    new Setting(contentEl)
      .setName("Name")
      .setDesc("Character's name")
      .addText((text) => {
        text
          .setPlaceholder("Enter name...")
          .setValue(this.character.name || "")
          .onChange((value) => {
            this.character.name = value;
          });
        text.inputEl.style.width = "100%";
      });

    // Description
    new Setting(contentEl)
      .setName("Description")
      .setDesc("Brief description of the character")
      .addTextArea((text) => {
        text
          .setPlaceholder("Physical appearance, background...")
          .setValue(this.character.description || "")
          .onChange((value) => {
            this.character.description = value;
          });
        text.inputEl.rows = 3;
        text.inputEl.style.width = "100%";
      });

    // Traits
    new Setting(contentEl)
      .setName("Traits")
      .setDesc("Comma-separated personality traits")
      .addText((text) => {
        text
          .setPlaceholder("brave, stubborn, loyal...")
          .setValue(this.character.traits?.join(", ") || "")
          .onChange((value) => {
            this.character.traits = value
              .split(",")
              .map((t) => t.trim())
              .filter((t) => t);
          });
        text.inputEl.style.width = "100%";
      });

    // Color tag
    new Setting(contentEl)
      .setName("Color tag")
      .setDesc("Color code for this character")
      .addDropdown((dropdown) => {
        REFERENCE_COLOR_OPTIONS.forEach((option) => {
          dropdown.addOption(option.value, option.label);
        });
        dropdown.setValue(this.character.colorTag || "");
        dropdown.onChange((value) => {
          this.character.colorTag = value || undefined;
        });
      });

    // Relationships
    if (this.allCharacters.length > 0) {
      const relationshipsContainer = contentEl.createDiv({ cls: "longform-relationships-section" });
      relationshipsContainer.createEl("h3", { text: "Relationships" });

      const currentRelationships = this.character.relationships || [];

      this.allCharacters.forEach((otherChar) => {
        const existing = currentRelationships.find(
          (r) => r.characterId === otherChar.id
        );
        new Setting(relationshipsContainer)
          .setName(otherChar.name)
          .addText((text) => {
            text
              .setPlaceholder("friend, rival, sibling...")
              .setValue(existing?.relationship || "")
              .onChange((value) => {
                if (!this.character.relationships) {
                  this.character.relationships = [];
                }
                const idx = this.character.relationships.findIndex(
                  (r) => r.characterId === otherChar.id
                );
                if (value) {
                  if (idx !== -1) {
                    this.character.relationships[idx].relationship = value;
                  } else {
                    this.character.relationships.push({
                      characterId: otherChar.id,
                      relationship: value,
                    });
                  }
                } else if (idx !== -1) {
                  this.character.relationships.splice(idx, 1);
                }
              });
          });
      });
    }

    // Notes
    new Setting(contentEl)
      .setName("Notes")
      .setDesc("Private notes about this character")
      .addTextArea((text) => {
        text
          .setPlaceholder("Additional notes...")
          .setValue(this.character.notes || "")
          .onChange((value) => {
            this.character.notes = value;
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
      if (!this.character.name?.trim()) {
        return;
      }

      if (this.isNew) {
        addCharacter(this.projectTitle, this.character as Omit<Character, "id">);
      } else {
        updateCharacter(this.projectTitle, this.character as Character);
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
