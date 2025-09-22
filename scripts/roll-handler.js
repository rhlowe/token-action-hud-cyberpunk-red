import {
  GROUP,
  ITEM_TYPES,
  ROLL_TYPES,
  WEAPON_ACTION_TYPES,
} from './constants.js';
import { Utils } from './utils.js';
import CPRChat from '../../../systems/cyberpunk-red-core/modules/chat/cpr-chat.js';
import CPRSystemUtils from '../../../systems/cyberpunk-red-core/modules/utils/cpr-systemUtils.js';
import * as CPRRolls from '../../../systems/cyberpunk-red-core/modules/rolls/cpr-rolls.js';

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

      if (
        ['derez', 'rez', 'reduce-rez', 'reset-rez', 'erase'].includes(
          actionTypeId
        )
      ) {
        program = actor.getOwnedItem(actionId);
      }

      switch (actionTypeId) {
        case 'rez':
          if (!program.system.isRezzed) {
            // console.debug('***', {activeCyberdeck, program, token})
            const requestingToken = game.scenes.find(s => s.active).tokens.find(t => t.id === token.id);
            await activeCyberdeck.rezProgram(program, requestingToken);
            actor.sheet._updateOwnedItem(activeCyberdeck);
          }
          break;
        case 'derez':
          if (program.system.isRezzed) {
            await activeCyberdeck.derezProgram(program);
            actor.sheet._updateOwnedItem(activeCyberdeck);
          }
          break;
        case 'reduce-rez':
          if (program.system.isRezzed) {
            await activeCyberdeck.reduceRezProgram(program);
            actor.sheet._updateOwnedItem(activeCyberdeck);
          }
          break;
        case 'reset-rez':
          if (program.system.isRezzed) {
            await activeCyberdeck.resetRezProgram(program);
            actor.sheet._updateOwnedItem(activeCyberdeck);
          }
          break;
        case 'erase':
          await activeCyberdeck.uninstallItems([program]);
          await activeCyberdeck.syncPrograms();
          break;
        case 'activeEffects':
          await this.#handleActiveEffectToggle(actionId, actor);
          break;
        case 'injury':
          await this.#handleStatusEffectToggle(actionId, actor);
          break;
        case 'criticalInjury':
          if (actionId === 'rollCriticalInjury') {
            await this.token.actor.sheet._rollCriticalInjury();
            break;
        }
          await this.#handleRemoveCriticalInjury(actionId, actor);
          break;
        case 'ledger':
          await this.actor.sheet.showLedger(actionId);
          break;
      }

      if (['rez','derez','reduce-rez','reset-rez','erase'].includes(actionTypeId)) {
        const updateList = [];
        if (activeCyberdeck.isOwned && activeCyberdeck.isEmbedded) {
          updateList.push({ _id: activeCyberdeck.id, system: activeCyberdeck.system });
        }

        if (program.isOwned && program.isEmbedded) {
          updateList.push({ _id: program.id, system: program.system });
        }

        if (updateList.length > 0) {
          actor.updateEmbeddedDocuments("Item", updateList);
        }
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
              },
            },
            executionType: 'atk',
          });
          break;

        case 'rollDamage':
          tahCprRoll = activeCyberdeck.createRoll('cyberdeckProgram', actor, {
            programUUID: actionId,
            netRoleItem: {
              system: {
                ...actor.items.get(actor.system.roleInfo.activeNetRole).system,
              },
            },
            executionType: 'damage',
          });
          break;

        case 'rollDef':
          tahCprRoll = activeCyberdeck.createRoll('cyberdeckProgram', actor, {
            programUUID: actionId,
            netRoleItem: {
              system: {
                ...actor.items.get(actor.system.roleInfo.activeNetRole).system,
              },
            },
            executionType: 'def',
          });
          break;

        case ROLL_TYPES.INTERFACEABILITY:
          const netRoleItem = actor.itemTypes.role.find(
            (r) => r.id === actor.system.roleInfo.activeNetRole
          );

          if (!netRoleItem) {
            const error = CPRSystemUtils.Localize(
              "CPR.messages.noNetrunningRoleConfigured"
            );
            CPRSystemUtils.DisplayMessage("error", error);
            return;
          }

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
        case CPRRolls.rollTypes.ATTACK:
          item = actor.getOwnedItem(actionId);
          const fireMode = this._getFireMode(actionId);
          tahCprRoll = item.createRoll(fireMode, actor);
          break;
        case CPRRolls.rollTypes.DAMAGE:
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
        Hooks.callAll('forceUpdateTokenActionHud');
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

      token = token === null ? null : token.document.id;
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
      const effect = Array.from(actor.allApplicableEffects()).find(e => e.id === actionId);
      if (effect) {
        await effect.update({ disabled: !effect.disabled });
        Hooks.callAll('forceUpdateTokenActionHud');
      }
    }

    async #handleRemoveCriticalInjury(actionId, actor) {
      const injury = this.actor.getOwnedItem(actionId);
      if (injury) {
        await this.actor.sheet._deleteOwnedItem(injury);
      }
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
          if (
            item.type === ITEM_TYPES.CYBERDECK ||
            item.type === ITEM_TYPES.WEAPON
          ) {
            Utils.cprCycleEquipState(actor, item);
          }
          break;

        // data-fire-mode
        case WEAPON_ACTION_TYPES.SUPPRESSIVE_FIRE:
        case WEAPON_ACTION_TYPES.TOGGLE_AIMED:
        case WEAPON_ACTION_TYPES.TOGGLE_AUTOFIRE:
          dataId = 'data-fire-mode';
          const flag = foundry.utils.getProperty(
            actor,
            `flags.${game.system.id}.firetype-${actionId}`
          );

          if (token !== null && actionTypeId === 'autofire') {
            const weaponDvTable = actor.getOwnedItem(actionId).system.dvTable;
            const currentDvTable =
              weaponDvTable === ''
                ? foundry.utils.getProperty(token, 'flags.cprDvTable')
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
          await item.load();
          break;
        case WEAPON_ACTION_TYPES.MEASURE_DV:
          await item._setDvTable(actor, item.system.dvTable);
          break;
        case WEAPON_ACTION_TYPES.RELOAD:
          await item.reload();
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
