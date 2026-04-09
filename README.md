# Multi-Agent Adversarial Review

A Claude Code plugin that reviews code changes through an adversarial debate pipeline. Three AI agents argue over your code from opposing perspectives, then a judge synthesizes their findings into an actionable checklist.

## Why Use This?

Standard code review (human or AI) gives you one perspective. This plugin gives you three competing perspectives that challenge each other:

- A **Critic** actively tries to find flaws in your code
- A **Tester** writes adversarial tests designed to break it
- An **Advocate** builds the strongest honest defense of your design choices

A **Judge** then cross-references all three, identifies where they agree and disagree, and presents you with disputed items to resolve. The result is a review that catches issues a single-pass review would miss.

### When to use it

- **Before merging a feature branch** — catch bugs and design issues before they hit main
- **After a complex refactor** — verify you haven't broken upstream/downstream dependencies
- **When you want a second opinion** — the adversarial debate surfaces issues you might be blind to
- **Before a PR review** — fix issues before your teammates see them
- **On legacy code changes** — the Tester writes edge case tests that may not exist yet

### When NOT to use it

- Trivial changes (typo fixes, config tweaks) — overkill
- Very large diffs (1000+ lines) — narrow the scope to specific files first
- No git history — the skill needs a base branch to diff against (though it can fall back to file-based review)

## Install

**Via npx (easiest):**

```bash
npx multi-agent-review
```

**Via Claude Code plugin manager:**

```bash
claude plugin add millenniumbismay/multi-agent-review
```

After installing, reload plugins:

```
/reload-plugins
```

## Usage

```
/multi-agent-review "brief description of your changes"
```

The description helps agents understand the intent behind your changes. Be specific:

```
# Good — agents understand what to look for
/multi-agent-review "Added rate limiting middleware to the /api/upload endpoint"

# Too vague — agents have less context
/multi-agent-review "some changes"
```

### What happens when you run it

1. **Context gathering** — auto-detects your base branch, collects the git diff, reads changed files
2. **Parallel analysis** — Critic, Tester, and Advocate agents run simultaneously (~30-60 seconds)
3. **Judge classification** — Judge cross-references all findings into four buckets:
   - **Confirmed Issue** — Critic found it, Tester proved it, Advocate can't defend it
   - **Resolved by Design** — Critic raised it, but Advocate's defense holds
   - **Disputed** — both sides have evidence, you decide
   - **New Finding** — Tester found something nobody else caught
4. **Interactive disputes** — for each disputed item, you see both arguments and make the call
5. **Final output** — summary table + actionable checklist in terminal, full report saved to file

### Example output

```
## Adversarial Review Summary

| Category | Count |
|----------|-------|
| Confirmed Issues | 3 (1 critical, 2 major) |
| Resolved by Design | 2 |
| Disputed → Valid | 1 |
| New Findings | 1 |
| Tests Written | 38 |
| Tests Failed | 7 |

## Action Checklist

- [ ] [CRITICAL] Shallow copy corrupts global state (utils/config.py:22)
- [ ] [MAJOR] Shallow merge destroys nested config (utils/config.py:29)
- [ ] [MAJOR] Validation function never called (utils/config.py:40)
- [ ] [NEW] No input type validation on config loader
- [x] [RESOLVED] Raw KeyError on unknown agent — intentional for internal API
```

## Output Files

| Output | Location | Committed? |
|--------|----------|------------|
| Terminal summary | Printed in conversation | N/A |
| Full report | `docs/reviews/YYYY-MM-DD-multi-agent-review.md` | No (gitignored) |
| Adversarial tests | `tests/adversarial/` | Up to you |

The full report contains every agent's complete output, the Judge's cross-reference analysis, your decisions on disputed items, and the final checklist.

## Agent Details

### Critic Agent

Analyzes code with deep skepticism. Looks for:
- Logic gaps, incorrect assumptions, off-by-one errors
- Upstream impact (does this break callers?)
- Downstream impact (does this break dependencies?)
- Missing error handling at system boundaries
- Race conditions and shared mutable state
- Security concerns (OWASP top 10)
- Performance regressions

Every issue must have concrete evidence and a plausible trigger path — no speculative "what if" concerns.

### Functional Test Agent

Writes and runs adversarial test cases in `tests/adversarial/`. Goes beyond branch coverage:
- Boundary values, empty inputs, null handling
- Unicode and encoding edge cases
- What happens when dependencies fail
- Sequence-dependent bugs
- State accumulation across calls
- Inputs the developer never imagined

Auto-detects your test framework (pytest, jest, vitest, etc.) and writes tests that match your project's conventions.

### Advocate Agent

Builds the strongest honest defense of the code. Analyzes:
- Design rationale — why this approach over alternatives
- Edge case coverage — what's handled and what's intentionally deferred
- Tradeoff analysis — what was sacrificed and why that's acceptable
- Completeness — does this fully solve the stated problem

Importantly, the Advocate acknowledges genuine weaknesses. An honest defense with acknowledged gaps is more useful than a fabricated perfect defense.

### Judge Agent

Cross-references all three perspectives. For each finding:
- Checks if Critic's concern is corroborated by Tester's failures
- Checks if Advocate's defense holds up against the evidence
- Classifies into Confirmed / Resolved / Disputed / New Finding
- Presents disputed items for you to decide

## Configuration

The plugin works out of the box with zero configuration. It auto-detects:
- Your base branch (from `git remote`, falls back to `main` then `master`)
- Your test framework (from config files and existing tests)
- Changed files (from `git diff`)

## Troubleshooting

**"Empty diff"** — You're probably on the base branch with no changes. Create a feature branch, make changes, then run the review.

**"No test framework detected"** — The Tester agent will ask what framework to use. Its analysis is still valuable even without running tests.

**Large diffs** — If the diff is very large, the skill will suggest narrowing scope. You can review specific files by checking out a branch with only those changes.

## License

MIT
