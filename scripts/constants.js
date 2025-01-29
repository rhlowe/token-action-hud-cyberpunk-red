/**
 * Module-based constants
 */
export const MODULE = {
  ID: 'token-action-hud-cyberpunk-red',
};

/**
 * Core module
 */
export const CORE_MODULE = {
  ID: 'token-action-hud-core',
};

/**
 * Core module version required by the system module
 */
export const REQUIRED_CORE_MODULE_VERSION = '1.5';

/**
 * Action types
 */
export const ACTION_TYPE = {
  // item: 'tokenActionHud.template.item',
  interface: 'tokenActionHud.template.interface',
  skill: 'tokenActionHud.template.skill',
  attack: 'tokenActionHud.template.attack',
  stat: 'tokenActionHud.template.stat',
  utility: 'tokenActionHud.utility',
};

/**
 * Groups
 */
export const GROUP = {
  // character: { id: 'character', name: 'tokenActionHud.template.character', type: 'system' ...collapsedByDefault, },
  cyberdeck: { id: 'cyberdeck', name: 'tokenActionHud.template.cyberdeck', type: 'system' },
  cyberware: { id: 'cyberware', name: 'tokenActionHud.template.cyberware', type: 'system' },
  deathsave: { id: 'deathsave', name: 'tokenActionHud.template.deathsave', type: 'system' },
  effects: { id: 'effects', name: 'tokenActionHud.template.effects', type: 'system' },
  facedown: { id: 'facedown', name: 'tokenActionHud.template.facedown', type: 'system' },
  gear: { id: 'gear', name: 'tokenActionHud.template.gear', type: 'system' },
  interface: { id: 'interface', name: 'tokenActionHud.template.interface', type: 'system' },
  program: { id: 'program', name: 'tokenActionHud.template.programs', type: 'system' },
  role: { id: 'role', name: 'tokenActionHud.template.role', type: 'system' },
  skill: { id: 'skill', name: 'tokenActionHud.template.skill', type: 'system' },
  stat: { id: 'stat', name: 'tokenActionHud.template.stat', type: 'system' },
  utility: { id: 'utility', name: 'tokenActionHud.template.utility', type: 'system' },
  weapon: { id: 'weapon', name: 'tokenActionHud.template.weapon', type: 'system' },
};

/**
 * Item types
 */
export const SYSTEM_ITEM_TYPE = {
  activeEffects: { groupId: 'activeEffects'},
  ammo: { groupId: 'ammo'},
  armor: { groupId: 'armor'},
  clothing: { groupId: 'clothing'},
  criticalInjury: { groupId: 'criticalInjury'},
  cyberdeck: { groupId: 'cyberdeck'},
  cyberware: { groupId: 'cyberware'},
  drug: { groupId: 'drug'},
  gear: { groupId: 'gear'},
  interface: { groupId: 'interface'},
  upgrade: { groupId: 'upgrade'},
  netArchitecture: { groupId: 'netArchitecture'},
  program: { groupId: 'program'},
  role: { groupId: 'role'},
  skill: { groupId: 'skill'},
  vehicle: { groupId: 'vehicle'},
  weapon: { groupId: 'weapon'},
};

/**
 * RED Core Actor types
 */
export const ACTOR_TYPES = [
  'blackIce',
  'character',
  'demon',
  'mook',
];

export const ITEM_TYPES = {
  CYBERWARE: "cyberware",
  SKILL: "skill",
  STAT: "stat",
  WEAPON: "weapon",
};

export const ROLL_TYPES = {
  AIMED: "aimed",
  ATTACK: "attack",
  AUTOFIRE: "autofire",
  BASE: "base",
  CYBERDECKPROGRAM: "cyberdeckProgram",
  DAMAGE: "damage",
  DEATHSAVE: "deathsave",
  FACEDOWN: "facedown",
  HUMANITY: "humanity",
  INTERFACEABILITY: "interface",
  NET: "net",
  ROLEABILITY: "roleAbility",
  SKILL: "skill",
  STAT: "stat",
  SUPPRESSIVE: "suppressive",
};

export const WEAPON_ACTION_TYPES = {
  CYCLE_EQUIPPED: 'cycle_equipped',

  // data-action
  MEASURE_DV: 'measure-dv',
  CHANGE_AMMO: 'select-ammo',
  RELOAD: 'reload-ammo',

  // data-fire-mode
  SUPPRESSIVE_FIRE: 'suppressive',
  TOGGLE_AIMED: 'aimed',
  TOGGLE_AUTOFIRE: 'autofire',

  // data-roll-type
  ROLL_ATTACK: 'attack',
  ROLL_DAMAGE: 'damage',
};