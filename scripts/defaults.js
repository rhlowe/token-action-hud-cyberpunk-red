import { GROUP } from './constants.js'

/**
 * Default layout and groups
 */
export let DEFAULTS = null

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
    const groups = GROUP
    Object.values(groups).forEach(group => {
        group.name = coreModule.api.Utils.i18n(group.name)
        group.listName = `Group: ${coreModule.api.Utils.i18n(group.listName ?? group.name)}`
    })
    const groupsArray = Object.values(groups)
    DEFAULTS = {
        layout: [
            {
                nestId: 'character',
                id: 'character',
                name: coreModule.api.Utils.i18n('tokenActionHud.character'),
                groups: [
                    { ...groups.character, nestId: 'character_character' }
                ]
            },
            {
                nestId: 'stats',
                id: 'stats',
                name: coreModule.api.Utils.i18n('tokenActionHud.stats'),
                groups: [
                    { ...groups.stats, nestId: 'stats_stats' }
                ]
            },
            {
                nestId: 'skills',
                id: 'skills',
                name: coreModule.api.Utils.i18n('tokenActionHud.skills'),
                groups: [
                    { ...groups.skills, nestId: 'skills_skills' }
                ]
            },
            {
                nestId: 'role',
                id: 'roley',
                name: coreModule.api.Utils.i18n('tokenActionHud.role'),
                groups: [
                    { ...groups.role, nestId: 'role_role' }
                ]
            },
            {
                nestId: 'gear',
                id: 'geary',
                name: coreModule.api.Utils.i18n('tokenActionHud.gear'),
                groups: [
                    { ...groups.gear, nestId: 'gear_gear' }
                ]
            },
            {
                nestId: 'cyber',
                id: 'cyber',
                name: coreModule.api.Utils.i18n('tokenActionHud.cyber'),
                groups: [
                    { ...groups.cyber, nestId: 'cyber_cyber' }
                ]
            },
            {
                nestId: 'effects',
                id: 'effects',
                name: coreModule.api.Utils.i18n('tokenActionHud.effects'),
                groups: [
                    { ...groups.effects, nestId: 'effects_effects' }
                ]
            },
        ],
        groups: groupsArray
    }
})
