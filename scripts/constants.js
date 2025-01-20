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
  skill: 'tokenActionHud.template.skill',
  attack: 'tokenActionHud.template.attack',
  stat: 'tokenActionHud.template.stat',
  // utility: 'tokenActionHud.utility',
};

/**
 * Groups
 */
export const GROUP = {
  // character: { id: 'character', name: 'tokenActionHud.template.character', type: 'system' ...collapsedByDefaul, },
  character: { id: 'character', name: 'tokenActionHud.template.character', type: 'system' },
  stat: { id: 'stat', name: 'tokenActionHud.template.stat', type: 'system' },
  skill: { id: 'skill', name: 'tokenActionHud.template.skill', type: 'system' },
  role: { id: 'role', name: 'tokenActionHud.template.role', type: 'system' },
  gear: { id: 'gear', name: 'tokenActionHud.template.gear', type: 'system' },
  cyber: { id: 'cyber', name: 'tokenActionHud.template.cyber', type: 'system' },
  effects: { id: 'effects', name: 'tokenActionHud.template.effects', type: 'system' },
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
  STAT: "stat",
  SKILL: "skill",
  WEAPON: "weapon",
};

export const ROLL_TYPES = {
  BASE: "base",
  STAT: "stat",
  SKILL: "skill",
  HUMANITY: "humanity",
  ROLEABILITY: "roleAbility",
  ATTACK: "attack",
  AIMED: "aimed",
  AUTOFIRE: "autofire",
  SUPPRESSIVE: "suppressive",
  DAMAGE: "damage",
  DEATHSAVE: "deathsave",
  INTERFACEABILITY: "interfaceAbility",
  CYBERDECKPROGRAM: "cyberdeckProgram",
  FACEDOWN: "facedown",
};
