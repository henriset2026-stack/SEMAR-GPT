---
name: learn
description: "Turn a successful workflow, a described process, or an explicit /learn request into a reusable SEMAR-GPT skill. Use when the user asks to capture, distill, or repeat a process, or invokes /learn."
metadata:
  source: cindy
  adapted-from: learn
  short-description: Distill a reusable skill from a workflow
disable-model-invocation: true
---

# Learn

Capture a reusable procedure from the current conversation or from a workflow the user describes. The output is a reviewed `SKILL.md` draft, not a silent background write.

## When this runs

- The user invokes `/learn`, optionally followed by a description or a reference to an earlier workflow.
- The user says "learn this", "turn this into a skill", "save this workflow", or equivalent.
- The user asks to make an existing skill reusable outside the current conversation.

Do not use this skill to create a plugin. Use `plugin-creator` for Agent Plugin packaging.

## Workflow

1. **Identify the source.** If text follows `/learn`, treat it as the source. Otherwise use the current conversation. If the user points at an earlier task, read that task's messages and artifacts. Do not mix in unrelated conversations.
2. **Extract the reusable core.** Write down:
   - the trigger: what request or situation should activate the skill;
   - the inputs the agent needs and how to obtain them;
   - the ordered steps that actually produced the result;
   - the decisions and branches, including what to do when a tool or value is missing;
   - the tools and permissions the workflow used;
   - the failure modes and refusals;
   - the acceptance checks that show the result is complete.
3. **Remove the session.** Delete names, accounts, URLs, credentials, customer data, one-off file paths, timestamps, and facts that only applied to this run. Replace them with placeholders or configuration references. If a detail is essential and cannot be generalized, mark it as a parameter.
4. **Mark uncertainty.** If a step was assumed rather than verified, say so in the draft. Do not present a single success as a proven procedure. Note any tool that was unavailable or any check that was not run.
5. **Draft the skill.** Follow `skill-creator` for the frontmatter, naming rules, body style, supporting files, and validation. Prefer a short body plus a `references/` file over a long inline procedure. Add `disable-model-invocation: true` when the workflow should only run on explicit request.
6. **Validate and test.** Run `node scripts/check-skills.mjs` if the draft is written to `skill/` or `plugin/`. Test the draft against a realistic request that is different from the original example. Check the success path, the missing-input path, and the unavailable-tool path.
7. **Present the draft for review.** Show the proposed name, description, trigger, steps, files, and any assumptions. Ask for corrections before saving.
8. **Save only with consent.** State which mechanism is being used:
   - **User skill:** the user saves it from the Skills page, or an available skill-authoring tool writes it. A saved user skill is stored in MongoDB and can be shared.
   - **Deployment skill:** an operator adds `skill/<name>/SKILL.md` and restarts the API. It is read-only and available to everyone with Skills enabled.
   - **Agent Plugin skill:** an operator adds it under `plugin/<plugin>/skills/<name>/` and restarts. Use this only when the skill ships with MCP servers, hooks, or a related bundle.
   Never claim a skill was saved, installed, or published unless the corresponding tool actually succeeded.

## `/learn` parsing

- `/learn` with no text: use the current conversation.
- `/learn <description>`: use the description as the source.
- `/learn` followed by a reference such as "the release checklist we just ran": use that conversation segment.
- Do not invent a task ID, working directory, or output path. There is no Cindy Learn host in SEMAR-GPT; the review and save steps happen here.

## Review checklist

- The description names a concrete trigger, not just a topic.
- The body changes the agent's decisions; it is not generic advice.
- Every named tool exists in this deployment, or the skill states the fallback.
- No secrets, personal data, or one-off values remain.
- The acceptance checks are observable.
- The name is unique and follows the kebab-case contract.
- The user has approved the final draft and the save location.
