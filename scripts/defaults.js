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
        name: coreModule.api.Utils.i18n('tokenActionHud.character'),
        groups: [{ ...groups.character, nestId: 'character_character' }],
      },
      {
        nestId: 'stat',
        id: 'stat',
        name: coreModule.api.Utils.i18n('tokenActionHud.stat'),
        groups: [{ ...groups.stat, nestId: 'stat_stat' }],
      },
      {
        nestId: 'skill',
        id: 'skill',
        name: coreModule.api.Utils.i18n('tokenActionHud.skill'),
        groups: [{ ...groups.skill, nestId: 'skill_skill' }],
      },
      {
        nestId: 'role',
        id: 'roley',
        name: coreModule.api.Utils.i18n('tokenActionHud.role'),
        groups: [{ ...groups.role, nestId: 'role_role' }],
      },
      {
        nestId: 'gear',
        id: 'geary',
        name: coreModule.api.Utils.i18n('tokenActionHud.gear'),
        groups: [{ ...groups.gear, nestId: 'gear_gear' }],
      },
      {
        nestId: 'cyber',
        id: 'cyber',
        name: coreModule.api.Utils.i18n('tokenActionHud.cyber'),
        groups: [{ ...groups.cyber, nestId: 'cyber_cyber' }],
      },
      {
        nestId: 'effects',
        id: 'effects',
        name: coreModule.api.Utils.i18n('tokenActionHud.effects'),
        groups: [{ ...groups.effects, nestId: 'effects_effects' }],
      },
      {
        nestId: 'utility',
        id: 'utility',
        name: coreModule.api.Utils.i18n('tokenActionHud.utility'),
        groups: [
          { ...groups.utility, nestId: 'utility_utility' }
        ]
      },
    ],
    groups: groupsArray,
  };
});
