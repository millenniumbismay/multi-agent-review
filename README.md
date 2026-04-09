# Adversarial Review

A Claude Code plugin that reviews code changes through an adversarial debate pipeline.

## How It Works

Three agents analyze your changes from opposing perspectives:

1. **Critic** — finds issues, checks upstream/downstream impact, hunts for logic gaps
2. **Tester** — writes and runs adversarial test cases to break your code
3. **Advocate** — builds the strongest honest defense of your design decisions

A **Judge** then cross-references all three perspectives, classifies findings, and you resolve any disputes interactively. The result is an actionable checklist.

## Install

```bash
claude plugin add <your-github-user>/adversarial-review
```

## Usage

```
/adversarial-review "brief description of your changes"
```

The skill auto-detects your base branch and reviews the diff. If there's no diff, it asks which files to review.

## Output

- **Terminal:** Summary table + actionable checklist
- **File:** Full report at `docs/reviews/YYYY-MM-DD-adversarial-review.md`
- **Tests:** Adversarial test cases at `tests/adversarial/`

## Agent Roles

| Agent | Perspective | Modifies Files? |
|-------|------------|-----------------|
| Critic | Skeptic — finds what's wrong | No |
| Tester | Adversarial tester — writes tests to break code | Yes (`tests/adversarial/`) |
| Advocate | Defense attorney — justifies design decisions | No |
| Judge | Neutral arbiter — classifies and synthesizes | No |

## License

MIT
