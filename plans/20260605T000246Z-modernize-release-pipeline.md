# Modernize Release Pipeline

**Created:** 2026-06-05  
**Updated:** 2026-06-05 (revised per Gemini review)  
**Scope:** Conventional commits → automated versioning → rolldown build → CI release → FoundryVTT publish → cleanup → docs

---

## Current state (findings)

Before reading the plan, note these pre-existing conditions that affect scope:

1. **The GitHub Actions workflow is broken.** `.github/workflows/foundry_release.yml` triggers on changes to `version.txt`, but that file does not exist in the repo. The workflow has never fired.
2. **The bundle is not used.** `module.json` declares `"esmodules": ["scripts/init.js"]`, meaning Foundry loads the unbuilt source. The built `token-action-hud-template.min.js` from rollup is never referenced by the manifest. The current release ZIP is the GitHub auto-generated source archive, not a built artifact.
3. **`rhlowe/foundry-release-action@main`** is a custom action you wrote. Its internals determine whether it can be kept or replaced; treat it as a black box until Phase 5.
4. **`module_raw.json` exists** solely as a template for `shell/copyVersion.js`. Once versioning is automated, `scripts/update-module-version.js` can do a JSON read-modify-write directly on `module.json`, eliminating the template file entirely. This plan retains `module_raw.json` as the version template for now (Phase 3), but Phase 7 includes a task to evaluate collapsing it.

---

## Recommended order

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7
```

Phases 1 and 2 are independent shippable PRs. **Phases 3, 4, and 5 are tightly coupled and must ship together as a single PR** — Phase 3's `.release-it.json` calls `build:zip` (defined in Phase 4), and Phase 4's `esmodules` change is breaking until Phase 5's CI delivers the built ZIP to users. Do not merge any of phases 3–5 in isolation. Phase 6 and Phase 7 are independently shippable after Phase 5 lands.

---

## Phase 1 — Conventional Commits

**Goal:** Establish the commit message convention that feeds automated versioning later.

### Tasks

- [ ] Install and configure `commitlint`:
  ```
  npm i -D @commitlint/cli @commitlint/config-conventional
  ```
  Add `commitlint.config.js`:
  ```js
  export default { extends: ['@commitlint/config-conventional'] };
  ```
- [ ] Add `husky` to enforce at commit time:
  ```
  npm i -D husky
  npx husky init
  echo "npx --no -- commitlint --edit \$1" > .husky/commit-msg
  ```
- [ ] Add `npm run prepare` to `package.json` scripts so husky installs on `npm install` but skips silently in CI (`npm ci` runs `prepare` too):
  ```json
  "prepare": "husky || true"
  ```
  The `|| true` prevents CI from failing when `.git` is shallow-cloned or the terminal is non-interactive.
- [ ] Document the convention in `CONTRIBUTING.md` or `README.md`: `feat:` → minor bump, `fix:` → patch bump, `BREAKING CHANGE:` footer → major bump.

### Notes
- For a solo project, the husky hook is lightweight insurance. If you find it annoying, commitlint can be enforced only in CI instead (add a `commitlint` job to the workflow).
- The convention matters most for Phase 3 (release-it changelog generation). Even a single clean `feat:` commit is enough to produce a useful CHANGELOG entry.

---

## Phase 2 — Rolldown migration

**Goal:** Replace rollup + terser + multi-entry with rolldown. Independent of versioning.

### Tasks

- [ ] Install rolldown:
  ```
  npm i -D rolldown
  ```
- [ ] Remove rollup packages:
  ```
  npm uninstall rollup rollup-plugin-terser @rollup/plugin-multi-entry
  ```
- [ ] Replace `rollup.config.js` with `rolldown.config.mjs`:
  ```js
  import { defineConfig } from 'rolldown';
  import { globSync } from 'node:fs';

  const inputs = globSync(['scripts/*.js', 'scripts/*/*.js'])
    .filter(f => !f.endsWith('token-action-hud-template.min.js'));

  export default defineConfig({
    input: inputs,
    output: {
      format: 'esm',
      file: 'scripts/token-action-hud-template.min.js',
      minify: true,
    },
  });
  ```
  > `node:fs` `globSync` was added in Node 22.0.0. This project runs Node 24 locally and CI will pin Node 24 (see Phase 5). No additional `glob` package needed.
- [ ] Update `package.json` scripts:
  ```json
  "build": "rolldown -c rolldown.config.mjs",
  "dev": "rolldown -c rolldown.config.mjs --watch"
  ```
- [ ] Delete `rollup.config.js`.
- [ ] Full minification (`minify: true`) is safe. TAH Core's only `constructor.name` usage is in a `Logger.debug()` call (`roll-handler.mjs:167`) — purely logging, not a functional gate. The other hit (`settings-form.mjs:65`) uses `type.name` on built-in constructors (`Boolean`, `String`, etc.) which are globals and never mangled by any minifier.
- [ ] Do a before/after functional test in a live Foundry instance before merging.
- [ ] Add a CI smoke-test step that validates the bundle file exists and is non-empty after build, to catch silent build failures.

### Rolldown maturity risk
Rolldown v1 is relatively new. Pin it to an exact version in `package.json` (`"rolldown": "1.1.0"`, not `"^1.1.0"`) so unexpected upgrades can't break the build silently. The before/after functional test in a live Foundry instance is **required** before merging, not optional.

---

## Phase 3 — Automated versioning with release-it

**Goal:** Replace the manual `npm version` + `shell/copyVersion.js` + `commit --amend` workflow with `release-it`.

### Tasks

- [ ] Install:
  ```
  npm i -D release-it @release-it/conventional-changelog
  ```
- [ ] Create `.release-it.json`:
  ```json
  {
    "git": {
      "commitMessage": "chore: release v${version}",
      "tagName": "v${version}",
      "requireCleanWorkingDir": true,
      "push": true
    },
    "github": {
      "release": false
    },
    "npm": {
      "publish": false
    },
    "hooks": {
      "before:bump": "node scripts/update-module-version.js ${version}",
      "after:bump": "npm run build && npm run build:zip",
      "before:git:release": "git add module.json"
    },
    "plugins": {
      "@release-it/conventional-changelog": {
        "preset": {
          "name": "conventionalcommits"
        },
        "infile": "CHANGELOG.md"
      }
    }
  }
  ```
- [ ] Create `scripts/update-module-version.js` (replaces `shell/copyVersion.js`):
  ```js
  import { readFileSync, writeFileSync } from 'fs';

  const [,, version] = process.argv;
  const raw = readFileSync('module_raw.json', 'utf8');
  const output = raw.replaceAll('VERSION_TO_REPLACE', version);
  writeFileSync('module.json', output);
  console.log(`Wrote module.json with version ${version}`);
  ```
- [ ] Add a release script to `package.json`:
  ```json
  "release": "release-it"
  ```
- [ ] Remove the `postversion` and `copyVersion` scripts from `package.json`.
- [ ] Verify: `npm run release -- --dry-run` before first real release.

### Notes
- `module_raw.json` stays as the version template — `module.json` becomes a generated file committed on each release. It stays in git so the GitHub manifest URL remains resolvable between releases; add a `DO NOT EDIT — generated by release-it` comment at the top of `module.json` (or note in `module_raw.json`) so contributors don't edit it directly.
- The bundle (`scripts/token-action-hud-template.min.js`) is **not committed**. It is gitignored; CI is the sole producer. The local `after:bump` build runs for validation purposes only — the CI artifact is what users receive.
- The `--amend` hack goes away entirely. release-it creates a clean, standalone release commit.
- The existing "run `npm config set git-tag-version false` first" instruction in the README is now obsolete; remove it.
- **Phases 3, 4, and 5 ship as one PR** — do not merge this without Phase 4 and Phase 5 complete. The `build:zip` hook in `.release-it.json` requires Phase 4's script to exist.
- For non-interactive use (future CI-triggered releases): `release-it` supports `--ci` flag which skips prompts and uses `--no-increment` assumptions. Document this in `CONTRIBUTING.md`.

### Orphaned tag recovery
If `release-it` pushes a `v*` tag but subsequently fails (e.g., `build:zip` errors out), CI will fire on a broken tag. Recovery procedure:
1. Delete the remote tag: `git push origin :refs/tags/vX.Y.Z`
2. Delete the local tag: `git tag -d vX.Y.Z`
3. Fix the root cause.
4. Re-run `npm run release`.

Document this procedure in `CONTRIBUTING.md` as part of Phase 7.

---

## Phase 4 — Tarball build

**Goal:** Build a distribution ZIP containing only the files Foundry needs, and fix the "bundle is unused" issue.

> **User-facing breaking change — bump to 2.0.0.** Switching `esmodules` from `scripts/init.js` to the bundle invalidates every existing installation. The first release including these changes must be version `2.0.0`. Announce in the GitHub release notes and consider a pinned issue or Discord post before shipping.

### Tasks

- [ ] **Update `module_raw.json` to point to the bundle** (most important change in the whole plan):
  ```json
  "esmodules": ["scripts/token-action-hud-template.min.js"]
  ```
- [ ] Update the `download` URL in `module_raw.json` to point to the to-be-built ZIP:
  ```json
  "download": "https://github.com/rhlowe/token-action-hud-cyberpunk-red/releases/download/vVERSION_TO_REPLACE/token-action-hud-cyberpunk-red-vVERSION_TO_REPLACE.zip"
  ```
- [ ] Install `archiver`:
  ```
  npm i -D archiver
  ```
- [ ] Create `scripts/build-zip.js`:
  ```js
  import { createWriteStream } from 'fs';
  import { readFileSync } from 'fs';
  import archiver from 'archiver';

  const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
  const zipName = `token-action-hud-cyberpunk-red-v${version}.zip`;
  const output = createWriteStream(zipName);
  const archive = archiver('zip');

  output.on('close', () => console.log(`Created ${zipName} (${archive.pointer()} bytes)`));
  archive.pipe(output);

  // Files at ZIP root — Foundry installs into Data/modules/<module-id>/ itself.
  // Confirmed against TAH Core's own release ZIP structure.
  archive.file('module.json', { name: 'module.json' });
  archive.file('scripts/token-action-hud-template.min.js', { name: 'scripts/token-action-hud-template.min.js' });
  archive.directory('languages/', 'languages');
  archive.directory('styles/', 'styles');
  archive.directory('static/', 'static');
  archive.finalize();
  ```
- [ ] Add script to `package.json`:
  ```json
  "build:zip": "node scripts/build-zip.js"
  ```
- [ ] Add `*.zip` and `scripts/token-action-hud-template.min.js` to `.gitignore`. Remove the bundle from git tracking: `git rm --cached scripts/token-action-hud-template.min.js`.
- [ ] Add a ZIP validation step: after `build:zip`, assert that `module.json`, the bundle, `languages/`, `styles/`, and `static/` are all present inside the archive. Include a guard in `build-zip.js` that checks `static/` exists before archiving (archiver behaviour on missing directories is inconsistent). A simple Node script using `yauzl` or `unzipper` is sufficient.

### Notes
- ZIP layout confirmed against TAH Core v2.1.1: files sit at the ZIP root with no subdirectory prefix. Foundry's installer places them into `Data/modules/<module-id>/` automatically.
- **Version source consistency:** `build-zip.js` reads the version from `package.json` to name the ZIP file. `release-it` always updates `package.json` before running hooks, so `package.json` and `module.json` will always agree during a release. If they ever diverge (e.g., partial failure), the ZIP filename and the `download` URL in `module.json` will mismatch — the orphaned tag recovery procedure in Phase 3 covers this case.
- Phase 5 must upload the built ZIP before any release tag is published — do not push a `v*` tag without CI ready to deliver the artifact.

---

## Phase 5 — GitHub Actions: automated release

**Goal:** Replace the broken `foundry_release.yml` with a workflow triggered by version tags that builds, creates a GitHub release, and uploads artifacts.

### Tasks

- [ ] Replace `.github/workflows/foundry_release.yml`:
  ```yaml
  name: Release

  on:
    push:
      tags:
        - 'v*'

  permissions:
    contents: write

  jobs:
    release:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4

        - uses: actions/setup-node@v4
          with:
            node-version: '24'

        - run: npm ci

        - name: Write version into module.json
          run: |
            VERSION=${GITHUB_REF_NAME#v}
            node scripts/update-module-version.js $VERSION

        - name: Build bundle
          run: npm run build

        - name: Build ZIP
          run: npm run build:zip

        - name: Create GitHub Release
          uses: softprops/action-gh-release@v2
          with:
            files: |
              module.json
              token-action-hud-cyberpunk-red-*.zip
            generate_release_notes: true
  ```
- [ ] Remove the dependency on `rhlowe/foundry-release-action@main` from this workflow. Archive that repo after this PR merges.
- [ ] Pin `softprops/action-gh-release` to a specific commit SHA, not a mutable tag (e.g., `uses: softprops/action-gh-release@v2` → `uses: softprops/action-gh-release@<sha>`). Apply the same pinning to `actions/checkout` and `actions/setup-node`.
- [ ] Pin npm dependencies involved in the release path (`rolldown`, `archiver`, `release-it`, `@release-it/conventional-changelog`) to exact versions in `package.json` — the lockfile alone is not sufficient if contributors run `npm install` with a stale lock.
- [ ] Consider adding a GitHub tag protection rule (Settings → Tags → Protected tags → `v*`) so only maintainers can push `v*` tags. This enforces the "never push a tag by hand" convention mechanically rather than relying on documentation alone.

### End-to-end pre-merge validation
Before merging the Phase 3–5 PR to `main`, validate the full pipeline on a throwaway branch:
1. Create a `release-test` branch from `main`.
2. Run `npm run release -- --dry-run` to confirm the version bump and changelog look correct.
3. Manually push a test tag: `git tag v0.0.0-rc.1 && git push origin v0.0.0-rc.1`.
4. Confirm CI triggers, builds succeed, GitHub release is created, and the ZIP is attached.
5. Download the ZIP and install it in a local Foundry instance. Verify:
   - The module loads without console errors.
   - Token selection populates the HUD.
   - At least one roll (stat, skill, weapon attack) executes correctly and posts to chat.
   - Active effects toggle works.
6. Delete the test release, tag, and branch once confirmed.
7. Only then merge the PR and run `npm run release` for the real 2.0.0.

### Rollback procedure
If a CI release produces a corrupt or broken artifact:
1. Navigate to the GitHub release and delete it (or mark it as a pre-release to suppress auto-updates).
2. Delete the remote tag: `git push origin :refs/tags/vX.Y.Z`
3. Delete the local tag: `git tag -d vX.Y.Z`
4. Fix the root cause, then re-run `npm run release` locally.

Until Phase 6 (FoundryVTT auto-publish) lands, FoundryVTT's package listing still points to the previous manifest URL, so users are not broken by a bad release — they simply won't see the update. After Phase 6 lands, a failed publish may require manual correction via the FoundryVTT admin panel.

### Trigger validation: builds only fire on version bumps

The workflow trigger is:
```yaml
on:
  push:
    tags:
      - 'v*'
```

This is a tag-only trigger with no `branches` block. That means:

- **Regular commits to `main` do not trigger it.** Merging a PR, pushing a fix, updating docs — none of these fire the workflow.
- **The only thing that fires it is pushing a `v*` tag.** `release-it` is the sole mechanism that creates those tags (via `git.tagName: "v${version}"` in `.release-it.json`). No tag is created without a version bump.
- **Manual tag pushes would trigger it**, so the convention is: never push a `v*` tag by hand. If a release needs to be re-run, delete and re-push the tag deliberately.
- **This replaces the broken old trigger** (`paths: version.txt` on `main`), which never fired because `version.txt` does not exist.

No additional branch-protection rules or workflow conditions are needed to enforce this — the tag trigger is sufficient on its own.

### release-it ↔ CI handoff
`release-it` (run locally) handles: version bump → CHANGELOG → `module.json` → build → commit → tag → push tag. CI picks up the pushed tag, rebuilds cleanly from scratch, creates the GitHub release, and uploads artifacts. The local build is for commit purposes; CI always rebuilds so local machine state cannot taint the published artifact.

---

## Phase 6 — FoundryVTT auto-publish

**Goal:** After a GitHub release is created, notify FoundryVTT to update the package listing automatically.

### Prerequisites
- FoundryVTT API token: found at `https://foundryvtt.com/packages/token-action-hud-cyberpunk-red/edit`. **Already saved as `FOUNDRY_API_TOKEN` repository secret.**
- Auth header format: `Authorization: <token>` — plain token, no `Bearer` prefix.
- The package is registered at `https://foundryvtt.com/packages/token-action-hud-cyberpunk-red`.

### Tasks

- [ ] Store the API key as a repository secret named `FOUNDRY_API_TOKEN` (Settings → Secrets → Actions).
- [ ] Add a second job to the release workflow (depends on `release`):
  ```yaml
  notify-foundry:
    needs: release
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Notify FoundryVTT
        env:
          FOUNDRY_API_TOKEN: ${{ secrets.FOUNDRY_API_TOKEN }}
        run: |
          VERSION=${GITHUB_REF_NAME#v}
          MANIFEST_URL="https://github.com/rhlowe/token-action-hud-cyberpunk-red/releases/download/${GITHUB_REF_NAME}/module.json"
          NOTES_URL="https://github.com/rhlowe/token-action-hud-cyberpunk-red/releases/tag/${GITHUB_REF_NAME}"

          COMPAT=$(node -e "
            const m = JSON.parse(require('fs').readFileSync('module.json','utf8'));
            console.log(JSON.stringify(m.compatibility));
          ")

          curl --fail -X POST https://api.foundryvtt.com/_api/packages/release_version/ \
            -H "Content-Type: application/json" \
            -H "Authorization: $FOUNDRY_API_TOKEN" \
            -d "$(jq -n \
              --arg id "token-action-hud-cyberpunk-red" \
              --arg version "$VERSION" \
              --arg manifest "$MANIFEST_URL" \
              --arg notes "$NOTES_URL" \
              --argjson compat "$COMPAT" \
              '{id: $id, "dry-run": false, release: {version: $version, manifest: $manifest, notes: $notes, compatibility: $compat}}')"
  ```
  > **Test with `"dry-run": true`** on the first run by temporarily hardcoding it. Check the response body — the FoundryVTT API returns HTTP 200 even for errors, with an error field in the JSON body.
- [ ] Parse and assert the response body in CI. Use `jq` to check for an error key and fail the step explicitly:
  ```bash
  RESPONSE=$(curl --fail -s -X POST ... )
  echo "$RESPONSE"
  echo "$RESPONSE" | jq -e '.status == "success"' || (echo "FoundryVTT publish failed: $RESPONSE" && exit 1)
  ```
  *(Exact response schema must be confirmed from FoundryVTT docs first.)*
- [ ] Auth format confirmed: `Authorization: <token>` (no Bearer). Token sourced from `https://foundryvtt.com/packages/token-action-hud-cyberpunk-red/edit`, saved as `FOUNDRY_API_TOKEN` secret.

### Fallback if FoundryVTT API is unavailable or rejects
If the `notify-foundry` job fails, the GitHub release is already published and users can install manually. The FoundryVTT listing will simply not auto-update. Manual fallback: log into `https://foundryvtt.com/`, navigate to the package admin page, and submit the new manifest URL directly. Document this fallback in `CONTRIBUTING.md`.

---

## Phase 7 — Cleanup and documentation

**Goal:** Remove all obsolete tooling and update docs to reflect the new workflow.

### Cleanup tasks

- [ ] Remove `shell/copyVersion.js`
- [ ] Remove the `shell/` directory
- [ ] `npm uninstall shelljs`
- [ ] Remove `copyVersion` and `postversion` npm scripts
- [ ] Remove `version.txt` references from any docs (the file never existed, but the old workflow watched for it)
- [ ] `scripts/token-action-hud-template.min.js` is **not committed** (decided in Phase 4). Confirm `.gitignore` entry is in place and the file is untracked. Update `CLAUDE.md` and `CONTRIBUTING.md` to note that `npm run build` is required before local testing.
- [ ] **Evaluate collapsing `module_raw.json`**: `scripts/update-module-version.js` could instead read `module.json` directly, update only the `version`, `download`, `manifest`, and `readme` fields via JSON parse/stringify, and write it back — eliminating the template file. If this approach is cleaner, remove `module_raw.json` and update the script. If the template is kept, add a `// DO NOT EDIT — generated from module_raw.json by release-it` comment at the top of `module.json` (as a JSON-incompatible note in `module_raw.json` above the opening brace is not possible; add it to CLAUDE.md and CONTRIBUTING.md instead).
- [ ] `module.json` **stays committed** so the GitHub manifest URL remains resolvable between releases. Confirm this is explicit in `CONTRIBUTING.md`.

### Documentation tasks

- [ ] Update `CLAUDE.md`:
  - Replace versioning section: `npm run release` → `release-it` handles everything
  - Note that `module.json` is generated from `module_raw.json`; edit `module_raw.json` for manifest changes
  - Update build section to reference rolldown and `rolldown.config.mjs`
  - Add note that `esmodules` now points to the bundle
- [ ] Update `README.md`:
  - Remove old "Generating a Release" section
  - Add a one-paragraph "Releasing" section: conventional commit → `npm run release` → CI handles the rest
  - Add a brief contributing note pointing to the commit convention
- [ ] Create `CONTRIBUTING.md` with:
  - Conventional commit convention (`feat:`, `fix:`, `chore:`, `BREAKING CHANGE:`) and their semver impact
  - Node 22+ requirement (for `fs.globSync` used in the build config) — note this explicitly so contributors with older Node versions know to upgrade
  - Orphaned tag recovery procedure (from Phase 3 notes)
  - FoundryVTT manual publish fallback (from Phase 6 notes)
- [ ] `CHANGELOG.md` will be auto-created by `release-it` on first run; do not create it manually. However: existing commits do not follow conventional format, so the first generated entry will be sparse or empty. Before the 2.0.0 release, manually write an initial `CHANGELOG.md` entry summarising the changes (the pipeline migration and distribution format change), then let `release-it` append future entries automatically. Alternatively, pass `--no-increment` on the first `release-it` dry run to preview the output before committing.

---

## Resolved decisions

All open questions have been closed. Recorded here for traceability.

| Item | Decision |
|---|---|
| **Semver for Phase 3–5 release** | **Major — 2.0.0.** Distribution format change breaks all existing installs; strict semver requires a major bump. |
| **`module.json` in git** | **Keep committed.** GitHub manifest URL must remain resolvable between releases. Add `DO NOT EDIT` note in docs. |
| **Bundle in git** | **Removed.** `scripts/token-action-hud-template.min.js` gitignored; CI is sole producer. Local build runs for validation only. |
| **Rolldown multi-entry** | `globSync` from `node:fs` works on Node 24 (project's actual version). No extra package needed. |
| **`keep_classnames` / `keep_fnames`** | Full minification is safe. TAH Core's `constructor.name` usage is debug-only logging; `type.name` calls are on built-in constructors that no minifier touches. |
| **ZIP directory layout** | Files at ZIP root, no subdirectory prefix. Confirmed against TAH Core v2.1.1 release ZIP. Foundry installs into `Data/modules/<module-id>/` itself. `build-zip.js` updated accordingly. |
| **FoundryVTT API auth** | `Authorization: <token>` — plain token, no Bearer. Token from `https://foundryvtt.com/packages/token-action-hud-cyberpunk-red/edit`, already saved as `FOUNDRY_API_TOKEN` secret. |
| **`rhlowe/foundry-release-action`** | Archive after Phase 5 merges. |
| **First release-it run** | `v1.0.5` confirmed present on origin. No pre-work needed. |
| **Node version for CI** | Workflow pins `node-version: '22'`. Node 22+ documented in `CONTRIBUTING.md` (Phase 7). |
| **Phase 3–5 coupling** | Ship as a single PR. Documented in Recommended order. |
| **Breaking change signaling** | User-facing migration event in Phase 4 with version bump guidance. |
| **Rollback procedure** | Documented in Phase 5 and Phase 3. |
| **`module_raw.json` retention** | Evaluate collapse in Phase 7. |
| **Orphaned tag on partial failure** | Recovery procedure in Phase 3 notes, to be documented in `CONTRIBUTING.md`. |
| **FoundryVTT API fallback** | Manual admin panel fallback documented in Phase 6. |
| **Dependency pinning** | Release-path npm deps pinned to exact versions; GitHub Actions pinned to SHAs. |
