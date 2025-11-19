import { get } from "svelte/store";
import { pluginSettings } from "src/model/stores";
import type { CommandBuilder } from "./types";

export const toggleFocusMode: CommandBuilder = () => ({
  id: "longform-toggle-focus-mode",
  name: "Toggle focus mode",
  callback: () => {
    pluginSettings.update((s) => ({
      ...s,
      focusModeEnabled: !s.focusModeEnabled,
    }));
  },
});

export const toggleTypewriterMode: CommandBuilder = () => ({
  id: "longform-toggle-typewriter-mode",
  name: "Toggle typewriter mode",
  callback: () => {
    pluginSettings.update((s) => ({
      ...s,
      typewriterModeEnabled: !s.typewriterModeEnabled,
    }));
  },
});

export const toggleDistractionFreeMode: CommandBuilder = () => ({
  id: "longform-toggle-distraction-free",
  name: "Toggle distraction-free mode",
  callback: () => {
    const settings = get(pluginSettings);
    const newValue = !settings.distractionFreeEnabled;

    pluginSettings.update((s) => ({
      ...s,
      distractionFreeEnabled: newValue,
    }));

    // Apply or remove the body class
    if (newValue) {
      document.body.classList.add("longform-distraction-free");
    } else {
      document.body.classList.remove("longform-distraction-free");
    }
  },
});

export const cycleFocusModeType: CommandBuilder = () => ({
  id: "longform-cycle-focus-mode-type",
  name: "Cycle focus mode type (paragraph/sentence)",
  callback: () => {
    pluginSettings.update((s) => ({
      ...s,
      focusModeType: s.focusModeType === "paragraph" ? "sentence" : "paragraph",
    }));
  },
});
