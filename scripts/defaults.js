import { GROUP } from './constants.js';

/**
 * Default layout and groups
 */
export let DEFAULTS = null;

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
  const groups = GROUP;
  Object.values(groups).forEach((group) => {
    group.name = coreModule.api.Utils.i18n(group.name);
    group.listName = `Group: ${coreModule.api.Utils.i18n(
      group.listName ?? group.name
    )}`;
  });
  const groupsArray = Object.values(groups);
  DEFAULTS = {
    layout: [
      {
        nestId: 'character',
        id: 'character',
        name: coreModule.api.Utils.i18n('TYPES.Actor.character'),
        groups: [
          { ...groups.stat, nestId: 'character_stat' },
          { ...groups.role, nestId: 'character_role' },
          { ...groups.facedown, nestId: 'character_facedown' },
          { ...groups.deathsave, nestId: 'character_deathsave' },
        ],
      },

      {
        nestId: 'skill',
        id: 'skill',
        name: coreModule.api.Utils.i18n('CPR.mookSheet.skills.title'),
        groups: [{ ...groups.skill, nestId: 'skill_skill' }],
      },

      {
        nestId: 'combat',
        id: 'combat',
        name: coreModule.api.Utils.i18n(
          'CPR.effectSheet.keyCategory.combat'
        ),
        groups: [
          { ...groups.combat, nestId: 'combat_combat' },
        ],
      },

      {
        nestId: 'netrunning',
        id: 'netrunning',
        name: coreModule.api.Utils.i18n('CPR.effectSheet.keyCategory.netrun'),
        groups: [
          { ...groups.interface, nestId: 'netrunning_interface' },
          // { ...groups.program, nestId: 'netrunning_program' },
        ],
      },

      {
        nestId: 'gear',
        id: 'gear',
        name: coreModule.api.Utils.i18n('CPR.global.itemTypes.gear'),
        groups: [
          // { ...groups.cyberdeck, nestId: 'gear_cyberdeck' },
          { ...groups.ammo, nestId: 'gear_ammo' },
          { ...groups.cyberware, nestId: 'gear_cyberware' },
          { ...groups.gear, nestId: 'gear_gear' },
          { ...groups.weapon, nestId: 'gear_weapon' },
        ],
      },

      {
        nestId: 'effects',
        id: 'effects',
        name: coreModule.api.Utils.i18n('tokenActionHud.template.effects'),
        groups: [
          { ...groups.activeEffects, nestId: 'effects_activeEffects' },
          { ...groups.injury, nestId: 'effects_injury' },
        ],
      },

      {
        nestId: 'utility',
        id: 'utility',
        name: coreModule.api.Utils.i18n('tokenActionHud.template.utility'),
        groups: [{ ...groups.utility, nestId: 'utility_utility' }],
      },
    ],
    groups: groupsArray,
  };
});
