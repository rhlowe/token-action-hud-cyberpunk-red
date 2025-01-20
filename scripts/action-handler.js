// System Module Imports
import { ACTION_TYPE, ROLL_TYPES, SYSTEM_ITEM_TYPE } from './constants.js';
import { Utils } from './utils.js';

export let ActionHandler = null;

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
  /**
   * Extends Token Action HUD Core's ActionHandler class and builds system-defined actions for the HUD
   */
  ActionHandler = class ActionHandler extends coreModule.api.ActionHandler {
    /**
     * Build system actions
     * Called by Token Action HUD Core
     * @override
     * @param {array} groupIds
     */
    async buildSystemActions(groupIds) {
      // Set actor and token variables
      this.actors = !this.actor ? this._getActors() : [this.actor];
      this.actorType = this.actor?.type;

      // Settings
      this.displayUnequipped = Utils.getSetting('displayUnequipped');

      // Set items variable
      if (this.actor) {
        let items = this.actor.items;
        items = coreModule.api.Utils.sortItemsByName(items);
        this.items = items;
      }

      if (this.actorType === 'character' || this.actorType === 'mook') {
        this.#buildCharacterActions();
        this.#buildDeathSave();
        this.#buildFacedown();
        this.#buildStats();
      } else if (!this.actor) {
        this.#buildMultipleTokenActions();
      }
    }

    /**
     * Build character actions
     * @private
     */
    #buildCharacterActions() {
      this.#buildInventory();
    }

    /**
     * Build multiple token actions
     * @private
     * @returns {object}
     */
    #buildMultipleTokenActions() {}

    async #buildDeathSave() {
      const groupData = { id: ROLL_TYPES.DEATHSAVE, type: 'system' };
      const name = coreModule.api.Utils.i18n(`tokenActionHud.template.deathsave`);
      const actions = [
        {
          encodedValue: [groupData.id, groupData.id].join(this.delimiter),
          id: groupData.id,
          listName: groupData.id,
          name
        }
      ];

      this.addActions(actions, groupData);
    }

    async #buildFacedown() {
      const groupData = { id: ROLL_TYPES.FACEDOWN, type: 'system' };
      const name = coreModule.api.Utils.i18n(`tokenActionHud.template.facedown`);
      const actions = [
        {
          encodedValue: [groupData.id, groupData.id].join(this.delimiter),
          id: groupData.id,
          listName: groupData.id,
          name
        }
      ];

      this.addActions(actions, groupData);
    }

    /**
     * Build inventory
     * @private
     */
    async #buildInventory() {
      if (this.items.size === 0) return;

      const actionTypeId = 'item';
      const inventoryMap = new Map();

      for (const [itemId, itemData] of this.items) {
        const type = itemData.type;
        const equipped = itemData.equipped;

        if (equipped || this.displayUnequipped) {
          const typeMap = inventoryMap.get(type) ?? new Map();
          typeMap.set(itemId, itemData);
          inventoryMap.set(type, typeMap);
        }
      }

      for (const [type, typeMap] of inventoryMap) {
        const groupId = SYSTEM_ITEM_TYPE[type]?.groupId;

        if (!groupId) continue;

        const groupData = { id: groupId, type: 'system' };

        // Get actions
        const actions = [...typeMap].map(([itemId, itemData]) => {
          // REMINDER: for roll actions, look at actor.items[].system.abilities.hasRoll

          const id = itemId;
          let name = itemData.name;
          const actionTypeName = coreModule.api.Utils.i18n(
            ACTION_TYPE[actionTypeId]
          );
          const listName = `${
            actionTypeName ? `${actionTypeName}: ` : ''
          }${name}`;
          const encodedValue = [actionTypeId, id].join(this.delimiter);
          const img = itemData.type === 'weapon' ? coreModule.api.Utils.getImage(itemData) : undefined;
          let info1;
          if (itemData.type === 'skill') {
            let totalMod = 0;
            const level = itemData.system.level;
            const stat = this.actor.system.stats[itemData.system.stat].value;

            totalMod += (level + stat);
            info1 = { text: totalMod.toString() };

            name = [name, `[${itemData.system.stat}]`.toUpperCase()].join(' ');
          }

          return {
            id,
            info1,
            img,
            name,
            listName,
            encodedValue,
          };
        });

        // console.debug(`*** buildInventory actions: ${groupData.id}`, {groupData, actions});

        this.addActions(actions, groupData);
      }
    }

    async #buildStats() {
      const groupData = { id: 'stat', type: 'system' };

      const actions = Object.entries(this.actor.system.stats).map(stat => {
        const name = coreModule.api.Utils.i18n(`tokenActionHud.template.stats.${stat[0]}`);

        return {
          encodedValue: ['stat', stat[0]].join(this.delimiter),
          id: stat[0],
          info1: { text: this.actor.system.stats[stat[0]].value },
          listName: stat[0],
          name
        };
      });

      this.addActions(actions, groupData);
    }
  };
});
