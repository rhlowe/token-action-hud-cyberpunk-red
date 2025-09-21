// /Users/rhlowe/Library/Application Support/FoundryVTT/Data/modules/token-action-hud-cyberpunk-red
import {
  ACTION_TYPE,
  GROUP,
  ROLL_TYPES,
  WEAPON_ACTION_TYPES,
} from './constants.js';
import { Utils } from './utils.js';

export let ActionHandler = null;

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
  // console.debug('*** coreModule', coreModule);

  /**
   * Extends Token Action HUD Core's ActionHandler class and builds system-defined actions for the HUD
   */
  ActionHandler = class ActionHandler extends coreModule.api.ActionHandler {
    getFavoritedName(name = '', isFavorite = false, isUpgraded = false) {
      let returnValue = [isFavorite ? '★' : '', name].join(' ');
      returnValue = [returnValue, isUpgraded ? '⬆' : ''].join(' ');

      return returnValue;
    }

    /**
     * Build system actions
     * Called by Token Action HUD Core
     * @override
     * @param {array} groupIds
     */
    async buildSystemActions(groupIds) {
      // console.debug('*** itemTypes', this.actor.itemTypes);

      if (game.canvas.tokens.controlled.length > 1) {
        return;
      }

      // Settings
      this.displayCharacterSkillWithZeroMod = Utils.getSetting(
        'displayCharacterSkillWithZeroMod'
      );
      this.displayMookSkillWithZeroMod = Utils.getSetting(
        'displayMookSkillWithZeroMod'
      );
      // this.displayUnequipped = Utils.getSetting('displayUnequipped');
      this.equipThrownWeapon = Utils.getSetting('equipThrownWeapon');
      this.equipUnarmed = Utils.getSetting('equipUnarmed');

      if (this.actor?.type === 'character' || this.actor?.type === 'mook') {
        if (
          this.equipUnarmed &&
          !this.actor.items.find((item) => item.name === 'Unarmed')
        ) {
          // Item ID X6VYB5awDbtURwIv is "Unarmed" in the CPR compendium.
          let item = await game.packs
            .get('cyberpunk-red-core.core_weapons')
            .getDocument('X6VYB5awDbtURwIv');
          await this.actor.createEmbeddedDocuments('Item', [item]);
        }

        if (
          this.equipThrownWeapon &&
          !this.actor.items.find((item) => item.name === 'Thrown Weapon')
        ) {
          // Item ID 29p2bEfPcAWHpsTY is "Thrown Weapon" in the CPR compendium.
          let item = await game.packs
            .get('cyberpunk-red-core.core_weapons')
            .getDocument('29p2bEfPcAWHpsTY');
          await this.actor.createEmbeddedDocuments('Item', [item]);
        }
      }

      this.sortedItemTypes = {};
      for (const name in this.actor.itemTypes) {
        this.sortedItemTypes[name] = await this.actor.itemTypes[name].sort(
          (a, b) => {
            if (a.system.favorite === b.system.favorite) {
              return a.name.localeCompare(b.name);
            }

            return a.system.favorite ? -1 : 1;
          }
        );
      }

      // Set actor and token variables
      this.actors = !this.actor ? game.canvas.tokens.controlled : [this.actor];
      this.actorType = this.actor?.type;

      // Set items variable
      if (this.actor) {
        let items = this.actor.items;
        items = coreModule.api.Utils.sortItemsByName(items);
        this.items = items;
      }

      switch (this.actorType) {
        case 'character':
        case 'mook':
          this.#buildCharacterActions();
          break;
        case 'blackIce':
          this.#buildBlackIceDamage();
        case 'demon':
          this.#buildStats();
          break;
      }

      if (!this.actor) {
        this.#buildMultipleTokenActions();
      }
    }

    async #buildBlackIceDamage() {
      const groupData = { id: 'weapon', type: 'system' };
      const programUUID =
        this.actor.token.flags['cyberpunk-red-core'].programUUID.split('.');
      const { standard, blackIce } = game.items.get(programUUID[1]).system
        .damage;
      const actions = [];

      if (Number.isNumeric(Number.parseInt(standard))) {
        actions.push({
          encodedValue: [ROLL_TYPES.NET, 'standard'].join(this.delimiter),
          id: programUUID,
          info1: { text: standard },
          name: coreModule.api.Utils.i18n(`tokenActionHud.template.standard`),
        });
      }

      if (Number.isNumeric(Number.parseInt(blackIce))) {
        actions.push({
          encodedValue: [ROLL_TYPES.NET, 'blackIce'].join(this.delimiter),
          id: programUUID,
          info1: { text: blackIce },
          name: coreModule.api.Utils.i18n(`TYPES.Actor.blackIce`),
        });
      }
      this.addActions(actions, groupData);
    }

    /**
     * Build character actions
     * @private
     */
    async #buildCharacterActions() {
      this.#buildActiveEffectsToggleActions();
      this.#buildAmmoItemActions();
      this.#buildArmorItemActions();
      this.#buildClothingItemActions();
      this.#buildConditionLabToggleActions();
      this.#buildCriticalInjuryItemActions();
      this.#buildCyberdeckItemActions();
      this.#buildCyberwareItemActions();
      this.#buildDeathSave();
      this.#buildDrugItemActions();
      this.#buildFacedown();
      this.#buildFVTTCoreActions();
      this.#buildGearItemActions();
      this.#buildInterfaceActions();
      this.#buildItemUpgradeItemActions();
      this.#buildLedgerActions();
      this.#buildProgramActions();
      this.#buildRoleItemActions();
      this.#buildSkillItemActions();
      this.#buildStats();
      this.#buildVehicleItemActions();
      this.#buildWeaponAttackActions();
      this.#buildWeaponItemActions();
    }

    #buildActiveEffectsToggleActions() {
      const groupData = { id: GROUP.activeEffects.id, type: 'system' };

      // const actorEffects = this.actor.effects;
      const allApplicableEffects = Array.from(
        this.actor.allApplicableEffects()
      );
      // const appliedEffects = this.actor.appliedEffects;
      const cltActiveEffects = this.actor.effects
        .map((effect) => effect.flags['condition-lab-triggler']?.conditionId)
        .filter(Boolean);
      const allActorEffects = [
        // ...actorEffects,
        ...allApplicableEffects,
        // ...appliedEffects,
      ].filter(
        (effect) =>
          !cltActiveEffects.includes(
            effect.flags['condition-lab-triggler']?.conditionId
          )
      );

      // console.debug('*** allApplicableEffects', {
      //   allActorEffects,
      //   actorEffects,
      //   allApplicableEffects,
      //   appliedEffects,
      //   cltActiveEffects,
      // });

      const actions = allActorEffects.map((effect) => {
        // const actions = actorEffects.map((effect) => {
        const { active, id, img, name, usage } = effect;
        const effectTooltip = coreModule.api.Utils.i18n(
          `CPR.effectSheet.uses.${usage ?? 'toggled'}`
        );

        const encodedValue = [groupData.id, id].join(this.delimiter);
        const cssClass = 'toggle' + (active ? ' active' : '');
        const info1 = { text: effectTooltip };
        const info2 = '';
        const info3 = '';
        const selected = active;
        const system = 'system';
        const tooltip = ''; // effectTooltip // '<ul><li>foo</li><li>bars</li></ul>'?
        const onClick = undefined;
        const onHover = undefined;

        return {
          id,
          name,
          encodedValue,
          cssClass,
          img,
          info1,
          info2,
          info3,
          selected,
          system,
          tooltip,
          onClick,
          onHover,
        };
      });

      this.addActions(actions, groupData);
    }

    #buildConditionLabToggleActions() {
      if (!game.clt) {
        return;
      }

      const groupData = { id: GROUP.injury.id, type: 'system' };
      const cltActiveEffects = this.actor.effects
        .map((effect) => effect.flags['condition-lab-triggler']?.conditionId)
        .filter(Boolean);
      // console.debug('*** #buildConditionLabToggleActions', {
      //   cltActiveEffects,
      //   ['clt.conditions']: game.clt.conditions,
      //   criticalInjury: this.token.actor.itemTypes.criticalInjury,
      // });

      const actions = game.clt.conditions.map((condition) => {
        const { icon, id, name } = condition;
        const effectIsActive = cltActiveEffects.includes(id);

        const encodedValue = [groupData.id, id].join(this.delimiter);
        const cssClass = 'toggle' + (effectIsActive ? ' active' : '');
        const img = icon;
        const info1 = '';
        const info2 = '';
        const info3 = '';
        const selected = effectIsActive;
        const system = 'system';
        const tooltip = '';
        const onClick = undefined;
        const onHover = undefined;

        return {
          id,
          name,
          encodedValue,
          cssClass,
          img,
          info1,
          info2,
          info3,
          selected,
          system,
          tooltip,
          onClick,
          onHover,
        };
      });

      this.addActions(actions, groupData);
    }

    /**
     * Build multiple token actions
     * @private
     * @returns {object}
     */
    async #buildMultipleTokenActions() {}

    async #buildFVTTCoreActions() {
      const groupData = { id: GROUP.utility.id, type: 'system' };
      let visibiltyString = `tokenActionHud.template.visibility.${
        this.token.document.hidden ? 'makeVisible' : 'makeInvisible'
      }`;
      const endCombatTurnAction =
        game.combat?.current?.tokenId === this.token?.id
          ? {
              encodedValue: [groupData.id, 'endTurn'].join(this.delimiter),
              id: 'endTurn',
              name: coreModule.api.Utils.i18n(
                'tokenActionHud.template.endTurn'
              ),
            }
          : false;

      const actions = [
        {
          encodedValue: [groupData.id, 'initiative'].join(this.delimiter),
          id: groupData.id,
          info1: { text: this.actor.system.stats.ref.value.toString() },
          name: coreModule.api.Utils.i18n(`CPR.chat.initiative`),
        },
        endCombatTurnAction,
        /**
         * toggleVisibility doesn't require anything in roll-handler.js
         * either it is handled in TAH Core or via magic in FVTT.
         */
        {
          encodedValue: [groupData.id, 'toggleVisibility'].join(this.delimiter),
          id: 'toggleVisibility',
          name: coreModule.api.Utils.i18n(visibiltyString),
        },
      ].filter(Boolean);

      this.addActions(actions, groupData);
    }

    async #buildDeathSave() {
      const groupData = { id: ROLL_TYPES.DEATHSAVE, type: 'system' };
      const name = coreModule.api.Utils.i18n(`CPR.rolls.deathSave.title`);
      const actions = [
        {
          encodedValue: [groupData.id, groupData.id].join(this.delimiter),
          id: groupData.id,
          info1: {
            text: coreModule.api.Utils.i18n(`CPR.global.generic.deathPenalty`),
          },
          info2: {
            text: this.actor.system.derivedStats.deathSave.value.toString(),
          },
          name,
        },
      ];

      this.addActions(actions, groupData);
    }

    async #buildFacedown() {
      const groupData = { id: ROLL_TYPES.FACEDOWN, type: 'system' };
      const name = coreModule.api.Utils.i18n(`CPR.global.generic.facedown`);
      const actions = [
        {
          encodedValue: [groupData.id, groupData.id].join(this.delimiter),
          id: groupData.id,
          info1: { text: coreModule.api.Utils.i18n(`CPR.rolls.reputation`) },
          info2: { text: this.actor.system.reputation.value.toString() },
          name,
        },
      ];

      this.addActions(actions, groupData);
    }

    async #buildInterfaceActions() {
      if (this.items.size === 0) return;

      let activeCyberdeckId;
      for (const [itemId, itemData] of this.items) {
        if (
          itemData.type === 'cyberdeck' &&
          itemData.system.equipped === 'equipped'
        ) {
          activeCyberdeckId = itemId;
        }
      }

      if (!activeCyberdeckId) return;

      const groupData = { id: 'interface', type: 'system' };
      const actions = [];
      [
        ['backdoor', 'exit-door'],
        ['cloak', 'spy'],
        ['control', 'retro-controller'],
        ['defense', 'checked-shield'],
        ['eyedee', 'magnifying-glass'],
        ['pathfinder', 'treasure-map'],
        ['scanner', 'compass'],
        ['slide', 'run'],
        ['speed', 'speedometer'],
        ['virus', 'virus'],
        ['zap', 'bolt-spell-cast'],
      ].forEach(([id, svg]) => {
        let name = coreModule.api.Utils.i18n(
          `CPR.global.role.netrunner.interfaceAbility.${id}`
        );
        const imgPath = 'modules/token-action-hud-cyberpunk-red/static/';

        if (id === 'speed' || id === 'defense') {
          name = coreModule.api.Utils.i18n(`CPR.global.generic.${id}`);
        }

        actions.push({
          encodedValue: ['interface', id].join(this.delimiter),
          id,
          img: imgPath + svg + '.svg',
          name,
        });
      });

      this.addActions(actions, groupData);
    }

    async #buildLedgerActions() {
      const groupData = { id: GROUP.ledger.id, type: 'system' };

      const actions = ['improvementPoints', 'reputation', 'wealth'].map(
        (ledger) => {
          let info2 = '';

          switch (ledger) {
            case 'improvementPoints':
              info2 = this.actor.system.improvementPoints?.value.toString();
              break;
            case 'reputation':
              info2 = this.actor.system.reputation?.value.toString();
              break;
            case 'wealth':
              info2 = `${Number(
                this.actor.system.wealth?.value
              ).toLocaleString()} eb`;
              break;
          }

          return {
            encodedValue: ['ledger', ledger].join(this.delimiter),
            id: ledger,
            info1: { class: 'fas fa-sticky-note', text: ' ' },
            info2: { text: info2 },
            name: coreModule.api.Utils.i18n(
              `CPR.ledger.${ledger.toLowerCase()}`
            ),
            tooltip: coreModule.api.Utils.i18n('CPR.ledger.ledgerOpen'),
          };
        }
      );

      this.addActions(actions, groupData);
    }

    async #buildStats() {
      const groupData = { id: 'stat', type: 'system' };
      const actions = Object.entries(this.actor.system.stats)
        .filter(([stat, value]) => !['rez', 'actions'].includes(stat))
        .map((stat) => {
          // console.debug('*** stat', stat);
          let tooltip = '';
          let name = coreModule.api.Utils.i18n(`CPR.global.stats.${stat[0]}`);
          let modifier;

          switch (this.actorType) {
            case 'character':
            case 'mook':
              modifier = this.actor.system.stats[stat[0]].value ?? 0;
              if (this.actor.system.stats[stat[0]].max) {
                modifier += ` / ${this.actor.system.stats[stat[0]].max}`;
              }
              const namePath = `CPR.global.stats.${stat[0]}`;
              const tooltipPath = `CPR.global.stats.${stat[0]}ToolTip`;
              name = game.i18n.localize(namePath);
              // tooltip = game.i18n.localize(tooltipPath);
              // console.debug(`*** ${stat[0]} tool`, tooltipPath, tooltip);

              break;
            case 'blackIce':
              name = game.i18n.localize(`CPR.global.blackIce.stats.${stat[0]}`);
            case 'demon':
              modifier = this.actor.system.stats[stat[0]];
              if (stat[0] === 'combatNumber') {
                name = game.i18n.localize(`CPR.global.demon.combatNumber`);
              }
              if (stat[0] === 'interface') {
                name = game.i18n.localize(
                  `CPR.global.role.netrunner.ability.interface`
                );
              }
              break;
          }

          return {
            encodedValue: ['stat', stat[0]].join(this.delimiter),
            id: stat[0],
            info1: { text: modifier.toString() },
            name,
            tooltip,
          };
        });

      this.addActions(actions, groupData);
    }

    // this.actor.itemTypes

    // ammo
    async #buildAmmoItemActions() {
      const ammo = this.sortedItemTypes.ammo;
      const groupData = { id: GROUP.ammo.id, type: 'system' };

      const actions = ammo.map((ammoItem) => {
        const { id, img, name } = ammoItem;

        const encodedValue = [groupData.id, id].join(this.delimiter);
        const info1 = {
          text:
            coreModule.api.Utils.i18n(
              `tokenActionHud.template.quantityString`
            ) + ammoItem.system.amount,
        };
        const system = 'system';
        const tooltip = ammoItem.system.description.value;

        return {
          id,
          name: this.getFavoritedName(name, ammoItem.system.favorite),
          encodedValue,
          img,
          info1,
          system,
          tooltip,
        };
      });

      this.addActions(actions, groupData);
    }

    // armor
    async #buildArmorItemActions() {
      const armors = this.sortedItemTypes.armor;
      const groupData = { id: GROUP.armor.id, type: 'system' };

      const actions = armors.map((armor) => {
        const { id, img, name } = armor;

        const bodyInfo = armor.system.isBodyLocation
          ? `${coreModule.api.Utils.i18n('CPR.global.location.body')}: ${
              armor.system.bodyLocation.sp - armor.system.bodyLocation.ablation
            } / ${armor.system.bodyLocation.sp}`
          : undefined;
        const headInfo = armor.system.isHeadLocation
          ? `${coreModule.api.Utils.i18n('CPR.global.location.head')}: ${
              armor.system.headLocation.sp - armor.system.headLocation.ablation
            } / ${armor.system.headLocation.sp}`
          : undefined;
        const shieldHp = armor.system.shieldHitPoints
          ? `${armor.system.shieldHitPoints.value} / ${
              armor.system.shieldHitPoints.max
            } ${coreModule.api.Utils.i18n('CPR.global.generic.hitpointsShort')}`
          : undefined;

        const encodedValue = [groupData.id, id].join(this.delimiter);
        const info1 = { text: armor.system.equipped };
        const info2 = {
          text: armor.system.shieldHitPoints.max ? shieldHp : bodyInfo,
        };
        const info3 = { text: headInfo };
        const system = 'system';
        const tooltip = armor.system.description.value;

        return {
          id,
          name: this.getFavoritedName(name, armor.system.favorite),
          encodedValue,
          img,
          info1,
          info2,
          info3,
          system,
          tooltip,
        };
      });

      this.addActions(actions, groupData);
    }

    // clothing
    async #buildClothingItemActions() {
      const clothings = this.sortedItemTypes.clothing;
      const groupData = { id: GROUP.clothing.id, type: 'system' };

      const actions = clothings.map((clothing) => {
        const { id, img, name } = clothing;
        const encodedValue = [groupData.id, id].join(this.delimiter);
        const info1 = {
          text:
            coreModule.api.Utils.i18n(
              `tokenActionHud.template.quantityString`
            ) + clothing.system.amount,
        };
        const info2 = { text: clothing.system.equipped };
        const system = 'system';
        const tooltip = clothing.system.description.value;

        return {
          encodedValue,
          id,
          img,
          info1,
          info2,
          name: this.getFavoritedName(name, clothing.system.favorite),
          system,
          tooltip,
        };
      });

      this.addActions(actions, groupData);
    }

    // criticalInjury
    async #buildCriticalInjuryItemActions() {
      const groupData = { id: GROUP.criticalInjury.id, type: 'system' };
      const criticalInjuries = this.actor.itemTypes.criticalInjury;
      const actions = [
        // Roll Critical Injury
        {
          encodedValue: [groupData.id, 'rollCriticalInjury'].join(
            this.delimiter
          ),
          id: 'rollCriticalInjury',
          info1: { class: 'fas fa-dice', text: ' ' },
          name: coreModule.api.Utils.i18n(
            'CPR.characterSheet.bottomPane.fight.criticalInjuryRoll'
          ),
          system: 'system',
          tooltip: '',
        },
      ];

      criticalInjuries.forEach((injury) => {
        actions.push({
          cssClass: 'toggle active',
          encodedValue: [groupData.id, injury.id].join(
            this.delimiter
          ),
          id: injury.id,
          img: injury.img,
          name: injury.name,
          system: 'system',
          tooltip: (injury.system.description.value + coreModule.api.Utils.i18n('tokenActionHud.template.injuryTooltip')),
        });
      });

      this.addActions(actions, groupData);
    }

    // cyberdeck
    async #buildCyberdeckItemActions() {
      const cyberdecks = this.sortedItemTypes.cyberdeck;

      cyberdecks.forEach((cyberdeck) => {
        const group = {
          id: cyberdeck.id,
          name: this.getFavoritedName(
            cyberdeck.name,
            cyberdeck.system.favorite
          ),
          nestId: `netrunning_${cyberdeck.id}`,
          settings: {
            image: coreModule.api.Utils.getImage(cyberdeck),
            showTitle: false,
          },
          type: 'system',
        };
        this.addGroup(group, { id: 'cyberdeck', type: 'system' });

        const actions = [];

        actions.push(
          // Base Cyberdeck info
          {
            cssClass:
              'toggle' +
              (cyberdeck.system.equipped === 'equipped' ? ' active' : ''),
            encodedValue: [
              WEAPON_ACTION_TYPES.CYCLE_EQUIPPED,
              cyberdeck.id,
            ].join(this.delimiter),
            id: WEAPON_ACTION_TYPES.CYCLE_EQUIPPED,
            // img: coreModule.api.Utils.getImage(cyberdeck),
            info1: { text: cyberdeck.system.equipped },
            info2: {
              text: `${coreModule.api.Utils.i18n(
                'CPR.itemSheet.container.availableSlots'
              )} ${
                cyberdeck.system.installedItems.slots -
                cyberdeck.system.installedItems.usedSlots
              } / ${cyberdeck.system.installedItems.slots}`,
            },
            info3: { text: '' },
            name: this.getFavoritedName(
              cyberdeck.name,
              cyberdeck.system.favorite
            ),
            tooltip: cyberdeck.system.description.value,
          }
        );

        this.addActions(actions, { id: group.id, type: 'system' });
      });
    }

    // cyberware
    async #buildCyberwareItemActions() {
      /**
       * Only display all foundational, all non-weapon, and uninstalled weapon Cyberwares.
       */
      const cyberwares = this.sortedItemTypes.cyberware.filter((c) => {
        return (
          c.system.isFoundational ||
          !c.system.isWeapon ||
          (c.system.isWeapon && !c.system.isInstalled)
        );
      });
      const groupData = { id: GROUP.cyberware.id, type: 'system' };

      const actions = cyberwares.map((cyberware) => {
        const { id, img, name } = cyberware;

        const isFoundational = cyberware.system.isFoundational;
        const isInstalled = cyberware.system.isInstalled;

        const slots = cyberware.system.installedItems.slots;
        const usedSlots = cyberware.system.installedItems.usedSlots;

        const encodedValue = [groupData.id, id].join(this.delimiter);
        const cssClass = undefined;
        const info1 = {
          text: isFoundational
            ? coreModule.api.Utils.i18n(`CPR.global.generic.foundational`)
            : '',
        };
        const info2 = {
          text: isInstalled
            ? coreModule.api.Utils.i18n(
                `CPR.characterSheet.bottomPane.fight.installed`
              )
            : '',
        };
        const info3 = {
          text: isFoundational ? `${usedSlots} / ${slots}` : undefined,
        };
        const selected = undefined;
        const system = 'system';
        const tooltip = undefined;
        const onClick = undefined;
        const onHover = undefined;

        return {
          id,
          name,
          encodedValue,
          cssClass,
          img,
          info1,
          info2,
          info3,
          selected,
          system,
          tooltip,
          onClick,
          onHover,
        };
      });

      this.addActions(actions, groupData);
    }

    // drug
    async #buildDrugItemActions() {
      const drugs = this.sortedItemTypes.drug;
      const groupData = { id: GROUP.drug.id, type: 'system' };

      const actions = drugs.map((drug) => {
        const { id, img, name } = drug;
        const encodedValue = [groupData.id, id].join(this.delimiter);
        const cssClass = undefined;
        const info1 = {
          text:
            coreModule.api.Utils.i18n(
              `tokenActionHud.template.quantityString`
            ) + drug.system.amount,
        };
        const info2 = undefined;
        const info3 = undefined;
        const selected = undefined;
        const system = 'system';
        const tooltip = drug.system.description.value;
        const onClick = undefined;
        const onHover = undefined;

        return {
          id,
          name,
          encodedValue,
          cssClass,
          img,
          info1,
          info2,
          info3,
          selected,
          system,
          tooltip,
          onClick,
          onHover,
        };
      });

      this.addActions(actions, groupData);
    }

    // gear
    async #buildGearItemActions() {
      const gears = this.sortedItemTypes.gear;
      const groupData = { id: GROUP.gear.id, type: 'system' };

      const actions = gears.map((gear) => {
        const { id, img, name } = gear;
        const encodedValue = [groupData.id, id].join(this.delimiter);
        const cssClass = undefined;
        const info1 = {
          text:
            coreModule.api.Utils.i18n(
              `tokenActionHud.template.quantityString`
            ) + gear.system.amount,
        };
        const info2 = undefined;
        const info3 = undefined;
        const selected = undefined;
        const system = 'system';
        const tooltip = gear.system.description.value;
        const onClick = undefined;
        const onHover = undefined;

        return {
          id,
          name,
          encodedValue,
          cssClass,
          img,
          info1,
          info2,
          info3,
          selected,
          system,
          tooltip,
          onClick,
          onHover,
        };
      });

      this.addActions(actions, groupData);
    }

    // itemUpgrade
    async #buildItemUpgradeItemActions() {
      const itemUpgrades = this.sortedItemTypes.itemUpgrade;
      const groupData = { id: GROUP.itemUpgrade.id, type: 'system' };

      const actions = itemUpgrades.map((itemUpgrade) => {
        const { id, img, name } = itemUpgrade;
        const encodedValue = [groupData.id, id].join(this.delimiter);
        const cssClass = undefined;
        const info1 = undefined;
        const info2 = undefined;
        const info3 = undefined;
        const selected = undefined;
        const system = 'system';
        const tooltip = itemUpgrade.system.description.value;
        const onClick = undefined;
        const onHover = undefined;

        return {
          id,
          name,
          encodedValue,
          cssClass,
          img,
          info1,
          info2,
          info3,
          selected,
          system,
          tooltip,
          onClick,
          onHover,
        };
      });

      this.addActions(actions, groupData);
    }

    // program
    async #buildProgramActions() {
      const groupData = { id: GROUP.installed.id, type: 'system' };
      const activeCyberdeck = this.sortedItemTypes.cyberdeck.find(
        (deck) => deck.system.equipped === 'equipped'
      );
      if (activeCyberdeck === undefined) {
        return;
      }
      const installedIds = activeCyberdeck.system.installedItems.list;
      const installed = this.actor.items.filter((item) =>
        installedIds.includes(item._id)
      );
      // console.debug('*** buildProgramActions', {
      //   activeCyberdeck,
      //   installed,
      // });

      installed.forEach((program) => {
        const programReference = program.isRezzed
          ? activeCyberdeck.system.programs.rezzed.find(
              (rezzedProgram) => rezzedProgram.uuid === program.uuid
            )
          : program;
        const id = programReference.uuid;
        const name = programReference.name;
        let programClass = '';

        switch (programReference.class) {
          case 'antipersonnelattacker':
            programClass = coreModule.api.Utils.i18n(
              `CPR.global.programClass.antiPersonnelAttacker`
            );
            break;
          case 'antiprogramattacker':
            programClass = coreModule.api.Utils.i18n(
              `CPR.global.programClass.antiProgramAttacker`
            );
            break;
          default:
            programClass = coreModule.api.Utils.i18n(
              `CPR.global.programClass.${programReference.class}`
            );
        }

        const group = {
          id,
          name,
          nestId: `installed_${programReference.uuid}`,
          settings: {
            image:
              'systems/cyberpunk-red-core/icons/compendium/default/Default_Program.svg',
            showTitle: false,
            // style: 'list',
            // style: 'tab',
          },
          type: 'system',
        };
        const actions = [];
        this.addGroup(group, { id: 'installed', type: 'system' });

        const programAction = programReference.isRezzed ? 'derez' : 'rez';

        actions.push({
          cssClass: 'toggle' + (programReference.isRezzed ? ' active' : ''),
          encodedValue: [programAction, programReference.uuid].join(
            this.delimiter
          ),
          id,
          info1: { text: programClass },
          info2: programReference.isRezzed
            ? {
                text: coreModule.api.Utils.i18n(
                  'CPR.characterSheet.bottomPane.fight.rezzed'
                ),
              }
            : undefined,
          name,
          tooltip: program.system.description.value,
        });

        const programStats = {
          atk: 'CPR.global.blackIce.stats.atk',
          def: 'CPR.global.blackIce.stats.def',
          per: 'CPR.global.blackIce.stats.per',
          spd: 'CPR.global.blackIce.stats.spd',
          rez: 'CPR.global.generic.rez',
        };

        if (programReference.isRezzed) {
          switch (programReference.class) {
            case 'booster':
            case 'defender':
              ['atk', 'def', 'rez'].forEach((stat) => {
                actions.push({
                  id: stat,
                  info1: { text: programReference[stat].toString() },
                  name: coreModule.api.Utils.i18n(programStats[stat]),
                });
              });
              actions.push(
                ...[
                  {
                    encodedValue: ['rollDef', programReference.uuid].join(
                      this.delimiter
                    ),
                    id: 'rollDef',
                    info1: { class: 'fas fa-shield red-fg', text: ' ' },
                    name: coreModule.api.Utils.i18n(
                      'CPR.characterSheet.bottomPane.fight.rollDefense'
                    ),
                  },
                  {
                    encodedValue: ['reduce-rez', programReference.uuid].join(
                      this.delimiter
                    ),
                    id: 'reduce-rez',
                    info1: { class: 'far fa-minus-square', text: ' ' },
                    name: coreModule.api.Utils.i18n(
                      'CPR.characterSheet.bottomPane.fight.reduceRez'
                    ),
                  },
                  {
                    encodedValue: ['reset-rez', programReference.uuid].join(
                      this.delimiter
                    ),
                    id: 'reset-rez',
                    info1: { class: 'fas fa-undo', text: ' ' },
                    name: coreModule.api.Utils.i18n(
                      'CPR.characterSheet.bottomPane.fight.resetRez'
                    ),
                  },
                ]
              );
              break;

            case 'antipersonnelattacker':
            case 'antiprogramattacker':
              ['atk'].forEach((stat) => {
                actions.push({
                  // encodedValue: [stat, name].join(this.delimiter),
                  id: stat,
                  info1: { text: programReference[stat].toString() },
                  name: coreModule.api.Utils.i18n(
                    `CPR.global.blackIce.stats.${stat}`
                  ),
                });
              });

              actions.push(
                ...[
                  {
                    encodedValue: ['rollAnAttack', programReference.uuid].join(
                      this.delimiter
                    ),
                    id: 'rollAnAttack',
                    info1: { class: 'fas fa-fist-raised red-fg', text: ' ' },
                    name: coreModule.api.Utils.i18n(
                      'CPR.characterSheet.bottomPane.fight.rollAnAttack'
                    ),
                  },
                  {
                    encodedValue: ['rollDamage', programReference.uuid].join(
                      this.delimiter
                    ),
                    id: 'rollDamage',
                    info1: { class: 'fas fa-tint red-fg', text: ' ' },
                    name: coreModule.api.Utils.i18n(
                      'CPR.actorSheets.commonActions.rollDamage'
                    ),
                  },
                ]
              );
              break;

            case 'blackice':
              ['atk', 'def', 'per', 'spd', 'rez'].forEach((stat) => {
                actions.push({
                  // encodedValue: [stat, name].join(this.delimiter),
                  id: stat,
                  info1: { text: programReference[stat].toString() },
                  name: coreModule.api.Utils.i18n(programStats[stat]),
                });
              });
              break;
          }

          actions.push({
            encodedValue: ['erase', programReference.uuid].join(this.delimiter),
            id: 'erase',
            info1: {
              class: 'fas fa-folder-minus',
              text: ' ',
            },
            name: coreModule.api.Utils.i18n(
              'CPR.characterSheet.bottomPane.fight.eraseProgram'
            ),
            tooltip: `${coreModule.api.Utils.i18n(
              'CPR.characterSheet.bottomPane.fight.eraseProgram'
            )}: ${programReference.name}`,
          });
        }

        this.addActions(actions, { id: group.id, type: 'system' });
      });
    }

    // role
    async #buildRoleItemActions() {
      const groupData = { id: GROUP.role.id, type: 'system' };
      const roles = this.sortedItemTypes.role;
      const roleMap = new Map();

      roles.forEach(async (role) => {
        if (role.system.hasRoll) {
          const encodedValue = [role.name, role.system.mainRoleAbility].join(
            this.delimiter
          );

          let roleItem = Object.assign(await role.clone(), {
            baseItem: role,
            encodedValue,
            name: role.system.mainRoleAbility,
            rollSubType: 'mainRoleAbility',
            subRoleName: role.system.mainRoleAbility,
            type: GROUP.role.id,
          });

          roleMap.set(encodedValue, roleItem);
        }

        if (role.system.abilities.length) {
          role.system.abilities.forEach(async (subRole) => {
            if (subRole.hasRoll) {
              const encodedValue = [role.name, subRole.name].join(
                this.delimiter
              );

              let roleSubItem = Object.assign(await role.clone(), {
                baseItem: role,
                encodedValue: encodedValue,
                name: subRole.name,
                rollSubType: 'subRoleAbility',
                subRoleName: subRole.name,
                type: GROUP.role.id,
              });

              roleMap.set(encodedValue, roleSubItem);
            }
          });
        }
      });

      this.actor.system.externalData.secretItems = await roleMap;

      const actions = [...roleMap].map(([itemId, itemData]) => {
        let name = itemData.name;

        const id = itemId;
        const actionTypeName = coreModule.api.Utils.i18n(
          ACTION_TYPE[GROUP.role.id]
        );
        const encodedValue = [GROUP.role.id, id].join(this.delimiter);

        let img;
        let tooltip;

        return {
          encodedValue,
          id,
          img,
          info1: { text: itemData.baseItem.name },
          info2: { text: itemData.baseItem.system.rank },
          name,
          tooltip,
        };
      });

      this.addActions(actions, groupData);
    }

    // skill
    async #buildSkillItemActions() {
      const groupData = { id: GROUP.skill.id, type: 'system' };

      const skills = this.sortedItemTypes.skill.filter((skill) => {
        if (
          ((this.actorType === 'mook' &&
            this.displayMookSkillWithZeroMod === false) ||
            (this.actorType === 'character' &&
              this.displayCharacterSkillWithZeroMod === false)) &&
          skill.system.level === 0
        ) {
          return false;
        }

        return true;
      });

      const actions = skills.map((skill) => {
        const { id, name } = skill;
        let i18nName = "";
        switch (name) {
          case "Conceal/Reveal Object":
            i18nName = coreModule.api.Utils.i18n(
              "CPR.global.itemType.skill.concealOrRevealObject"
            );
            break;
          case "Electronics/Security Tech":
            i18nName = coreModule.api.Utils.i18n(
              "CPR.global.itemType.skill.electronicsAndSecurityTech"
            );
            break;
          case "Paint/Draw/Sculpt":
            i18nName = coreModule.api.Utils.i18n(
              "CPR.global.itemType.skill.paintOrDrawOrSculpt"
            );
            break;
          case "Photography/Film":
            i18nName = coreModule.api.Utils.i18n(
              "CPR.global.itemType.skill.photographyAndFilm"
            );
            break;
          case "Resist Torture/Drugs":
            i18nName = coreModule.api.Utils.i18n(
              "CPR.global.itemType.skill.resistTortureOrDrugs"
            );
            break;
          case "Wardrobe & Style":
            i18nName = coreModule.api.Utils.i18n(
              "CPR.global.itemType.skill.wardrobeAndStyle"
            );
            break;
          default:
            if (name.startsWith("Language (") && name !== "Language (Streetslang)") {
              i18nName = coreModule.api.Utils.i18n(
                `tokenActionHud.template.languages.${name
                  .toLowerCase()
                  .replace(/[()]/g, "")
                  .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())}`
              );
            } else {
              i18nName = coreModule.api.Utils.i18n(
                `CPR.global.itemType.skill.${name
                  .toLowerCase()
                  .replace(/[()]/g, "")
                  .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())}`
              );
            }

        }
        const level = skill.system.level;
        const stat = this.actor.system.stats[skill.system.stat].value;

        let totalMod = level + stat;

        const encodedValue = [groupData.id, id].join(this.delimiter);
        const info1 = { text: skill.system.stat.toUpperCase() };
        const info2 = { text: totalMod.toString() };
        const system = 'system';
        // const tooltip = skill.system?.description?.value ? skill.system.description.value : game.i18n.localize(`CPR.global.skill.${camelSkill}ToolTip`);

        return {
          encodedValue,
          id,
          info1,
          info2,
          name: this.getFavoritedName(i18nName, skill.system.favorite),
          system,
        };
      });

      this.addActions(actions, groupData);
    }

    // vehicle
    async #buildVehicleItemActions() {
      const vehicles = this.sortedItemTypes.vehicle;
      const groupData = { id: GROUP.vehicle.id, type: 'system' };

      const actions = vehicles.map((vehicle) => {
        const { id, img, name } = vehicle;
        const encodedValue = [groupData.id, id].join(this.delimiter);
        const info1 = undefined;
        const system = 'system';
        const tooltip = vehicle.system.description.value;

        return {
          encodedValue,
          id,
          img,
          info1,
          name: this.getFavoritedName(name, vehicle.system.favorite),
          system,
          tooltip,
        };
      });

      this.addActions(actions, groupData);
    }

    // weapon
    async #buildWeaponAttackActions() {
      // Core weapon items & cyberware
      const weapons = [
        ...this.sortedItemTypes.weapon,
        ...this.sortedItemTypes.cyberware,
      ];

      //  Is ATTACHED to a weapon, like an extended magazine, will be listed as part of the weapon it is attached to.
      // #40
      // const weaponAttachment = undefined;

      for (const weapon of weapons) {
        const itemId = weapon.id;
        const { type } = weapon;
        const { isUpgraded, isWeapon } = weapon.system;

        if (isUpgraded) {
          weapon.getInstalledItems().filter(upgrade => upgrade.type === 'itemUpgrade').forEach((upgrade) => {
            if (upgrade.system.modifiers.secondaryWeapon.configured) {
              const upgradeWeapon = this.sortedItemTypes.itemUpgrade.find(
                (t) => t.id === upgrade._id
              );
              weapons.push(upgradeWeapon);
            }
          });
        }

        const isAimed =
          foundry.utils.getProperty(
            this.actor,
            `flags.${game.system.id}.firetype-${itemId}`
          ) === WEAPON_ACTION_TYPES.TOGGLE_AIMED;
        const isAutofire =
          foundry.utils.getProperty(
            this.actor,
            `flags.${game.system.id}.firetype-${itemId}`
          ) === WEAPON_ACTION_TYPES.TOGGLE_AUTOFIRE;
        const isSuppressive =
          foundry.utils.getProperty(
            this.actor,
            `flags.${game.system.id}.firetype-${itemId}`
          ) === WEAPON_ACTION_TYPES.SUPPRESSIVE_FIRE;

        if (type === 'cyberware' && !isWeapon) continue;

        const name = this.getFavoritedName(
          weapon.name,
          weapon.system.favorite,
          weapon.system.isUpgraded
        );

        const group = {
          id: itemId,
          name,
          nestId: `weapon_${weapon.id}`,
          settings: {
            image: coreModule.api.Utils.getImage(weapon),
            showTitle: false,
          },
          type: 'system',
        };
        const actions = [];

        if (isWeapon || type === 'weapon' || type === 'itemUpgrade') {
          this.addGroup(group, { id: 'combat', type: 'system' });

          const handsReq = weapon.system.handsReq
            ? `Hands: ${weapon.system.handsReq}`
            : undefined;

          let equipStatus = weapon.system.equipped;
          if (type === 'itemUpgrade') {
            const { installedIn } = weapon.system;
            const baseWeapon = weapons.find((w) => w._id === installedIn[0]);
            equipStatus = baseWeapon.system.equipped;
          }

          actions.push(
            // Base Weapon info
            {
              cssClass:
                'toggle' + (equipStatus === 'equipped' ? ' active' : ''),
              encodedValue: [WEAPON_ACTION_TYPES.CYCLE_EQUIPPED, itemId].join(
                this.delimiter
              ),
              id: WEAPON_ACTION_TYPES.CYCLE_EQUIPPED,
              // img: coreModule.api.Utils.getImage(weapon),
              info1: { text: equipStatus },
              info2: {
                text: `ROF: ${
                  !isAimed && !isAutofire && !isSuppressive
                    ? weapon.system.rof
                    : '1'
                }`,
              },
              info3: { text: handsReq },
              name,
              tooltip: weapon.system.description.value,
            }
          );

          if (type === 'cyberware' || equipStatus === 'equipped') {
            actions.push(
              ...[
                // Aimed Shot:
                {
                  cssClass: 'toggle' + (isAimed ? ' active' : ''),
                  encodedValue: [WEAPON_ACTION_TYPES.TOGGLE_AIMED, itemId].join(
                    this.delimiter
                  ),
                  id: WEAPON_ACTION_TYPES.TOGGLE_AIMED,
                  img: Utils.getWeaponActionIcon(
                    WEAPON_ACTION_TYPES.TOGGLE_AIMED
                  ),
                  info1: { text: 'Fire Mode' },
                  info2: { text: isAimed ? ' active' : undefined },
                  // info2: { text: 'info2' },
                  // info3: { text: 'info3' },
                  name: 'Aimed Shot',
                },
              ]
            );

            if (weapon.system.isRanged) {
              const installedAmmo = weapon.getInstalledItems().find(upgrade => upgrade.type === 'ammo');
              // Autofire: weapon.system.fireModes.autoFire > 0
              if (weapon.system.fireModes.autoFire > 0) {
                actions.push({
                  cssClass: 'toggle' + (isAutofire ? ' active' : ''),
                  encodedValue: [
                    WEAPON_ACTION_TYPES.TOGGLE_AUTOFIRE,
                    itemId,
                  ].join(this.delimiter),
                  id: WEAPON_ACTION_TYPES.TOGGLE_AUTOFIRE,
                  img: Utils.getWeaponActionIcon(
                    WEAPON_ACTION_TYPES.TOGGLE_AUTOFIRE
                  ),
                  info1: { text: 'Fire Mode' },
                  info2: { text: `x${weapon.system.fireModes.autoFire}` },
                  info3: { text: isAutofire ? ' active' : undefined },
                  name: 'Autofire',
                });
              }

              // Suppressive Fire: weapon.system.fireModes.suppressiveFire
              if (weapon.system.fireModes.suppressiveFire === true) {
                actions.push({
                  cssClass: 'toggle' + (isSuppressive ? ' active' : ''),
                  encodedValue: [
                    WEAPON_ACTION_TYPES.SUPPRESSIVE_FIRE,
                    itemId,
                  ].join(this.delimiter),
                  id: WEAPON_ACTION_TYPES.SUPPRESSIVE_FIRE,
                  img: Utils.getWeaponActionIcon(
                    WEAPON_ACTION_TYPES.SUPPRESSIVE_FIRE
                  ),
                  info1: { text: 'Fire Mode' },
                  info2: { text: isSuppressive ? ' active' : undefined },
                  name: 'Suppressive Fire',
                });
              }

              actions.push(
                ...[
                  // Measure DV:
                  {
                    cssClass:
                      'toggle' +
                      (Utils.highlightDVRuler(weapon, this.token)
                        ? ' active'
                        : ''),
                    encodedValue: [WEAPON_ACTION_TYPES.MEASURE_DV, itemId].join(
                      this.delimiter
                    ),
                    id: WEAPON_ACTION_TYPES.MEASURE_DV,
                    img: Utils.getWeaponActionIcon(
                      WEAPON_ACTION_TYPES.MEASURE_DV
                    ),
                    name: 'Measure DV',
                  },
                  // Change Ammo:
                  {
                    encodedValue: [
                      WEAPON_ACTION_TYPES.CHANGE_AMMO,
                      itemId,
                    ].join(this.delimiter),
                    id: WEAPON_ACTION_TYPES.CHANGE_AMMO,
                    img: Utils.getWeaponActionIcon(
                      WEAPON_ACTION_TYPES.CHANGE_AMMO
                    ),
                    name: 'Change Ammo',
                  },
                  // Reload:
                  {
                    encodedValue: [WEAPON_ACTION_TYPES.RELOAD, itemId].join(
                      this.delimiter
                    ),
                    img: Utils.getWeaponActionIcon(WEAPON_ACTION_TYPES.RELOAD),
                    id: WEAPON_ACTION_TYPES.RELOAD,
                    info1: {
                      text: weapon.system.magazine.value
                        ? `${installedAmmo.name}`
                        : 'unloaded',
                    },
                    info2: {
                      text: `${weapon.system.magazine.value}/${weapon.system.magazine.max}`,
                    },
                    name: 'Reload',
                  },
                ]
              );
            }

            if (
              !weapon.system.isRanged ||
              (weapon.system.isRanged && weapon.system.magazine.value)
            ) {
              const skillItem = this.sortedItemTypes.skill.find(
                (skill) => skill.name === weapon.system.weaponSkill
              );
              const skillMod = skillItem.system?.level ?? 0;
              const statMod =
                this.actor.system.stats[skillItem.system.stat].value ?? 0;
              const attackMod = weapon.system.attackMod ?? 0;
              const totalMod =
                skillMod + statMod + attackMod - (isAimed ? 8 : 0);

              actions.push(
                // Roll Attack
                {
                  encodedValue: [WEAPON_ACTION_TYPES.ROLL_ATTACK, itemId].join(
                    this.delimiter
                  ),
                  info1: { text: String(totalMod) },
                  img: Utils.getWeaponActionIcon(
                    WEAPON_ACTION_TYPES.ROLL_ATTACK
                  ),
                  id: WEAPON_ACTION_TYPES.ROLL_ATTACK,
                  name: 'Roll Attack',
                }
              );

              if (!isSuppressive) {
                actions.push(
                  // Roll Damage
                  {
                    encodedValue: [
                      WEAPON_ACTION_TYPES.ROLL_DAMAGE,
                      itemId,
                    ].join(this.delimiter),
                    img: Utils.getWeaponActionIcon(
                      WEAPON_ACTION_TYPES.ROLL_DAMAGE
                    ),
                    id: WEAPON_ACTION_TYPES.ROLL_DAMAGE,
                    info2: {
                      text: isAutofire ? '2d6' : weapon.system.damage,
                    },
                    name: 'Roll Damage',
                  }
                );
              }
            }
          }

          this.addActions(actions, { id: group.id, type: 'system' });
        }
      }
    }

    async #buildWeaponItemActions() {
      const weapons = this.sortedItemTypes.weapon;
      const groupData = { id: GROUP.weapon.id, type: 'system' };

      const actions = weapons.map((weapon) => {
        const { id, img, name } = weapon;
        const encodedValue = [groupData.id, id].join(this.delimiter);
        const system = 'system';
        const tooltip = weapon.system.description.value;

        return {
          id,
          name: this.getFavoritedName(
            name,
            weapon.system.favorite,
            weapon.system.isUpgraded
          ),
          encodedValue,
          img,
          system,
          tooltip,
        };
      });

      this.addActions(actions, groupData);
    }
  };
});
