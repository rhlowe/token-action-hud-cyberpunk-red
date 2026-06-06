# Contributing

## Commit messages

This repository uses [Conventional Commits](https://www.conventionalcommits.org/). Every commit message must follow the format:

```
<type>[optional scope]: <description>
```

### Types

| Type | When to use |
|---|---|
| `feat` | New feature (triggers a **minor** version bump on release) |
| `fix` | Bug fix (triggers a **patch** version bump on release) |
| `chore` | Build process, tooling, or dependency updates |
| `docs` | Documentation changes only |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `style` | Formatting, whitespace, etc. — no logic change |
| `test` | Adding or updating tests |

### Breaking changes

Add `BREAKING CHANGE:` in the commit footer to trigger a **major** version bump:

```
feat: redesign action handler API

BREAKING CHANGE: ActionHandler.buildSystemActions signature changed
```

### Examples

```
feat: add suppressive fire action to ranged weapons
fix: correct stat lookup for empathy-based skills
chore: upgrade husky to v9
docs: document roll-handler dispatch flow
```

### Enforcement

A [commitlint](https://commitlint.js.org/) hook runs on every commit via [husky](https://typicode.github.io/husky/). Non-conforming messages are rejected at commit time.
