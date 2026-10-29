<div align="center">
  <h1>skills</h1>

  <p>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT license"></a>
  </p>
</div>

Geoff's agent skills, in one repo.

The repo holds Geoff's user-level skills, the skills his agents' playbooks call, and the shared skills that repo-sync in [zgeoff/tools](https://github.com/zgeoff/tools) delivers to his other repos. Each skill is a folder with a `SKILL.md` that Claude Code, Codex, and the other agents the [skills CLI](https://github.com/vercel-labs/skills) supports can load.

## Quick start

Install the skills into the current project, and pick the ones you want:

```bash
npx skills add zgeoff/skills
```

Add `-g` to install them for your user instead of one project.

## Layout

```text
skills/<name>/   one skill per folder: SKILL.md, plus any references/ and scripts/ it uses
```
