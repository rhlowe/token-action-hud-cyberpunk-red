import CPRSystemUtils from '../node_modules/fvtt-cyberpunk-red-core/src/modules/utils/cpr-systemUtils.js';
import CPRChat from '../node_modules/fvtt-cyberpunk-red-core/src/modules/chat/cpr-chat.js';

export let RollHandler = null;

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
  /**
   * Extends Token Action HUD Core's RollHandler class and handles action events triggered when an action is clicked
   */
  RollHandler = class RollHandler extends coreModule.api.RollHandler {
    /**
     * Handle action click
     * Called by Token Action HUD Core when an action is left or right-clicked
     * @override
     * @param {object} event        The event
     * @param {string} encodedValue The encoded value
     */
    async handleActionClick(event, encodedValue) {
      const [actionTypeId, actionId] = encodedValue.split('|');

      const renderable = ['item'];

      if (renderable.includes(actionTypeId) && this.isRenderItem()) {
        return this.doRenderItem(this.actor, actionId);
      }

      const knownCharacters = ['character'];

      // If single actor is selected
      if (this.actor) {
        await this.#handleAction(
          event,
          this.actor,
          this.token,
          actionTypeId,
          actionId
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
    async #handleAction(event, actor, token, actionTypeId, actionId) {
      console.debug('*** handleAction default', {event, actor, token, actionTypeId, actionId});
      let tahCprRoll = null;
      let item = null;

      if (actionTypeId === 'item') {
        item = actor.items.get(actionId);
        switch (item.type) {
          // case 'item':
          //   this.#handleItemAction(event, actor, actionId);
          //   break;
          case 'skill':
            tahCprRoll = item.createRoll(item.type, actor);
            break;
          // case 'utility':
          //   this.#handleUtilityAction(token, actionId);
          //   break;
          default:
        }
      }

      if (actionTypeId === 'stat') {
        tahCprRoll = actor.createRoll(actionTypeId, actionId);
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
      // if (cprRoll instanceof CPRRolls.CPRDeathSaveRoll) {
      //   cprRoll.saveResult = this.actor.processDeathSave(cprRoll);
      // }

      // "Consume" LUCK if used
      if (Number.isInteger(tahCprRoll.luck) && tahCprRoll.luck > 0) {
        const luckStat = actor.system.stats.luck.value;
        actor.update({
          "system.stats.luck.value":
            luckStat - (tahCprRoll.luck > luckStat ? luckStat : tahCprRoll.luck),
        });
      }

      token = token === null ? null : token.data._id;
      const targetedTokens = CPRSystemUtils.getUserTargetedOrSelected("targeted"); // get user targeted tokens for output to chat

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
      console.debug('*** handleItemAction', {event, actor, actionId})
      const item = actor.items.get(actionId);
      item.toChat(event);
    }

    /**
     * Handle utility action
     * @private
     * @param {object} token    The token
     * @param {string} actionId The action id
     */
    async #handleUtilityAction(token, actionId) {
      switch (actionId) {
        case 'endTurn':
          if (game.combat?.current?.tokenId === token.id) {
            await game.combat?.nextTurn();
          }
          break;
      }
    }
  };
});
