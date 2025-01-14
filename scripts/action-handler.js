// System Module Imports
import { ACTION_TYPE, ACTOR_TYPES, ITEM_TYPE } from './constants.js';
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
      this.actors = !this.actor ? this.#getActors() : [this.actor];
      this.tokens = !this.token ? this.#getTokens() : [this.token];
      this.actorType = this.actor?.type;
      console.debug('*** buildSystemActions', groupIds);

      // Settings
      this.displayUnequipped = Utils.getSetting('displayUnequipped');

      // Set items variable
      if (this.actor) {
        let items = this.actor.items;
        items = coreModule.api.Utils.sortItemsByName(items);
        this.items = items;
      }

      if (ACTOR_TYPES.includes(this.actorType)) {
        this.#buildCharacterActions();
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

    /**
     * Build inventory
     * @private
     */
    async #buildInventory() {
      console.debug('*** #buildInventory', this.items);
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
        const groupId = ITEM_TYPE[type]?.groupId;

        if (!groupId) continue;

        const groupData = { id: groupId, type: 'system' };

        // Get actions
        const actions = [...typeMap].map(([itemId, itemData]) => {
          const id = itemId;
          const name = itemData.name;
          const actionTypeName = coreModule.api.Utils.i18n(
            ACTION_TYPE[actionTypeId]
          );
          const listName = `${
            actionTypeName ? `${actionTypeName}: ` : ''
          }${name}`;
          const encodedValue = [actionTypeId, id].join(this.delimiter);

          return {
            id,
            name,
            listName,
            encodedValue,
          };
        });

        // TAH Core method to add actions to the action list
        this.addActions(actions, groupData);
      }
    }

    /**
     * Get actors
     * @private
     * @returns {object}
     */
    async #getActors() {
      const actors = canvas.tokens.controlled
        .filter((token) => token.actor)
        .map((token) => token.actor);
      if (actors.every((actor) => ACTOR_TYPES.includes(actor.type))) {
        return actors;
      } else {
        return [];
      }
    }

    /**
     * Get tokens
     * @private
     * @returns {object}
     */
    async #getTokens() {
      const tokens = canvas.tokens.controlled;
      const actors = tokens
        .filter((token) => token.actor)
        .map((token) => token.actor);
      if (actors.every((actor) => ACTOR_TYPES.includes(actor.type))) {
        return tokens;
      } else {
        return [];
      }
    }
  };
});
