import { MODULE } from './constants.js';

/**
 * Register module settings
 * Called by Token Action HUD Core to register Token Action HUD system module settings
 * @param {function} coreUpdate Token Action HUD Core update function
 */
export function register(coreUpdate) {
  // game.settings.register(MODULE.ID, 'displayUnequipped', {
  //   name: game.i18n.localize(
  //     'tokenActionHud.template.settings.displayUnequipped.name'
  //   ),
  //   hint: game.i18n.localize(
  //     'tokenActionHud.template.settings.displayUnequipped.hint'
  //   ),
  //   scope: 'client',
  //   config: true,
  //   type: Boolean,
  //   default: true,
  //   onChange: (value) => {
  //     coreUpdate(value);
  //   },
  // });

  game.settings.register(MODULE.ID, 'displayMookSkillWithZeroMod', {
    name: game.i18n.localize(
      'tokenActionHud.template.settings.displayMookSkillWithZeroMod.name'
    ),
    scope: 'client',
    config: true,
    type: Boolean,
    default: true,
    onChange: (value) => {
      coreUpdate(value);
    },
  });

  game.settings.register(MODULE.ID, 'displayCharacterSkillWithZeroMod', {
    name: game.i18n.localize(
      'tokenActionHud.template.settings.displayCharacterSkillWithZeroMod.name'
    ),
    scope: 'client',
    config: true,
    type: Boolean,
    default: true,
    onChange: (value) => {
      coreUpdate(value);
    },
  });

  game.settings.register(MODULE.ID, 'equipThrownWeapon', {
    name: game.i18n.localize(
      'tokenActionHud.template.settings.equipThrownWeapon.name'
    ),
    hint: game.i18n.localize(
      'tokenActionHud.template.settings.equipThrownWeapon.hint'
    ),
    scope: 'client',
    config: true,
    type: Boolean,
    default: false,
    onChange: (value) => {
      coreUpdate(value);
    },
  });

  game.settings.register(MODULE.ID, 'equipUnarmed', {
    name: game.i18n.localize(
      'tokenActionHud.template.settings.equipUnarmed.name'
    ),
    hint: game.i18n.localize(
      'tokenActionHud.template.settings.equipUnarmed.hint'
    ),
    scope: 'client',
    config: true,
    type: Boolean,
    default: true,
    onChange: (value) => {
      coreUpdate(value);
    },
  });

}
