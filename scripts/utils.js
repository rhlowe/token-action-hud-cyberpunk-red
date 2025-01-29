import { ITEM_TYPES, MODULE, WEAPON_ACTION_TYPES } from './constants.js';
import CPRRules from '../../../systems/cyberpunk-red-core/modules/utils/cpr-rules.js';

export let Utils = null;

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
  /**
   * Utility functions
   */
  Utils = class Utils {
    /**
     * Get setting
     * @param {string} key               The key
     * @param {string=null} defaultValue The default value
     * @returns {string}                 The setting value
     */
    static getSetting(key, defaultValue = null) {
      let value = defaultValue ?? null;
      try {
        value = game.settings.get(MODULE.ID, key);
      } catch {
        coreModule.api.Logger.debug(`Setting '${key}' not found`);
      }
      return value;
    }

    /**
     * Set setting
     * @param {string} key   The key
     * @param {string} value The value
     */
    static async setSetting(key, value) {
      try {
        value = await game.settings.set(MODULE.ID, key, value);
        coreModule.api.Logger.debug(`Setting '${key}' set to '${value}'`);
      } catch {
        coreModule.api.Logger.debug(`Setting '${key}' not found`);
      }
    }

    static cprCamelCase(string) {
      return (
        String(string).charAt(0).toLocaleLowerCase() + String(string).slice(1)
      )
        .replaceAll('/', 'Or')
        .replaceAll('&', 'And')
        .replaceAll(' ', '');
    }

    static cprCycleEquipState(actor, item) {
      if (item.type === ITEM_TYPES.CYBERWARE) return;

      let newValue = "owned";
      switch (item.system.equipped) {
        case "owned": {
          newValue = "carried";
          break;
        }
        case "carried": {
          if (item.type === "weapon") {
            CPRRules.lawyer(
              actor.canHoldWeapon(item),
              "CPR.messages.warningTooManyHands"
            );
          }
          newValue = "equipped";
          if (item.type === "cyberdeck") {
            if (actor.hasItemTypeEquipped(item.type)) {
              CPRRules.lawyer(false, "CPR.messages.errorTooManyCyberdecks");
              newValue = "owned";
            }
          }
          break;
        }
        case "equipped": {
          newValue = "owned";
          break;
        }
        default: {
          newValue = "carried";
          break;
        }
      }
      actor.sheet._updateOwnedItemProp(item, 'system.equipped', newValue);
    }

    static getWeaponActionIcon(type) {
      let icon = null;
      const imgPath = 'modules/token-action-hud-cyberpunk-red/static/'
      switch (type) {
        case WEAPON_ACTION_TYPES.CYCLE_EQUIPPED:
          icon = imgPath + 'cowboy-holster.svg';
          break;
        case WEAPON_ACTION_TYPES.TOGGLE_AIMED:
          icon = imgPath + 'targeting.svg';
          break;
        case WEAPON_ACTION_TYPES.TOGGLE_AUTOFIRE:
          icon = imgPath + 'bullet-impacts.svg';
          break;
        case WEAPON_ACTION_TYPES.SUPPRESSIVE_FIRE:
          icon = imgPath + 'dodging.svg';
          break;
        case WEAPON_ACTION_TYPES.MEASURE_DV:
          icon = imgPath + 'measure-tape.svg';
          break;
        case WEAPON_ACTION_TYPES.CHANGE_AMMO:
          icon = imgPath + 'rapidshare-arrow.svg';
          break;
        case WEAPON_ACTION_TYPES.RELOAD:
          icon = imgPath + 'reload-gun-barrel.svg';
          break;
        case WEAPON_ACTION_TYPES.ROLL_ATTACK:
          icon = imgPath + 'fist.svg';
          break;
        case WEAPON_ACTION_TYPES.ROLL_DAMAGE:
          icon = imgPath + 'drop.svg';
          break;
      }
      return icon;
    }

    static highlightDVRuler(item, token) {
      let itemDvTable = item.system?.dvTable;
      if (token !== null && itemDvTable !== null && itemDvTable !== "") {
        const tokenDv = token.document.getFlag(
          game.system.id,
          "cprDvTable"
        );
        const firetype = token.actor.getFlag(
          game.system.id,
          `firetype-${item.id}`
        );
        if (firetype === "autofire") {
          itemDvTable = `${itemDvTable} (Autofire)`;
        }
        if (tokenDv?.name === itemDvTable) {
          return true;
        }
      }
      return false;
    }
  };
});
