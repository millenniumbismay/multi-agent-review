# Adversarial Review — Plugin Guidelines

## Structure

This plugin provides a single skill (`adversarial-review`) with four prompt templates:

- `skills/adversarial-review/SKILL.md` — Orchestrator
- `skills/adversarial-review/critic-prompt.md` — Critic agent
- `skills/adversarial-review/tester-prompt.md` — Tester agent
- `skills/adversarial-review/advocate-prompt.md` — Advocate agent
- `skills/adversarial-review/judge-prompt.md` — Judge agent

## Modifying Prompts

Each agent prompt is independently tunable. When modifying a prompt:

- Test against a real codebase with known issues to verify the agent catches what it should
- Do not weaken the adversarial nature of Critic or Tester prompts
- Do not let the Advocate fabricate justifications — honesty is core to the design
- The Judge must remain neutral — never bias toward any agent

## Key Design Decisions

- The Judge runs as a subagent for classification only. Interactive dispute resolution happens in the main conversation because subagents cannot interact with the user
- The Tester writes real tests in `tests/adversarial/` — this is intentional, not a side effect
- The `docs/reviews/` output directory is gitignored — review reports are local artifacts, not committed
