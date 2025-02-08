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
  // item: 'CPR.global.generic.item',
  interface: 'CPR.global.role.netrunner.ability.interface',
  skill: 'CPR.global.generic.skill',
  attack: 'CPR.rolls.attack',
  stat: 'CPR.global.generic.stat',
  utility: 'tokenActionHud.utility',
};

/**
 * Groups
 */
export const GROUP = {
  // character: { id: 'character', name: 'TYPES.Actor.character', type: 'system' ...collapsedByDefault, },
  activeEffects: {
    id: 'activeEffects',
    name: 'tokenActionHud.template.activeEffects',
    type: 'system',
  },
  ammo: { id: 'ammo', name: 'CPR.global.itemTypes.ammo', type: 'system' },
  armor: { id: 'armor', name: 'CPR.global.itemTypes.armor', type: 'system' },
  base: { id: 'base', name: 'CPR.global.itemTypes.base', type: 'system' },
  clothing: {
    id: 'clothing',
    name: 'CPR.global.itemTypes.clothing',
    type: 'system',
  },
  combat: {
    id: 'combat',
    name: 'CPR.effectSheet.keyCategory.combat',
    type: 'system',
  },
  criticalInjury: {
    id: 'criticalInjury',
    name: 'CPR.global.itemTypes.criticalInjury',
    type: 'system',
  },
  cyberdeck: {
    id: 'cyberdeck',
    name: 'CPR.global.itemTypes.cyberdeck',
    type: 'system',
  },
  cyberware: {
    id: 'cyberware',
    name: 'CPR.global.itemTypes.cyberware',
    type: 'system',
  },
  deathsave: {
    id: 'deathsave',
    name: 'CPR.rolls.deathSave.title',
    type: 'system',
  },
  drug: { id: 'drug', name: 'CPR.global.itemTypes.drug', type: 'system' },
  facedown: {
    id: 'facedown',
    name: 'CPR.global.generic.facedown',
    type: 'system',
  },
  gear: { id: 'gear', name: 'CPR.global.itemTypes.gear', type: 'system' },
  injury: {
    id: 'injury',
    name: 'tokenActionHud.template.injury',
    type: 'system',
  },
  installed: {
    id: 'installed',
    name: "CPR.characterSheet.bottomPane.fight.installed" ,
    type: 'system',
  },
  interface: {
    id: 'interface',
    name: 'CPR.global.role.netrunner.ability.interface',
    type: 'system',
  },
  itemUpgrade: {
    id: 'itemUpgrade',
    name: 'CPR.global.itemTypes.itemUpgrade',
    type: 'system',
  },
  ledger: {
    id: 'netarch',
    name: 'tokenActionHud.template.ledgers',
    type: 'system',
  },
  netarch: {
    id: 'netarch',
    name: 'CPR.global.itemTypes.netarch',
    type: 'system',
  },
  program: {
    id: 'program',
    name: 'CPR.global.itemTypes.program',
    type: 'system',
  },
  rezzed: {
    id: 'rezzed',
    name: "CPR.characterSheet.bottomPane.fight.rezzed" ,
    type: 'system',
  },
  role: { id: 'role', name: 'CPR.global.itemTypes.role', type: 'system' },
  skill: { id: 'skill', name: 'CPR.global.itemTypes.skill', type: 'system' },
  stat: { id: 'stat', name: 'CPR.global.generic.stat', type: 'system' },
  utility: {
    id: 'utility',
    name: 'tokenActionHud.template.utility',
    type: 'system',
  },
  vehicle: {
    id: 'vehicle',
    name: 'CPR.global.itemTypes.vehicle',
    type: 'system',
  },
  weapon: { id: 'weapon', name: 'CPR.global.itemTypes.weapon', type: 'system' },
};

/**
 * Item types
 */
export const SYSTEM_ITEM_TYPE = {
  activeEffects: { groupId: 'activeEffects' },
  ammo: { groupId: 'ammo' },
  armor: { groupId: 'armor' },
  clothing: { groupId: 'clothing' },
  criticalInjury: { groupId: 'criticalInjury' },
  cyberdeck: { groupId: 'cyberdeck' },
  cyberware: { groupId: 'cyberware' },
  drug: { groupId: 'drug' },
  gear: { groupId: 'gear' },
  interface: { groupId: 'interface' },
  upgrade: { groupId: 'upgrade' },
  netArchitecture: { groupId: 'netArchitecture' },
  program: { groupId: 'program' },
  role: { groupId: 'role' },
  skill: { groupId: 'skill' },
  vehicle: { groupId: 'vehicle' },
  weapon: { groupId: 'weapon' },
};

/**
 * RED Core Actor types
 */
export const ACTOR_TYPES = ['blackIce', 'character', 'demon', 'mook'];

export const ITEM_TYPES = {
  CYBERDECK: 'cyberdeck',
  CYBERWARE: 'cyberware',
  SKILL: 'skill',
  STAT: 'stat',
  WEAPON: 'weapon',
};

export const ROLL_TYPES = {
  AIMED: 'aimed',
  ATTACK: 'attack',
  AUTOFIRE: 'autofire',
  BASE: 'base',
  CYBERDECKPROGRAM: 'cyberdeckProgram',
  DAMAGE: 'damage',
  DEATHSAVE: 'deathsave',
  FACEDOWN: 'facedown',
  HUMANITY: 'humanity',
  INTERFACEABILITY: 'interface',
  NET: 'net',
  ROLEABILITY: 'roleAbility',
  SKILL: 'skill',
  STAT: 'stat',
  SUPPRESSIVE: 'suppressive',
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
