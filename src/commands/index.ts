import { compileCurrent, compileSelection } from "./compile";
import {
  focusCurrentDraft,
  previousScene,
  previousSceneAtIndent,
  nextScene,
  nextSceneAtIndent,
  jumpToProject,
  showLongform,
  jumpToScene,
  revealProjectFolder,
  focusNewSceneField,
} from "./navigation";
import { indentScene, unindentScene } from "./indentation";
import type LongformPlugin from "src/main";
import {
  insertMultiSceneTemplate,
  insertSingleSceneTemplate,
} from "./templates";
import { startNewSession } from "./word-counts";
import {
  toggleFocusMode,
  toggleTypewriterMode,
  toggleDistractionFreeMode,
  cycleFocusModeType,
} from "./writing-modes";

const commandBuilders = [
  compileCurrent,
  compileSelection,
  focusCurrentDraft,
  previousScene,
  previousSceneAtIndent,
  nextScene,
  nextSceneAtIndent,
  indentScene,
  unindentScene,
  jumpToProject,
  jumpToScene,
  showLongform,
  revealProjectFolder,
  focusNewSceneField,
  insertMultiSceneTemplate,
  insertSingleSceneTemplate,
  startNewSession,
  toggleFocusMode,
  toggleTypewriterMode,
  toggleDistractionFreeMode,
  cycleFocusModeType,
];

export function addCommands(plugin: LongformPlugin) {
  commandBuilders.forEach((c) => {
    plugin.addCommand(c(plugin));
  });
}
