# Skill contract quick reference

Use this beside a draft when you need the exact limits without rereading the loader.

## Frontmatter

```yaml
---
name: example-skill
description: "What it does and when to use it. Include a concrete trigger."
always-apply: false
user-invocable: true
disable-model-invocation: false
allowed-tools:
  - web_search
metadata:
  source: team
  short-description: One-line label
---
```

## Blocking rules

| Check | Limit |
| --- | --- |
| Name | 1–64 characters; `/^[a-z0-9][a-z0-9-]*$/`; no `anthropic-` or `claude-` prefix; not `help`, `clear`, `compact`, `model`, `exit`, `quit`, `settings`, `anthropic`, or `claude` |
| Description | Required; at most 1,024 characters; shorter than 20 characters warns |
| Body | At most 100,000 characters |
| Boolean fields | `always-apply`, `user-invocable`, and `disable-model-invocation` must be real booleans |
| `allowed-tools` | A string or an array of strings |
| File path | Relative; at most 500 characters; only letters, digits, `.`, `_`, `-`, `/`; no empty, `.` or `..` segments |
| Symlinks | Not allowed anywhere in the skill folder |
| Duplicate names | Not allowed across `skill/` and every `plugin/*/skills/` |

## Review questions

- Does the description name the situation that should trigger the skill?
- Does the body change a decision, or does it restate general good practice?
- Is every named tool configured in this deployment?
- Does the skill say what to do when an input is missing or a tool is unavailable?
- Are facts, inferences, and unknowns separated where the output is a report?
- Are secrets, personal data, and one-off values absent?
- Are supporting files linked with relative paths, and do they exist?
- Was the skill tested with a realistic request and a failure path?
