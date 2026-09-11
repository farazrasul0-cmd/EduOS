# Versioning & Release Tagging Strategy

This document outlines the versioning scheme, tagging procedures, and release lifecycle for **EduOS**.

---

## 1. Semantic Versioning Specification (SemVer 2.0)

EduOS follows [Semantic Versioning 2.0.0](https://semver.org/):

$$\text{v}\mathbf{MAJOR}.\mathbf{MINOR}.\mathbf{PATCH}$$

| Level | When to Increment | Examples |
| :--- | :--- | :--- |
| **MAJOR** (`v1.0.0`) | Breaking changes, incompatible database schema overhauls, major architectural shifts. | Redesigning tenant authentication or altering core multi-tenant RLS schema without backward-compatible migrations. |
| **MINOR** (`v0.2.0`) | Backward-compatible new features and major module completions. | Adding bKash/Nagad payment gateway, SMS gateway dispatcher, or AI exam question generation. |
| **PATCH** (`v0.1.1`) | Backward-compatible bug fixes, security patches, minor UI corrections, and translation adjustments. | Fixing attendance duplicate detection edge cases, correcting GPA boundary calculations, or updating layout styles. |

### Pre-release Identifiers
For testing phases prior to general availability:
* **Alpha:** `v0.2.0-alpha.1` — Internal integration testing on `develop`.
* **Beta:** `v1.0.0-beta.1` — Closed pilot deployment with 1–2 partner schools.
* **Release Candidate:** `v1.0.0-rc.1` — Feature-frozen staging build undergoing final regression validation.

---

## 2. Git Tagging Conventions

All production releases must be tagged with **annotated Git tags** prefixed with lowercase `v`:

```bash
git tag -a v0.1.0 -m "Release v0.1.0 — Initial architecture and core school operations"
```

### Tag Rules:
1. **Annotated Tags Only**: Lightweight tags (`git tag <name>`) are prohibited for releases. Annotated tags store the tagger name, email, date, and release message.
2. **Immutable Releases**: Tags once pushed to the remote repository should never be deleted or moved. If a bug is found in a tagged release, cut a new patch release (`v0.1.1`).
3. **Automated Release Trigger**: Pushing a tag matching `v*.*.*` automatically triggers `.github/workflows/release.yml` to generate a GitHub Release with release notes.

---

## 3. Step-by-Step Release Procedure

When cutting a new release from `develop` to `main`:

### Step 1: Create a Release Branch
```bash
git checkout develop
git pull origin develop
git checkout -b release/v0.1.0
```

### Step 2: Bump Version & Update Changelog
1. Update `"version": "0.1.0"` in `package.json`.
2. Move items from `[Unreleased]` to `[0.1.0] - YYYY-MM-DD` in `CHANGELOG.md`.
3. Verify tests and build locally:
   ```bash
   npm test
   npm run lint
   npm run build
   ```
4. Commit the release preparation:
   ```bash
   git commit -am "chore(release): prepare v0.1.0"
   ```

### Step 3: Merge into `main` and Tag
```bash
git checkout main
git pull origin main
git merge --no-ff release/v0.1.0 -m "chore: release v0.1.0"
git tag -a v0.1.0 -m "Release v0.1.0"
```

### Step 4: Back-merge into `develop`
```bash
git checkout develop
git merge --no-ff release/v0.1.0 -m "chore: merge release v0.1.0 back to develop"
git branch -d release/v0.1.0
```

### Step 5: Push to Remote
```bash
git push origin main develop --tags
```
The tag push will automatically generate the official GitHub Release via the CI/CD pipeline.
