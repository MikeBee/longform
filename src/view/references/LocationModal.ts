import { App, Modal, Setting } from "obsidian";
import type { Location } from "src/model/types";
import {
  addLocation,
  updateLocation,
  REFERENCE_COLOR_OPTIONS,
} from "src/model/project-references";

export class LocationModal extends Modal {
  private projectTitle: string;
  private location: Partial<Location>;
  private isNew: boolean;
  private onSave: () => void;

  constructor(
    app: App,
    projectTitle: string,
    location: Location | null,
    onSave: () => void
  ) {
    super(app);
    this.projectTitle = projectTitle;
    this.isNew = !location;
    this.location = location ? { ...location } : {
      name: "",
      description: "",
      details: "",
      notes: "",
      colorTag: "",
      scenes: [],
    };
    this.onSave = onSave;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("longform-location-modal");

    contentEl.createEl("h2", {
      text: this.isNew ? "New Location" : `Edit: ${this.location.name}`,
    });

    // Name
    new Setting(contentEl)
      .setName("Name")
      .setDesc("Location name")
      .addText((text) => {
        text
          .setPlaceholder("Enter name...")
          .setValue(this.location.name || "")
          .onChange((value) => {
            this.location.name = value;
          });
        text.inputEl.style.width = "100%";
      });

    // Description
    new Setting(contentEl)
      .setName("Description")
      .setDesc("Brief description of the location")
      .addTextArea((text) => {
        text
          .setPlaceholder("What is this place?")
          .setValue(this.location.description || "")
          .onChange((value) => {
            this.location.description = value;
          });
        text.inputEl.rows = 3;
        text.inputEl.style.width = "100%";
      });

    // Details
    new Setting(contentEl)
      .setName("Details")
      .setDesc("Sensory details, atmosphere, important features")
      .addTextArea((text) => {
        text
          .setPlaceholder("Sights, sounds, smells...")
          .setValue(this.location.details || "")
          .onChange((value) => {
            this.location.details = value;
          });
        text.inputEl.rows = 4;
        text.inputEl.style.width = "100%";
      });

    // Color tag
    new Setting(contentEl)
      .setName("Color tag")
      .setDesc("Color code for this location")
      .addDropdown((dropdown) => {
        REFERENCE_COLOR_OPTIONS.forEach((option) => {
          dropdown.addOption(option.value, option.label);
        });
        dropdown.setValue(this.location.colorTag || "");
        dropdown.onChange((value) => {
          this.location.colorTag = value || undefined;
        });
      });

    // Notes
    new Setting(contentEl)
      .setName("Notes")
      .setDesc("Private notes about this location")
      .addTextArea((text) => {
        text
          .setPlaceholder("Additional notes...")
          .setValue(this.location.notes || "")
          .onChange((value) => {
            this.location.notes = value;
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
      if (!this.location.name?.trim()) {
        return;
      }

      if (this.isNew) {
        addLocation(this.projectTitle, this.location as Omit<Location, "id">);
      } else {
        updateLocation(this.projectTitle, this.location as Location);
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
