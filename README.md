# Token Action HUD for Cyberpunk RED

![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/rhlowe/token-action-hud-cyberpunk-red)

Token Action HUD is a repositionable HUD of actions for a selected token.

![Token Action HUD](static/tah.gif)

# Features

- Make rolls directly from the HUD instead of opening your character sheet.
  - Skills
  - Stats
  - Role Abilities
  - Facedown
  - Death Saves
- Manage weapons
  - Roll Attack
  - Roll Damage
  - Reload
  - Chage Ammo
  - Set Fire Mode: Single, Aimed, Suppressive, & Autofire
- Netrunning (COMING SOON)
- Manage Active Effects
- Supports [Condition Lab & Triggler](https://foundryvtt.com/packages/condition-lab-triggler) for Status Effect toggling
- Roll Initiative
- Control token visibility
- End combat turn
- View Gear in the HUD or right-click an item to open its sheet.
- Move the HUD and choose to expand the menus up or down.
- Unlock the HUD to customise layout and groups per user, and actions per actor.
- Add your own macros, journal entries and roll table compendiums.

# Installation

## Method 1

1. On Foundry VTT's **Configuration and Setup** screen, go to **Add-on Modules**
2. Click **Install Module**
3. Search for **Token Action HUD for Cyberpunk RED**
4. Click **Install** next to the module listing

## Method 2

1. On Foundry VTT's **Configuration and Setup** screen, go to **Add-on Modules**
2. Click **Install Module**
3. In the Manifest URL field, paste: `https://github.com/rhlowe/token-action-hud-cyberpunk-red/releases/latest/download/module.json`
4. Click **Install** next to the pasted Manifest URL

## Required Modules

**IMPORTANT** - Token Action HUD for Cyberpunk RED requires the [Token Action HUD Core](https://foundryvtt.com/packages/token-action-hud-core) and [socketlib](https://foundryvtt.com/packages/socketlib) modules to be installed.

## Recommended Modules

- Token Action HUD uses the [Color Picker](https://foundryvtt.com/packages/color-picker) library module for its color picker settings
- Token Action HUD for Cyberpunk RED recommends [Condition Lab & Triggler](https://foundryvtt.com/packages/condition-lab-triggler) to manage Cyberpunk Red statuses in Foundry VTT

# Support

For a guide on using Token Action HUD, go to: [How to Use Token Action HUD](https://github.com/Larkinabout/fvtt-token-action-hud-core/wiki/How-to-Use-Token-Action-HUD)

For questions, feature requests or bug reports, [please open an issue here](https://github.com/rhlowe/token-action-hud-cyberpunk-red/issues).

Pull requests are welcome. Please include a reason for the request or create an issue before starting one.

# Acknowledgements

Thank you to the Community Helpers on Foundry's Discord who provide tireless support for people seeking help with the HUD.

# License

- Token Action HUD Core is licensed under a [Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/) and licensed under [Foundry Virtual Tabletop EULA - Limited License Agreement for module development](https://foundryvtt.com/article/license/).
- Token Action HUD for Cyberpunk RED is licensed under the [GNU General Public License v3.0](./LICENSE)

# Generating a Release

1. Make all code changes needed
2. Also make sure that npm doesn't auto tag versions: `npm config set git-tag-version false`
3. In the project root, run `$ npm version [VERSION]`

- Commit history should have changes in package.json, package-lock.json, and module.json

4. Open and merge a PR
5. Manually tag and push tag to master
6. Create a release in github
