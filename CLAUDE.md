# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Build (bundle + minify all scripts into token-action-hud-template.min.js)
npm run build

# Watch mode for development
npm run dev

# Bump version (updates package.json, copies to module.json, amends last commit)
npm config set git-tag-version false
npm version [VERSION]
```

There is no test suite.

## Architecture

This is a [Foundry VTT](https://foundryvtt.com/) module that extends [Token Action HUD Core](https://github.com/Larkinabout/fvtt-token-action-hud-core) to support the [Cyberpunk RED](https://github.com/cyberpunk-red-team/fvtt-cyberpunk-red-core) game system.

### How TAH Core integration works

All module classes extend base classes provided by TAH Core. They cannot be defined at module load time — TAH Core fires a `tokenActionHudCoreApiReady` hook and passes its API as the argument. Every class in this module is therefore declared *inside* a `Hooks.once('tokenActionHudCoreApiReady', ...)` callback so it can inherit from `coreModule.api.SystemManager`, `.ActionHandler`, and `.RollHandler`.

`init.js` is the entry point (declared in `module.json` as an ESM). It listens for `tokenActionHudCoreApiReady`, sets `module.api = { requiredCoreModuleVersion, SystemManager }`, then fires `tokenActionHudSystemReady` to hand off to TAH Core.

### File responsibilities

| File | Role |
|---|---|
| `init.js` | Entry point; wires module API to TAH Core |
| `system-manager.js` | Extends `SystemManager`; provides ActionHandler, RollHandler, defaults, settings, and styles to TAH Core |
| `action-handler.js` | Extends `ActionHandler`; builds all HUD action groups from actor data |
| `roll-handler.js` | Extends `RollHandler`; handles click events and dispatches to CPR roll methods |
| `constants.js` | `GROUP`, `ROLL_TYPES`, `WEAPON_ACTION_TYPES`, `ITEM_TYPES`, `ACTOR_TYPES` |
| `defaults.js` | Default HUD tab/group layout (the nested structure users see) |
| `settings.js` | Registers Foundry module settings (displayMookSkillWithZeroMod, equipUnarmed, etc.) |
| `utils.js` | `getSetting`, `cprCycleEquipState`, `getWeaponActionIcon`, `highlightDVRuler` |

### Action flow

1. `ActionHandler.buildSystemActions()` is called by TAH Core when a token is selected. It calls a private `#build*` method for each actor item type and appends actions via `this.addActions(actions, groupData)`.
2. Each action carries an `encodedValue` string: `"actionTypeId|actionId"` (pipe-delimited using `this.delimiter`).
3. When a HUD button is clicked, TAH Core calls `RollHandler.handleActionClick(event, encodedValue)`. The handler splits the encoded value, routes to weapon actions, utility actions, or the main `#handleAction` switch, and calls into the CPR system's roll/chat classes.

### CPR system dependency

`roll-handler.js` imports directly from the CPR system using a relative path:

```js
import CPRChat from '../../../systems/cyberpunk-red-core/modules/chat/cpr-chat.js';
import CPRSystemUtils from '../../../systems/cyberpunk-red-core/modules/utils/cpr-systemUtils.js';
import * as CPRRolls from '../../../systems/cyberpunk-red-core/modules/rolls/cpr-rolls.js';
```

This path is only valid when the module is installed inside a Foundry VTT `Data/modules/` directory alongside the `cyberpunk-red-core` system. The comment at the top of `action-handler.js` shows the expected install path: `/Users/rhlowe/Library/Application Support/FoundryVTT/Data/modules/token-action-hud-cyberpunk-red`.

### Build output

Rollup bundles `scripts/*.js` and `scripts/*/*.js` (excluding the already-built output) into a single minified ESM file at `scripts/token-action-hud-template.min.js`. This is what Foundry actually loads.

### Versioning / release

`module_raw.json` is the source of truth for the module manifest. It contains the literal string `VERSION_TO_REPLACE`. Running `npm version [VERSION]` triggers the `postversion` script (`shell/copyVersion.js`), which copies `module_raw.json` → `module.json` with the version substituted, then amends the last git commit. Always run `npm config set git-tag-version false` first so npm does not create a git tag automatically — tags are pushed manually after the PR merges.
