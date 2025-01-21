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
      const name = coreModule.api.Utils.i18n(
        `tokenActionHud.template.deathsave`
      );
      const actions = [
        {
          encodedValue: [groupData.id, groupData.id].join(this.delimiter),
          id: groupData.id,
          listName: groupData.id,
          name,
        },
      ];

      this.addActions(actions, groupData);
    }

    async #buildFacedown() {
      const groupData = { id: ROLL_TYPES.FACEDOWN, type: 'system' };
      const name = coreModule.api.Utils.i18n(
        `tokenActionHud.template.facedown`
      );
      const actions = [
        {
          encodedValue: [groupData.id, groupData.id].join(this.delimiter),
          id: groupData.id,
          listName: groupData.id,
          name,
        },
      ];

      this.addActions(actions, groupData);
    }

    /**
     * Build inventory
     * @private
     */
    async #buildInventory() {
      if (this.items.size === 0) return;

      let actionTypeId = 'item';
      const inventoryMap = new Map();

      for (const [itemId, itemData] of this.items) {
        const type = itemData.type;
        const equipped = itemData.equipped;

        if (type === 'cyberware' && !itemData.system.isWeapon) {
          continue;
        }

        if (equipped || this.displayUnequipped) {
          const typeMap = inventoryMap.get(type) ?? new Map();
          typeMap.set(itemId, itemData);
          inventoryMap.set(type, typeMap);
        }
      }

      // console.debug('*** inventoryMap', inventoryMap);

      for (let [type, typeMap] of inventoryMap) {
        const groupId = SYSTEM_ITEM_TYPE[type]?.groupId;

        if (!groupId) continue;

        if (type === 'role') {
          typeMap = await this.#buildRoleActions([type, typeMap]);
          actionTypeId = 'role';
        } else {
          actionTypeId = 'item';
        }

        const groupData = { id: groupId, type: 'system' };

        // Get actions
        const actions = [...typeMap].map(([itemId, itemData]) => {
          const id = itemId;
          let name = itemData.name;
          const actionTypeName = coreModule.api.Utils.i18n(
            ACTION_TYPE[actionTypeId]
          );
          const listName = `${
            actionTypeName ? `${actionTypeName}: ` : ''
          }${name}`;
          const encodedValue = [actionTypeId, id].join(this.delimiter);
          const img =
            (itemData.type === 'cyberware' || itemData.type === 'weapon')
              ? coreModule.api.Utils.getImage(itemData)
              : undefined;
          let info1;

          if (itemData.type === 'skill') {
            let totalMod = 0;
            const level = itemData.system.level;
            const stat = this.actor.system.stats[itemData.system.stat].value;

            totalMod += level + stat;
            info1 = { text: totalMod.toString() };

            name = [name, `[${itemData.system.stat}]`.toUpperCase()].join(' ');
          }

          return {
            encodedValue,
            id,
            img,
            info1,
            listName,
            name,
          };
        });

        // console.debug(`*** #buildInventory ${groupId}`, actions, groupData)
        this.addActions(actions, groupData);
      }
    }

    async #buildRoleActions([type, typeMap]) {
      const roleMap = new Map();
      /**
       * Roles are items, some of those role items have a main role action, some have multiple sub role actions, still others have nothing. Here we collect all the Role Rolls as cloned items of the original Role items and store-slash-hide them on the actor so we don't pollute the Character Sheet. We refrence these hidden items in `roll-handler.js` to build the rollable actions.
       */
      if (!this.actor.system.externalData.hiddenRoleItems) {
        this.actor.update({'system.externalData.hiddenRoleItems': hiddenRoleItems});
      }

      typeMap.forEach(async (role) => {
        if (role.system.hasRoll) {
          const name = `${role.system.mainRoleAbility} [${role.name}]`;
          const encodedValue = [role.name, role.system.mainRoleAbility].join(this.delimiter);

          let roleItem = await role.clone();
          roleItem.baseItem = role;
          roleItem.name = name;
          roleItem.rollSubType = 'mainRoleAbility';
          roleItem.subRoleName = role.system.mainRoleAbility;
          roleItem.type = type;
          roleItem.encodedValue = encodedValue;

          roleMap.set(encodedValue, roleItem);
        }

        if (role.system.abilities.length) {
          role.system.abilities.forEach(async (subRole) => {
            if (subRole.hasRoll) {
              const name = `${subRole.name} [${role.name}]`;

              const encodedValue = [role.name, subRole.name].join(this.delimiter);

              let roleSubItem = await role.clone();

              roleSubItem.baseItem = role;
              roleSubItem.name = name;
              roleSubItem.rollSubType = 'subRoleAbility';
              roleSubItem.subRoleName = subRole.name;
              roleSubItem.type = type;
              roleSubItem.encodedValue = encodedValue;

              roleMap.set(encodedValue, roleSubItem);
            }
          });
        }
      });

      this.actor.system.externalData.secretItems = await roleMap;

      return roleMap;
    }

    async #buildStats() {
      const groupData = { id: 'stat', type: 'system' };

      const actions = Object.entries(this.actor.system.stats).map((stat) => {
        const name = coreModule.api.Utils.i18n(
          `tokenActionHud.template.stats.${stat[0]}`
        );

        return {
          encodedValue: ['stat', stat[0]].join(this.delimiter),
          id: stat[0],
          info1: { text: this.actor.system.stats[stat[0]].value },
          listName: stat[0],
          name,
        };
      });

      this.addActions(actions, groupData);
    }
  };
});
