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
  item: 'tokenActionHud.template.item',
  utility: 'tokenActionHud.utility',
};

/**
 * Groups
 */
export const GROUP = {
  // character: { id: 'character', name: 'tokenActionHud.template.character', type: 'system' ...collapsedByDefaul, },
  character: { id: 'character', name: 'tokenActionHud.template.character', type: 'system' },
  stats: { id: 'stats', name: 'tokenActionHud.template.stats', type: 'system' },
  skills: { id: 'skills', name: 'tokenActionHud.template.skills', type: 'system' },
  role: { id: 'role', name: 'tokenActionHud.template.role', type: 'system' },
  gear: { id: 'gear', name: 'tokenActionHud.template.gear', type: 'system' },
  cyber: { id: 'cyber', name: 'tokenActionHud.template.cyber', type: 'system' },
  effects: { id: 'effects', name: 'tokenActionHud.template.effects', type: 'system' },
};

/**
 * Item types
 */
export const ITEM_TYPE = {
  activeEffects: { groupId: 'activeEffects'},
  ammo: { groupId: 'ammo'},
  armor: { groupId: 'armor'},
  clothing: { groupId: 'clothing'},
  criticalInjuries: { groupId: 'criticalInjuries'},
  cyberdecks: { groupId: 'cyberdecks'},
  cyberware: { groupId: 'cyberware'},
  drugs: { groupId: 'drugs'},
  gear: { groupId: 'gear'},
  upgrades: { groupId: 'upgrades'},
  netArchitecture: { groupId: 'netArchitecture'},
  programs: { groupId: 'programs'},
  roles: { groupId: 'roles'},
  skills: { groupId: 'skills'},
  vehicles: { groupId: 'vehicles'},
  weapons: { groupId: 'weapons'},
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