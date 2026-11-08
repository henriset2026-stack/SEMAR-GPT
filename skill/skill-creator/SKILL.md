---
name: skill-creator
description: "Create, review, or update a SEMAR-GPT skill (a SKILL.md package) for user, deployment, or Agent Plugin use. Use when the user wants to capture a workflow, improve an existing skill, or validate skill frontmatter, files, and invocation settings."
metadata:
  source: cindy
  adapted-from: cindy-skill-creator
  short-description: Create or update a SEMAR-GPT skill
---

# SEMAR-GPT Skill Creator

Build a skill that changes what the agent does, not one that restates what a capable model already knows. A skill is a folder with a `SKILL.md` entry point plus optional references, scripts, templates, and assets.

## Choose the right home

| Kind | Where it lives | Who can use it | Persistence |
| --- | --- | --- | --- |
| User skill | Skills page → New, or the Skills API | Its owner, and anyone it is shared with | Stored in MongoDB |
| Deployment skill | `skill/<name>/SKILL.md` | Every user with Skills enabled | Read-only, loaded at API startup |
| Agent Plugin skill | `plugin/<plugin>/skills/<name>/SKILL.md` | Every user with Skills enabled | Loaded with the plugin at API startup |

Use a user skill when the workflow belongs to one person or team. Use a deployment skill when the whole deployment should have it. Use an Agent Plugin when the skill ships with MCP servers, hooks, or a group of related skills. Do not duplicate the same skill in more than one place: names must be unique across deployment skills and all plugins.

## Workflow

1. **Clarify the trigger and the outcome.** Ask only for information that changes the skill: when should the agent use it, what must the result contain, which tools are actually available, and what must the agent refuse to do. If the user is describing a workflow that already worked, ask for the successful example rather than inventing one.
2. **Inspect what exists.** Search the Skills page and the `skill/` and `plugin/*/skills/` directories for overlapping skills. Prefer improving an existing skill over creating a near-duplicate. Check that the name is free.
3. **Draft the frontmatter and body.** Start from the smallest procedure that produces the outcome. Add a decision table or example only when it removes ambiguity. Do not add generic advice, motivational language, or speculative edge cases.
4. **Add supporting files only when they carry non-obvious detail.** Use `references/` for long contracts and background, `scripts/` for deterministic checks, `templates/` for output shapes, and `assets/` for images. Link them with relative paths from `SKILL.md`.
5. **Validate.** Run `node scripts/check-skills.mjs` for deployment and plugin skills. The Skills form validates user skills on save. Fix errors; review warnings.
6. **Test with a realistic request.** Invoke the skill explicitly and through a natural request that should trigger it. Check the success path, the missing-input path, the unavailable-tool path, and the refusal path. If the skill names a tool, verify the tool exists in this deployment; otherwise state the fallback.
7. **Save and document.** For a deployment skill, add the folder and restart the API. For an Agent Plugin, add it under `plugin/` and restart. For a user skill, save it in the Skills UI. Record the trigger and any required configuration in the skill itself, not only in a separate note.

## Frontmatter contract

```yaml
---
name: example-skill
description: "What the skill does and when to use it. Include a concrete trigger."
metadata:
  source: team
  short-description: One-line label
---
```

| Key | Required | Rules |
| --- | --- | --- |
| `name` | Yes | Kebab-case, 1–64 characters, starts with a lowercase letter or digit, then lowercase letters, digits, and hyphens. Must not start with `anthropic-` or `claude-`. Reserved words: `help`, `clear`, `compact`, `model`, `exit`, `quit`, `settings`, `anthropic`, `claude`. |
| `description` | Yes | At most 1,024 characters. Say what the skill does **and when to use it**. The loader warns below 20 characters because short descriptions undertrigger. |
| `always-apply` | No | Boolean. Injects the body into every run. Use only for a small, universally relevant rule; a large always-applied skill wastes context. |
| `user-invocable` | No | Boolean. Set `false` to hide the skill from explicit invocation. |
| `disable-model-invocation` | No | Boolean. Set `true` for a workflow the model must not select on its own; the user must invoke it. |
| `allowed-tools` | No | A tool key or list of tool keys, such as `web_search`, `file_search`, `execute_code`, or an MCP server name. Only list tools that are configured; do not use it to promise a capability. |
| `metadata` | No | Free-form provenance and labels. It does not change runtime behavior. Keep secrets out. |

Other accepted keys include `when-to-use`, `arguments`, `argument-hint`, `model`, `effort`, `context`, `agent`, `paths`, `shell`, `hooks`, `version`, `license`, `compatibility`, and `references`. Unknown keys are kept but produce a warning, so do not rely on them.

## Writing the body

- Open with the outcome and the first action. Do not repeat the description.
- Write imperative steps in the order a competent operator would follow them.
- Make decision points explicit: "If X, do Y; otherwise do Z." State what to do when a tool is missing, a value is unknown, or a request is out of scope.
- Separate facts, inferences, and unknowns when the workflow produces a report. Never invent a value to fill a gap.
- Name the tools the workflow actually uses. If a step depends on a tool that may not be configured, say how to proceed without it and never claim it ran.
- Keep secrets, credentials, personal data, and one-off URLs out of the skill. Refer to environment variables or the user's own configuration instead.
- Use relative links such as `[contract](references/contract.md)`. The loader registers every file under the skill folder except `SKILL.md`.
- Keep the body under 100,000 characters. If it grows beyond that, move detail into `references/` and link it.

## Supporting files

```text
skill/example-skill/
  SKILL.md
  references/
    contract.md
  scripts/
    check.py
  templates/
    output.md
  assets/
    diagram.png
```

- No symlinks. Paths must be relative, use only letters, digits, `.`, `_`, `-`, and `/`, and stay inside the skill folder.
- Scripts are **not** executed automatically. State the interpreter, inputs, outputs, exit codes, and whether the script writes files or uses the network. Prefer Python 3.10+ standard library for portability.
- Templates should be small enough to read. If a template is an example, say which parts are placeholders.
- Assets are for human-facing material. Do not rely on an image to carry instructions the model must follow.

## Validation

Run from the repository root:

```bash
node scripts/check-skills.mjs
```

Inside the API container, where the deployment root is `/app`:

```bash
docker exec semar-gpt-api node /app/scripts/check-skills.mjs --root /app
```

The check covers name format and reserved names, description length, body size, boolean frontmatter, duplicate names across deployment skills and plugins, plugin manifests, `mcp.json` shape, symlinks, path traversal, and referenced files that do not exist. A clean check is necessary, not sufficient: load the deployment and test the skill with a real request.

## Common mistakes

- **A description that says what the skill is but not when to use it.** The catalog selects on the description; include the trigger.
- **A skill that repeats generic good practice.** Remove anything a capable model already does by default.
- **A tool promise the deployment cannot keep.** If web search, code execution, or an MCP server is not configured, the skill must say so and offer a fallback.
- **A hidden dependency on the author's machine.** Replace absolute paths, personal accounts, and local-only commands with configuration the deployment actually has.
- **An always-applied skill that is long.** It consumes context on every run. Prefer model-invoked or explicit invocation.
- **A duplicate name.** Deployment skills and plugin skills share one namespace; a collision is skipped or rejected.

## Attribution

This skill is adapted from Cindy's `cindy-skill-creator`, which in turn adapts OpenAI Codex's skill-creator sample. The upstream Apache-2.0 notice is preserved in `license.txt`.
