---
name: multi-agent-review
description: Adversarial debate pipeline for code review — dispatches Critic, Tester, and Advocate agents in parallel, then a Judge classifies findings and the user resolves disputes interactively
---

# Adversarial Review

Review code changes through an adversarial debate. Three agents analyze changes from opposing perspectives (Critic finds issues, Tester writes adversarial tests, Advocate defends the design), then a Judge synthesizes findings and you resolve any disputes interactively.

## Invocation

The user provides a brief description of the changes:
```
/multi-agent-review "Added auth middleware for API routes"
```

The description is available as the argument passed to this skill.

## Step 1: Gather Context

Run the following commands to collect the review context:

1. Detect the base branch:
```bash
git remote show origin 2>/dev/null | grep 'HEAD branch' | awk '{print $NF}'
```
If this fails (no remote), fall back to `main`, then `master`.

2. Collect the changed file list:
```bash
git diff --name-only <BASE_BRANCH>...HEAD
```

3. Store the base branch name — agents will need it to pull diffs themselves.

**If the file list is empty** (no changes vs base branch), ask the user which files to review.

**Do NOT collect the full diff or read file contents.** Agents will pull diffs and read files themselves, one file at a time, to avoid context overflow.

## Step 2: Prepare Agent Prompts

Read each prompt template file in this skill's directory:
- `critic-prompt.md`
- `tester-prompt.md`
- `advocate-prompt.md`

For each template, substitute these placeholders with the gathered context:
- `{DESCRIPTION}` → the user's description from invocation
- `{FILE_LIST}` → the changed file list
- `{BASE_BRANCH}` → the detected base branch name
- `{WORKING_DIR}` → the absolute path to the project root

## Step 3: Dispatch Parallel Agents

Dispatch all three agents in a SINGLE message so they run concurrently:

```
Agent(subagent_type: "general-purpose", description: "Critic Agent", prompt: <filled critic-prompt>)
Agent(subagent_type: "general-purpose", description: "Tester Agent", prompt: <filled tester-prompt>)
Agent(subagent_type: "general-purpose", description: "Advocate Agent", prompt: <filled advocate-prompt>)
```

**Important:**
- All agents MUST be dispatched as `general-purpose` type — they need full tool access (Bash, Read, Write, Grep, Glob) to pull diffs, read files, search code, and run tests
- Critic and Advocate use Read/Bash/Grep to analyze — they do not modify project files
- Tester uses Read/Write/Bash to write and run tests in `tests/adversarial/`
- All three MUST be dispatched in a single message for parallel execution

Wait for all three agents to return their outputs.

## Step 4: Dispatch Judge Agent

Read `judge-prompt.md` and substitute:
- `{DESCRIPTION}` → the user's description
- `{CRITIC_OUTPUT}` → the full output from the Critic agent
- `{TESTER_OUTPUT}` → the full output from the Tester agent
- `{ADVOCATE_OUTPUT}` → the full output from the Advocate agent

Dispatch the Judge agent:
```
Agent(description: "Judge Agent", prompt: <filled judge-prompt>)
```

Wait for the Judge to return its classified output.

## Step 5: Interactive Dispute Resolution

Parse the Judge's output for **Disputed** items. For each disputed item, present to the user:

```
---
**DISPUTED: [Issue title]**

**CRITIC says:** [Critic's argument with evidence]

**ADVOCATE says:** [Advocate's counter-argument with evidence]

**TESTER result:** [Relevant test results, if any]

→ What's your call?
  (a) Valid concern — add to checklist
  (b) Resolved — Advocate's reasoning holds
  (c) Needs investigation — keep flagged but don't block
---
```

Wait for the user's response on EACH disputed item before presenting the next one. Record each decision and the user's reasoning.

If there are no disputed items, skip this step and tell the user: "No disputed items — all findings were either confirmed or resolved by design."

## Step 6: Generate Final Output

### Terminal Summary

Print a summary to the terminal:

```
## Adversarial Review Summary

**Changes reviewed:** [user's description]
**Files analyzed:** [count]

| Category | Count |
|----------|-------|
| Confirmed Issues | X (Y critical, Z major, W minor) |
| Resolved by Design | X |
| Disputed → Valid | X |
| Disputed → Resolved | X |
| Disputed → Investigate | X |
| New Findings | X |
| Tests Written | X |
| Tests Passed | X |
| Tests Failed | X |

## Action Checklist

- [ ] [CRITICAL] Description (file:line)
- [ ] [MAJOR] Description (file:line)
- [ ] [INVESTIGATE] Description (file:line)
- [ ] [NEW] Description (file:line)
- [x] [RESOLVED] Description — reason
```

### Full Report

1. Create `docs/reviews/` directory if it doesn't exist
2. Check if `docs/reviews/` is in `.gitignore`. If not, append `docs/reviews/` to `.gitignore`
3. Write the full report to `docs/reviews/YYYY-MM-DD-multi-agent-review.md` containing:
   - The user's change description
   - Full Critic output
   - Full Tester output (including test file locations)
   - Full Advocate output
   - Full Judge classification
   - User decisions on disputed items with their reasoning
   - Final checklist

Tell the user: "Full report saved to `docs/reviews/YYYY-MM-DD-multi-agent-review.md`. Test files are in `tests/adversarial/`."

## Edge Cases

- **No git remote:** Fall back to `main` then `master` as base branch
- **No test framework detected:** Tester agent will report this — relay to user and ask what framework to use. If the user provides one, note it for the report but do not re-run (the Tester's analysis is still valuable)
- **Very large number of changed files:** If more than 20 files changed, suggest the user narrow scope to specific files
