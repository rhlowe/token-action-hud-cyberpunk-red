import {
  ACTION_TYPE,
  GROUP,
  ROLL_TYPES,
  SYSTEM_ITEM_TYPE,
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
          name: coreModule.api.Utils.i18n(`tokenActionHud.template.blackIce`),
        });
      }
      this.addActions(actions, groupData);
    }

    /**
     * Build character actions
     * @private
     */
    #buildCharacterActions() {
      // this.#buildProgramActions();
      this.#buildCoreActions();
      this.#buildDeathSave();
      this.#buildFacedown();
      this.#buildInterfaceActions();
      this.#buildInventory();
      this.#buildStats();
      this.#buildWeaponActions();
    }

    /**
     * Build multiple token actions
     * @private
     * @returns {object}
     */
    #buildMultipleTokenActions() {}

    async #buildCoreActions() {
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
          let info1;

          if (itemData.type === 'skill') {
            const camelSkill = Utils.cprCamelCase(itemData.name);
            // console.debug('*** itemData', {camelSkill, itemData});
            const level = itemData.system.level;
            const stat = this.actor.system.stats[itemData.system.stat].value;
            let tooltipPath;
            if (!camelSkill.includes('(') && !camelSkill.includes(')')) {
              tooltipPath = `CPR.global.skill.${itemData.system.stat}ToolTip`;
            }

            // img = itemData.img;
            name = [name, `[${itemData.system.stat}]`.toUpperCase()].join(' ');
            // tooltip = itemData.system?.description?.value ? itemData.system.description.value : game.i18n.localize(tooltipPath);
            tooltip = itemData.system?.description?.value
              ? itemData.system.description.value
              : '';

            let totalMod = level + stat;
            info1 = { text: totalMod.toString() };
          }

          return {
            encodedValue,
            id,
            img,
            info1,
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
          let name = coreModule.api.Utils.i18n(
            `tokenActionHud.template.stats.${stat[0]}`
          );
          let modifier;

          switch (this.actorType) {
            case 'character':
            case 'mook':
              modifier = this.actor.system.stats[stat[0]].value ?? 0;
              const namePath = `CPR.global.stats.${stat[0]}`;
              const tooltipPath = `CPR.global.stats.${stat[0]}ToolTip`;
              name = game.i18n.localize(namePath);
              // tooltip = game.i18n.localize(tooltipPath);
              // console.debug(`*** ${stat[0]} tool`, tooltipPath, tooltip);

              break;
            case 'blackIce':
            // "CPR.global.blackIce.stats.atk": "ATK",
            case 'demon':
              modifier = this.actor.system.stats[stat[0]];
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

    async #buildWeaponActions() {
      for (const [itemId, itemData] of this.items) {
        // console.debug('*** itemData', itemData);
        const type = itemData.type;
        const { equipped, isWeapon, level } = itemData.system;

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
        // if (this.displayUnequipped === false && type === 'weapon' && equipped !== 'equipped') continue;

        const group = {
          id: itemId,
          name: itemData.name,
          nestId: `weapon_${itemData.id}`,
          type: 'system',
        };
        const actions = [];

        if (isWeapon || type === 'weapon') {
          this.addGroup(group, { id: 'weapon', type: 'system' });

          const handsReq = itemData.system.handsReq ? `Hands: ${itemData.system.handsReq}` : undefined;

          actions.push(
            // Base Weapon info
            {
              cssClass: 'toggle' + (itemData.system.equipped === 'equipped' ? ' active' : ''),
              encodedValue: [WEAPON_ACTION_TYPES.CYCLE_EQUIPPED, itemId].join(
                this.delimiter
              ),
              id: WEAPON_ACTION_TYPES.CYCLE_EQUIPPED,
              img: coreModule.api.Utils.getImage(itemData),
              info1: { text: itemData.system.equipped },
              info2: { text: `ROF: ${itemData.system.rof}` },
              info3: { text: handsReq },
              name: itemData.name,
              tooltip: itemData.system.description.value,
            }
          );

          if (type === 'cyberware' || itemData.system.equipped === 'equipped') {
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

            if (itemData.system.isRanged) {
              // Autofire: itemData.system.fireModes.autoFire > 0
              if (itemData.system.fireModes.autoFire > 0) {
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
                  info2: { text: `x${itemData.system.fireModes.autoFire}` },
                  info3: { text: isAutofire ? ' active' : undefined },
                  name: 'Autofire',
                });
              }

              // Suppressive Fire: itemData.system.fireModes.suppressiveFire
              if (itemData.system.fireModes.suppressiveFire === true) {
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
                    cssClass: 'toggle' + (Utils.highlightDVRuler(itemData, this.token) ? ' active' : ''),
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
                    info1: { text: itemData.system.magazine.value ? `${itemData.system.magazine.ammoData.name}` : 'unloaded' },
                    info2: { text: `${itemData.system.magazine.value}/${itemData.system.magazine.max}` },
                    name: 'Reload',
                  },
                ]
              );
            }

            if (!itemData.system.isRanged || (itemData.system.isRanged && itemData.system.magazine.value)) {
              const skillItem = Array.from(this.items.values()).find(skill => skill.name === itemData.system.weaponSkill);
              const skillMod = skillItem.system.level ?? 0;
              const statMod = this.actor.system.stats[skillItem.system.stat].value ?? 0;
              const attackMod = itemData.system.attackMod ?? 0;
              const totalMod = skillMod + statMod + attackMod;
              const totalModString = totalMod > 0 ? `+${String(totalMod)}` : `-${String(totalMod)}`;

              actions.push(
                ...[
                  // Roll Attack
                  {
                    encodedValue: [WEAPON_ACTION_TYPES.ROLL_ATTACK, itemId].join(
                      this.delimiter
                    ),
                    info1: { text: totalModString },
                    img: Utils.getWeaponActionIcon(
                      WEAPON_ACTION_TYPES.ROLL_ATTACK
                    ),
                    id: WEAPON_ACTION_TYPES.ROLL_ATTACK,
                    name: 'Roll Attack',
                  },
                  // Roll Damage
                  {
                    encodedValue: [WEAPON_ACTION_TYPES.ROLL_DAMAGE, itemId].join(
                      this.delimiter
                    ),
                    img: Utils.getWeaponActionIcon(
                      WEAPON_ACTION_TYPES.ROLL_DAMAGE
                    ),
                    id: WEAPON_ACTION_TYPES.ROLL_DAMAGE,
                    info2: { text: `${itemData.system.damage}` },
                    name: 'Roll Damage',
                  },
                ]
              );
            }
          }

          this.addActions(actions, { id: group.id, type: 'system' });
        }
      }
    }
  };
});
