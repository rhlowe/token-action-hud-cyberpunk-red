import {
  ACTION_TYPE,
  GROUP,
  ROLL_TYPES,
  SYSTEM_ITEM_TYPE,
  WEAPON_ACTION_TYPES,
} from './constants.js';
import { Utils } from './utils.js';
import CPRSystemUtils from '../../../systems/cyberpunk-red-core/modules/utils/cpr-systemUtils.js';

export let ActionHandler = null;

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
  // console.debug('*** coreModule', coreModule);
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
      this.actors = !this.actor ? game.canvas.tokens.controlled : [this.actor];
      this.actorType = this.actor?.type;

      // Settings
      this.displayMookSkillWithZeroMod = Utils.getSetting(
        'displayMookSkillWithZeroMod'
      );
      this.displayCharacterSkillWithZeroMod = Utils.getSetting(
        'displayCharacterSkillWithZeroMod'
      );
      this.displayUnequipped = Utils.getSetting('displayUnequipped');

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
          // listName: stat[0],
          name: coreModule.api.Utils.i18n(`tokenActionHud.template.standard`),
        });
      }

      if (Number.isNumeric(Number.parseInt(blackIce))) {
        actions.push({
          encodedValue: [ROLL_TYPES.NET, 'blackIce'].join(this.delimiter),
          id: programUUID,
          info1: { text: blackIce },
          // listName: stat[0],
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
      await this.#buildInventory();

      // this.#buildProgramActions();
      this.#buildFVTTCoreActions();
      this.#buildDeathSave();
      this.#buildFacedown();
      this.#buildInterfaceActions();
      this.#buildStats();

      this.#buildActiveEffectsToggleActions();
      this.#buildAmmoItemActions();
      this.#buildArmorItemActions();
      this.#buildClothingItemActions();
      this.#buildConditionLabToggleActions();
      this.#buildCriticalInjuryItemActions();
      this.#buildCyberdeckItemActions();
      this.#buildCyberwareItemActions();
      this.#buildDrugItemActions();
      this.#buildGearItemActions();
      this.#buildItemUpgradeItemActions();
      this.#buildProgramItemActions();
      this.#buildRoleItemActions();
      this.#buildSkillItemActions();
      this.#buildVehicleItemActions();
      this.#buildWeaponAttackActions();
      this.#buildWeaponItemActions();
    }

    #buildActiveEffectsToggleActions() {
      const groupData = { id: GROUP.activeEffects.id, type: 'system' };

      const actions = this.actor.data.effects.map((effect) => {
        const { disabled, icon, id, name } = effect;

        const encodedValue = [groupData.id, id].join(this.delimiter);
        const cssClass = 'toggle' + (!disabled ? ' active' : '');
        const img = icon;
        const info1 = '';
        const info2 = '';
        const info3 = '';
        const selected = !disabled;
        const system = 'system';
        const tooltip = ''; // '<ul><li>foo</li><li>bars</li></ul>'?
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
      const cltActiveEffects = this.actor.data.effects
        .map((effect) => effect.flags['condition-lab-triggler']?.conditionId)
        .filter(Boolean);

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
      const actionType = 'initiative';
      const name = coreModule.api.Utils.i18n(`CPR.chat.initiative`);
      let visibiltyString = `tokenActionHud.template.visibility.${
        this.token.data.hidden ? 'makeVisible' : 'makeInvisible'
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
          encodedValue: [groupData.id, actionType].join(this.delimiter),
          id: groupData.id,
          listName: groupData.id,
          name,
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
          listName: groupData.id,
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
        // console.debug('*** itemData', itemData);
        const type = itemData.type;
        const { equipped, isWeapon, level } = itemData.system;

        if (type === 'cyberware' || type === 'weapon') continue;
        // if (type === 'cyberware' && !isWeapon) continue;
        if (
          this.displayUnequipped === false &&
          type === 'weapon' &&
          equipped !== 'equipped'
        )
          continue;
        if (
          this.actorType === 'mook' &&
          this.displayMookSkillWithZeroMod === false &&
          type === 'skill' &&
          level === 0
        )
          continue;
        if (
          this.actorType === 'character' &&
          this.displayCharacterSkillWithZeroMod === false &&
          type === 'skill' &&
          level === 0
        )
          continue;

        const typeMap = inventoryMap.get(type) ?? new Map();
        typeMap.set(itemId, itemData);
        inventoryMap.set(type, typeMap);
      }

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
          let name = itemData.name;

          const id = itemId;
          const actionTypeName = coreModule.api.Utils.i18n(
            ACTION_TYPE[actionTypeId]
          );
          const listName = `${
            actionTypeName ? `${actionTypeName}: ` : ''
          }${name}`;
          const encodedValue = [actionTypeId, id].join(this.delimiter);

          let img;
          let tooltip;

          switch (itemData.type) {
            case 'cyberware':
            case 'cyberdeck':
            case 'gear':
            case 'weapon':
              img = coreModule.api.Utils.getImage(itemData);
              tooltip = itemData.system.description.value;
              break;
            default:
              img = undefined;
              break;
          }

          return {
            encodedValue,
            id,
            img,
            listName,
            name,
            tooltip,
          };
        });

        // console.debug('*** #buildInventory', {actions, groupData});
        this.addActions(actions, groupData);
      }
    }

    async #buildInterfaceActions() {
      if (this.items.size === 0) return;

      // const activeCyberdeck = Array.from(this.items).find(([itemId, itemData]) => itemData.type === 'cyberdeck' && itemData.system.equipped === 'equipped');
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
        'backdoor',
        'cloak',
        'control',
        'eyedee',
        'pathfinder',
        'scanner',
        'slide',
        'virus',
        'zap',
      ].forEach((id) => {
        actions.push({
          encodedValue: ['interface', id].join(this.delimiter),
          id,
          // info1,
          listName: id,
          name: game.i18n.localize(
            `CPR.global.role.netrunner.interfaceAbility.${id}`
          ),
        });
      });

      this.addActions(actions, groupData);
    }

    async #buildProgramActions() {
      if (this.items.size === 0) return;

      const activeCyberdeck = Array.from(this.items).find(
        ([itemId, itemData]) =>
          itemData.type === 'cyberdeck' &&
          itemData.system.equipped === 'equipped'
      );
      const installedProgramItems = Array.from(this.items).filter(
        ([itemId, itemData]) =>
          itemData.type === 'program' &&
          itemData.system.installedIn.includes(activeCyberdeck[1].id)
      );

      // console.debug('*** buildProgramActions', {
      //   actor: this.actor,
      //   items: this.items,
      //   activeCyberdeck,
      //   installedProgramItems,
      // });

      let actionTypeId = 'program';

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
    }

    async #buildRoleActions([type, typeMap]) {
      const roleMap = new Map();

      typeMap.forEach(async (role) => {
        if (role.system.hasRoll) {
          const name = `${role.system.mainRoleAbility} [${role.name}]`;
          const encodedValue = [role.name, role.system.mainRoleAbility].join(
            this.delimiter
          );

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

              const encodedValue = [role.name, subRole.name].join(
                this.delimiter
              );

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
            listName: stat[0],
            name,
            tooltip,
          };
        });

      this.addActions(actions, groupData);
    }

    // this.actor.itemTypes

    // ammo
    async #buildAmmoItemActions() {
      const ammo = this.actor.itemTypes.ammo;
      const groupData = { id: GROUP.ammo.id, type: 'system' };

      const actions = ammo.map((ammoItem) => {
        const { id, img, name } = ammoItem;

        const encodedValue = [groupData.id, id].join(this.delimiter);
        const cssClass = undefined;
        const info1 = {
          text:
            coreModule.api.Utils.i18n(
              `tokenActionHud.template.quantityString`
            ) + ammoItem.system.amount,
        };
        const info2 = undefined;
        const info3 = undefined;
        const selected = undefined;
        const system = 'system';
        const tooltip = ammoItem.system.description.value;
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

    // armor
    async #buildArmorItemActions() {}

    // clothing
    async #buildClothingItemActions() {}

    // criticalInjury
    async #buildCriticalInjuryItemActions() {}

    // cyberdeck
    async #buildCyberdeckItemActions() {}

    // cyberware
    async #buildCyberwareItemActions() {
      /**
       * Only display all foundational, all non-weapon, and uninstalled weapon Cyberwares.
       */
      const cyberwares = this.actor.itemTypes.cyberware.filter((c) => {
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
      const drugs = this.actor.itemTypes.drug;
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
      const gears = this.actor.itemTypes.gear;
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
      const itemUpgrades = this.actor.itemTypes.itemUpgrade;
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
    async #buildProgramItemActions() {
      const programs = this.actor.itemTypes.program;
      const groupData = { id: GROUP.program.id, type: 'system' };

      const actions = programs.map((program) => {
        const { id, img, name } = program;
        const encodedValue = [groupData.id, id].join(this.delimiter);
        const cssClass = undefined;
        const info1 = undefined;
        const info2 = undefined;
        const info3 = undefined;
        const selected = undefined;
        const system = 'system';
        const tooltip = program.system.description.value;
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

    // role
    async #buildRoleItemActions() {}

    // skill
    async #buildSkillItemActions() {
      const groupData = { id: GROUP.skill.id, type: 'system' };

      const skills = this.actor.itemTypes.skill
        .filter((skill) => {
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
        })
        .sort((a, b) => (a.name > b.name ? 1 : -1));

      const actions = skills.map((skill) => {
        const { id, name } = skill;
        const level = skill.system.level;
        const stat = this.actor.system.stats[skill.system.stat].value;

        let totalMod = level + stat;

        const encodedValue = [groupData.id, id].join(this.delimiter);
        const cssClass = undefined;
        // const img = undefined;
        const info1 = { text: skill.system.stat.toUpperCase() };
        const info2 = { text: totalMod.toString() };
        const info3 = undefined;
        const selected = undefined;
        const system = 'system';
        // const tooltip = skill.system?.description?.value ? skill.system.description.value : game.i18n.localize(`CPR.global.skill.${camelSkill}ToolTip`);
        const onClick = undefined;
        const onHover = undefined;

        return {
          id,
          name,
          encodedValue,
          cssClass,
          // img,
          info1,
          info2,
          info3,
          selected,
          system,
          // tooltip,
          onClick,
          onHover,
        };
      });

      this.addActions(actions, groupData);
    }

    // vehicle
    async #buildVehicleItemActions() {
      const vehicles = this.actor.itemTypes.vehicle;
      const groupData = { id: GROUP.vehicle.id, type: 'system' };

      const actions = vehicles.map((vehicle) => {
        const { id, img, name } = vehicle;
        const encodedValue = [groupData.id, id].join(this.delimiter);
        const cssClass = undefined;
        const info1 = undefined;
        const info2 = undefined;
        const info3 = undefined;
        const selected = undefined;
        const system = 'system';
        const tooltip = vehicle.system.description.value;
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

    // weapon
    async #buildWeaponAttackActions() {
      const meleeWeaponTypes = [
        'heavyMeleeWeapon',
        'lightMeleeWeapon',
        'mediumMeleeWeapon',
        'veryHeavyMeleeWeapon',
      ];
      // Core weapon items & cyberware
      const weapons = [
        ...this.actor.itemTypes.weapon,
        ...this.actor.itemTypes.cyberware,
      ];

      //  Is ATTACHED to a weapon, like an extended magazine, will be listed as part of the weapon it is attached to.
      // #40
      // const weaponAttachment = undefined;

      for (const weapon of weapons) {
        const itemId = weapon.id;
        const { type } = weapon;

        const { isWeapon } = weapon.system;
        const { isUpgraded, upgrades } = weapon.system;

        if (isUpgraded) {
          upgrades.forEach((upgrade) => {
            if (upgrade.system.modifiers.secondaryWeapon.configured) {
              const upgradeWeapon = this.actor.itemTypes.itemUpgrade.find(
                (t) => t.id === upgrade._id
              );
              weapons.push(upgradeWeapon);
            }
          });
        }

        const isAimed =
          getProperty(
            this.actor,
            `flags.${game.system.id}.firetype-${itemId}`
          ) === WEAPON_ACTION_TYPES.TOGGLE_AIMED;
        const isAutofire =
          getProperty(
            this.actor,
            `flags.${game.system.id}.firetype-${itemId}`
          ) === WEAPON_ACTION_TYPES.TOGGLE_AUTOFIRE;
        const isSuppressive =
          getProperty(
            this.actor,
            `flags.${game.system.id}.firetype-${itemId}`
          ) === WEAPON_ACTION_TYPES.SUPPRESSIVE_FIRE;

        if (type === 'cyberware' && !isWeapon) continue;

        const name = weapon.name + (isUpgraded ? ' ⬆️' : '');

        const group = {
          id: itemId,
          name,
          nestId: `weapon_${weapon.id}`,
          type: 'system',
        };
        const actions = [];

        if (isWeapon || type === 'weapon' || type === 'itemUpgrade') {
          this.addGroup(group, { id: 'combat', type: 'system' });

          const handsReq = weapon.system.handsReq
            ? `Hands: ${weapon.system.handsReq}`
            : undefined;

          actions.push(
            // Base Weapon info
            {
              cssClass:
                'toggle' +
                (weapon.system.equipped === 'equipped' ? ' active' : ''),
              encodedValue: [WEAPON_ACTION_TYPES.CYCLE_EQUIPPED, itemId].join(
                this.delimiter
              ),
              id: WEAPON_ACTION_TYPES.CYCLE_EQUIPPED,
              img: coreModule.api.Utils.getImage(weapon),
              info1: { text: weapon.system.equipped },
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

          if (type === 'cyberware' || weapon.system.equipped === 'equipped') {
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
                        ? `${weapon.system.magazine.ammoData.name}`
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
              const skillItem = Array.from(this.items.values()).find(
                (skill) => skill.name === weapon.system.weaponSkill
              );
              const skillMod = skillItem.system.level ?? 0;
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
      const weapons = this.actor.itemTypes.weapon;
      const groupData = { id: GROUP.weapon.id, type: 'system' };

      const actions = weapons.map((weapon) => {
        const { id, img, name } = weapon;
        const encodedValue = [groupData.id, id].join(this.delimiter);
        const cssClass = undefined;
        const info1 = undefined;
        const info2 = undefined;
        const info3 = undefined;
        const selected = undefined;
        const system = 'system';
        const tooltip = weapon.system.description.value;
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
  };
});
