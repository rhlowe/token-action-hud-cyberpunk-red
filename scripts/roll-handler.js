import {
  GROUP,
  ITEM_TYPES,
  ROLL_TYPES,
  WEAPON_ACTION_TYPES,
} from './constants.js';
import { Utils } from './utils.js';
import CPRChat from '../../../systems/cyberpunk-red-core/modules/chat/cpr-chat.js';
import CPRSystemUtils from '../../../systems/cyberpunk-red-core/modules/utils/cpr-systemUtils.js';

export let RollHandler = null;

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
  /**
   * Extends Token Action HUD Core's RollHandler class and handles action events triggered when an action is clicked
   */
  RollHandler = class RollHandler extends coreModule.api.RollHandler {
    _getFireMode(id) {
      const box = this.actor.getFlag(game.system.id, `firetype-${id}`);
      if (box) {
        return box;
      }
      return ROLL_TYPES.ATTACK;
    }

    /**
     * Handle action click
     * Called by Token Action HUD Core when an action is left or right-clicked
     * @override
     * @param {object} event        The event
     * @param {string} encodedValue The encoded value
     */
    async handleActionClick(event, encodedValue) {
      // console.debug('*** handleActionClick', {event, encodedValue});
      const [actionTypeId, actionId] = encodedValue.split('|');

      /**
       * Enable right-click on core item types to open the item sheet
       */
      const cprItemTypes = Object.keys(this.actor.itemTypes);
      if (cprItemTypes.includes(actionTypeId) && this.isRenderItem()) {
        return this.renderItem(this.actor, actionId);
      }

      const knownCharacters = ['character'];

      if (Object.values(WEAPON_ACTION_TYPES).includes(actionTypeId)) {
        return this.#handleWeaponAction(
          event,
          this.actor,
          this.token,
          actionTypeId,
          actionId
        );
      }

      if (this.actor && actionTypeId === GROUP.utility.id) {
        await this.#handleUtilityAction(this.actor, this.token, actionId);
        return;
      }

      // If single actor is selected
      if (this.actor) {
        await this.#handleAction(
          event,
          this.actor,
          this.token,
          actionTypeId,
          actionId,
          encodedValue
        );
        return;
      }

      const controlledTokens = canvas.tokens.controlled.filter((token) =>
        knownCharacters.includes(token.actor?.type)
      );

      // If multiple actors are selected
      for (const token of controlledTokens) {
        const actor = token.actor;
        await this.#handleAction(event, actor, token, actionTypeId, actionId);
      }
    }

    /**
     * Handle action hover
     * Called by Token Action HUD Core when an action is hovered on or off
     * @override
     * @param {object} event        The event
     * @param {string} encodedValue The encoded value
     */
    async handleActionHover(event, encodedValue) {}

    /**
     * Handle group click
     * Called by Token Action HUD Core when a group is right-clicked while the HUD is locked
     * @override
     * @param {object} event The event
     * @param {object} group The group
     */
    async handleGroupClick(event, group) {}

    /**
     * Handle action
     * @private
     * @param {object} event        The event
     * @param {object} actor        The actor
     * @param {object} token        The token
     * @param {string} actionTypeId The action type id
     * @param {string} actionId     The actionId
     */
    async #handleAction(
      event,
      actor,
      token,
      actionTypeId,
      actionId,
      encodedValue
    ) {
      // console.debug('*** handleAction default', {event, actor, token, actionTypeId, actionId, encodedValue});
      let tahCprRoll = null;
      let item = null;

      const activeCyberdeck = actor.itemTypes.cyberdeck.find(
        (deck) => deck.system.equipped === 'equipped'
      );
      let program;

      if (['derez','rez','reduce-rez','reset-rez', 'erase'].includes(actionTypeId)) {
        program = actor.getOwnedItem(actionId);
      }

      switch (actionTypeId) {
        case 'rez':
          if (!activeCyberdeck.isRezzed(program)) {
            await activeCyberdeck.rezProgram(program, token);
            actor.sheet._updateOwnedItem(activeCyberdeck);
          }
          return;
        case 'derez':
          if (activeCyberdeck.isRezzed(program)) {
            await activeCyberdeck.derezProgram(program);
            actor.sheet._updateOwnedItem(activeCyberdeck);
          }
          return;
        case 'reduce-rez':
          if (activeCyberdeck.isRezzed(program)) {
            await activeCyberdeck.reduceRezProgram(program);
            actor.sheet._updateOwnedItem(activeCyberdeck);
          }
          return;
        case 'reset-rez':
          /**
           * reimpliments CPR's cyberdeck.resetRezProgram(program) but searches for uuid instead of id
           */
          if (activeCyberdeck.isRezzed(program)) {
            const { rezzed } = activeCyberdeck.system.programs;
            const rezzedIndex = rezzed.findIndex((p) => p.uuid === program.uuid);
            const { installed } = activeCyberdeck.system.programs;
            const installedIndex = installed.findIndex((p) => p.uuid === program.uuid);
            activeCyberdeck.system.programs.rezzed[rezzedIndex] = activeCyberdeck.system.programs.installed[installedIndex];
            actor.sheet._updateOwnedItem(activeCyberdeck);
          }
          return;
        case 'erase':
          console.debug('*** erase', {activeCyberdeck, program});
          await activeCyberdeck.uninstallItems([program]);
          await activeCyberdeck.syncPrograms();
          return;
        case 'activeEffects':
          await this.#handleActiveEffectToggle(actionId, actor);
          return;
        case 'injury':
          await this.#handleStatusEffectToggle(actionId, actor);
          return;
      }

      if (
        actionTypeId === 'role' &&
        encodedValue &&
        actor.system.externalData.secretItems.size
      ) {
        const searchTerm = encodedValue.replace('role|', '');
        item = actor.system.externalData.secretItems.get(searchTerm);

        tahCprRoll = item.createRoll(ROLL_TYPES.ROLEABILITY, actor, {
          rollSubType: item.rollSubType,
          subRoleName: item.subRoleName,
        });
      }

      switch (actionTypeId) {
        case ROLL_TYPES.SKILL:
          item = actor.getOwnedItem(actionId);
          tahCprRoll = item.createRoll(ROLL_TYPES.SKILL, actor);
          break;

        case ITEM_TYPES.STAT:
        case ROLL_TYPES.DEATHSAVE:
        case ROLL_TYPES.FACEDOWN:
          if (['character', 'mook'].includes(actor.type)) {
            tahCprRoll = actor.createRoll(actionTypeId, actionId);
          }

          if (['blackIce', 'demon'].includes(actor.type)) {
            tahCprRoll = actor.createStatRoll(actionId);
          }
          break;

        case 'rollAnAttack':
          tahCprRoll = activeCyberdeck.createRoll('cyberdeckProgram', actor, {
            programUUID: actionId,
            netRoleItem: {
              system: {
                ...actor.items.get(actor.system.roleInfo.activeNetRole).system,
              }
            },
            executionType: 'atk'
          });
          break;

        case 'rollDamage':
          tahCprRoll = activeCyberdeck.createRoll('cyberdeckProgram', actor, {
            programUUID: actionId,
            netRoleItem: {
              system: {
                ...actor.items.get(actor.system.roleInfo.activeNetRole).system,
              }
            },
            executionType: 'damage'
          });
          break;

        case 'rollDef':
          tahCprRoll = activeCyberdeck.createRoll('cyberdeckProgram', actor, {
            programUUID: actionId,
            netRoleItem: {
              system: {
                ...actor.items.get(actor.system.roleInfo.activeNetRole).system,
              }
            },
            executionType: 'def'
          });
          break;

        case ROLL_TYPES.INTERFACEABILITY:
          const netRoleItem = actor.itemTypes.role.find(
            (r) => r.id === actor.system.roleInfo.activeNetRole
          );

          // if (!netRoleItem) {
          //   const error = SystemUtils.Localize(
          //     "CPR.messages.noNetrunningRoleConfigured"
          //   );
          //   SystemUtils.DisplayMessage("error", error);
          //   return;
          // }

          tahCprRoll = activeCyberdeck.createRoll('interfaceAbility', actor, {
            interfaceAbility: actionId,
            cyberdeck: activeCyberdeck,
            netRoleItem,
          });
          break;
        case ROLL_TYPES.NET:
          const programUUID =
            actor.token.flags['cyberpunk-red-core'].programUUID;
          const netrunnerTokenId = undefined;
          const sceneId = token.scene.uuid;
          tahCprRoll = actor.createDamageRoll(
            programUUID,
            netrunnerTokenId,
            sceneId
          );
          break;
        case 'attack':
          item = actor.getOwnedItem(actionId);
          const fireMode = this._getFireMode(actionId);
          tahCprRoll = item.createRoll(fireMode, actor);
          break;
        case 'damage':
          item = actor.getOwnedItem(actionId);
          const damageType = this._getFireMode(actionId);
          tahCprRoll = item.createRoll(actionTypeId, actor, { damageType });

          if (actionTypeId === ROLL_TYPES.AIMED) {
            tahCprRoll.location =
              actor.getFlag(game.system.id, 'aimedLocation') || 'body';
          }
          break;
        default:
          break;
      }

      // console.debug('*** tahCprRoll check', tahCprRoll);
      if (!tahCprRoll) {
        return;
      }

      // note: for aimed shots this is where location is set
      const keepRolling = await tahCprRoll.handleRollDialog(event, actor, item);
      if (!keepRolling) {
        return;
      }

      if (item !== null) {
        // Do any actions that need to be done as part of a roll, like ammo decrementing
        tahCprRoll = await item.confirmRoll(tahCprRoll);
      }

      await tahCprRoll.roll();

      // Post roll tasks
      if (tahCprRoll.rollTitle === 'Death Save') {
        tahCprRoll.saveResult = this.actor.processDeathSave(tahCprRoll);
      }

      // "Consume" LUCK if used
      if (Number.isInteger(tahCprRoll.luck) && tahCprRoll.luck > 0) {
        const luckStat = actor.system.stats.luck.value;
        actor.update({
          'system.stats.luck.value':
            luckStat -
            (tahCprRoll.luck > luckStat ? luckStat : tahCprRoll.luck),
        });
      }

      token = token === null ? null : token.data._id;
      const targetedTokens =
        CPRSystemUtils.getUserTargetedOrSelected('targeted'); // get user targeted tokens for output to chat

      tahCprRoll.entityData = {
        actor: actor.id,
        token,
        tokens: targetedTokens,
      };

      if (item) {
        tahCprRoll.entityData.item = item.id;
      }

      CPRChat.RenderRollCard(tahCprRoll);
    }

    /**
     * Handle item action
     * @private
     * @param {object} event    The event
     * @param {object} actor    The actor
     * @param {string} actionId The action id
     */
    #handleItemAction(event, actor, actionId) {
      const item = actor.items.get(actionId);
      item.toChat(event);
    }

    /**
     * Handle utility action
     * @private
     * @param {object} actor    The actor
     * @param {object} token    The token
     * @param {string} actionId The action id
     */
    async #handleUtilityAction(actor, token, actionId) {
      switch (actionId) {
        case 'endTurn':
          if (game.combat?.current?.tokenId === token.id) {
            await game.combat?.nextTurn();
          }
          break;
        case 'initiative':
          let combatant = game.combat?.combatants.find(
            (c) => c.tokenId == token.id
          );
          if (combatant) {
            game.combat.rollInitiative([combatant.id]);
          } else {
            actor.rollInitiative({ createCombatants: true });
          }
          break;
      }
    }

    async #handleActiveEffectToggle(actionId, actor) {
      const effect = actor.data.effects.get(actionId);
      await effect.update({ disabled: !effect.disabled });
      Hooks.callAll('forceUpdateTokenActionHud');
    }

    async #handleStatusEffectToggle(actionId, actor) {
      const condition = game.clt.conditions.find(
        (condition) => actionId === condition.id
      );

      if (game.clt.hasCondition(condition.name, actor)) {
        game.clt.removeCondition(condition.name, actor);
      } else {
        game.clt.addCondition(condition.name, actor);
      }

      Hooks.callAll('forceUpdateTokenActionHud');
    }

    async #handleWeaponAction(event, actor, token, actionTypeId, actionId) {
      const item = actor.items.get(actionId);
      // console.debug('*** #handleWeaponAction', {
      //   event,
      //   actionId,
      //   actionTypeId,
      //   actor,
      //   item,
      //   token,
      // });

      let dataId;

      switch (actionTypeId) {
        case WEAPON_ACTION_TYPES.CYCLE_EQUIPPED:
          if (item.type === ITEM_TYPES.CYBERDECK || item.type === ITEM_TYPES.WEAPON) {
            Utils.cprCycleEquipState(actor, item);
          }
          break;

        // data-fire-mode
        case WEAPON_ACTION_TYPES.SUPPRESSIVE_FIRE:
        case WEAPON_ACTION_TYPES.TOGGLE_AIMED:
        case WEAPON_ACTION_TYPES.TOGGLE_AUTOFIRE:
          dataId = 'data-fire-mode';
          const flag = getProperty(
            actor,
            `flags.${game.system.id}.firetype-${actionId}`
          );

          if (token !== null && actionTypeId === 'autofire') {
            const weaponDvTable = actor.getOwnedItem(actionId).system.dvTable;
            const currentDvTable =
              weaponDvTable === ''
                ? getProperty(token, 'flags.cprDvTable')
                : weaponDvTable;
            if (typeof currentDvTable !== 'undefined') {
              const dvTable = currentDvTable.replace(' (Autofire)', '');
              const dvTables = await CPRSystemUtils.GetDvTables();
              const afTable = dvTables.filter(
                (table) =>
                  table.name.includes(dvTable) &&
                  table.name.includes('Autofire')
              );
              let newDvTable = currentDvTable;
              if (afTable.length > 0) {
                newDvTable = flag === actionTypeId ? dvTable : afTable[0];
              }
              token.flags = { cprDvTable: newDvTable };
            }
          }

          if (flag === actionTypeId) {
            await actor.unsetFlag(game.system.id, `firetype-${actionId}`);
          } else {
            await actor.setFlag(
              game.system.id,
              `firetype-${actionId}`,
              actionTypeId
            );
          }
          break;

        // data-action
        case WEAPON_ACTION_TYPES.CHANGE_AMMO:
          await item._loadItem();
          break;
        case WEAPON_ACTION_TYPES.MEASURE_DV:
          await item._setDvTable(actor, item.system.dvTable);
          break;
        case WEAPON_ACTION_TYPES.RELOAD:
          await item._loadItem(item.system.magazine.ammoData.uuid);
          break;

        // data-roll-type
        case WEAPON_ACTION_TYPES.ROLL_ATTACK:
        case WEAPON_ACTION_TYPES.ROLL_DAMAGE:
          this.#handleAction(
            event,
            actor,
            token,
            actionTypeId,
            actionId,
            undefined
          );
          break;
      }

      Hooks.callAll('forceUpdateTokenActionHud');
    }
  };
});
