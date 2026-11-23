---
when: Executing an approved Factory job unattended on a `factory/<KEY>` branch created by marshal-factory.
---

# Factory run

This playbook ships with marshal-factory, not with the repository: the first message names its path on this machine. A repository copy may add repository-specific notes; where it differs from this file, this file wins.

The runtime has the Coforge skills `coforge-brownfield`, `coforge-task`, `coforge-browser-verification`, and `coforge-delivery`, plus the pinned PStack plugin. Use the four Coforge skills for the mission lifecycle. Use PStack's actual installed skills where applicable: `tdd` for a cheap regression target, `fix-ci`, `fix-merge-conflicts`, `make-pr-easy-to-review`, `show-me-your-work`, and `babysit`. Do not look for the obsolete `feature`, `bug-fix`, or `opening-a-pr` names; PStack 0.9.69 does not ship them.

No human reads this thread while it runs. The supervision panel and the pull request are the only outputs anyone sees. The branch name carries the work key: `factory/FAC-2` works Linear issue `FAC-2`, while `factory/COF-104` works Coforge mission `COF-104`. The approved issue or mission goal, plan, acceptance criteria, and URL are in the first message.

## Coforge missions

When the first message identifies a Coforge mission, treat its approved plan as the controlling specification. Complete its numbered tasks in order on the one mission branch and open at most one delivery pull request. Questions go through the same `waiting` stage; the owner answers in the Coforge mission workspace rather than Linear. Do not create or depend on a Linear issue, do not start another job for a task, and do not use a cloud or Modal sandbox. Coforge P0 is local-only. In all later instructions, references to “the issue” mean the approved Coforge mission when that is the source.

## Standing rules

- **Report every stage.** Call the `report_stage` tool of the `factory-report` MCP server each time the run enters a stage, before doing that stage's work. Stages in order: `triage`, `investigating`, `implementing`, `verifying`, `pr`. Off the main path: `waiting` and `failed`. The summary is one or two plain sentences about this issue, not about the process.
- **Never ask in the thread.** No `AskUserQuestion`, no plan-mode approval, no question in a reply that waits for an answer. Nobody answers. Treat the factory run as a full-autonomy grant for every reversible step.
- **Blocked or ambiguous means `waiting`.** When the issue does not say what done looks like, or something outside the repo blocks you, call `report_stage` with `stage: "waiting"`, a summary of what you found, and a `question` the reporter can answer in one reply. Name the decisions you need and offer two or three concrete options for each. Then end the turn. Do not guess and do not open a PR for a guess.
- **Never merge yourself.** Never run `gh pr merge`, never arm auto-merge, never push to `main`. The run ends at a merge-ready PR reported with a merge assessment (see Merge assessment). The factory decides whether it merges or goes to a human.
- **Clean up only what you started.** Other runs and the operator's own servers share this machine. Start a dev server on a free port, remember its PID, and stop that PID before the turn ends. Never `pkill` or `killall` by name, and never stop a process you did not start.
- **Prove the commit you ship.** Before you report `pr`, run `factory-verify` in the worktree on the final pushed commit, with nothing uncommitted. In a sandbox it is on `PATH`; elsewhere run the command the `report_stage` reply for `verifying` names (`bun <factory root>/hooks/verify.ts`). It runs the repo's checks at `HEAD` and reports exit codes and output for that exact commit. The factory merges only a head whose checks passed there, and runs them itself when it can. Uncommitted changes make the run count for nothing. If you push again, run it again.
- **Show the pages you change.** In a sandbox the `playwright` MCP server drives a headless Chromium that reaches only `localhost`. Before you report `verifying` done on a change to a page or screen, start the repo's dev server, open it there and look at the result. Take a viewport screenshot of each changed page or state with `browser_take_screenshot`; it saves the file under `/work/browser`. Attach them to the `pr` assessment (see Merge assessment). The owner sees what you attached, and the factory hands a PR that changes UI files over to the owner when it has no screenshots.
- **Giving up means `failed`.** If you cannot finish (three fix rounds on the same failure, a broken toolchain, a dead end), call `report_stage` with `stage: "failed"` and the reason in `summary`, then end the turn.

## Triage

1. Call `report_stage` with `stage: "triage"`.
2. Decide the type from the mission text. For a defect with a cheap local test target, use PStack's `tdd` skill. For requested behavior, follow `coforge-task` and the repository's existing development conventions.
3. Test for ambiguity before any code. Write down the acceptance check, a test or an observable result, using only the issue text. If you cannot, the issue is ambiguous: report `waiting` with the question and stop.
4. Work in the thread's worktree on the current branch. Do not create other worktrees or branches for the PR.

## Resumed runs

A run that stopped in `waiting` resumes when the reporter answers on Linear. The factory then sends this thread a message that quotes your question and the answer, or starts a fresh thread on the same branch with both in its first message.

1. Start again at Triage and call `report_stage` with `stage: "triage"`. Keep the branch and any commits already on it.
2. The answer is the spec. Where it picks an option you offered, build that option and nothing the reporter did not ask for. Where it adds a request, include it.
3. Run the ambiguity test again with the issue plus the answer. If you still cannot write the acceptance check, report `waiting` with one more concrete question about what is still open, and end the turn. Do not guess.
4. Otherwise continue with this playbook and the approved checklist.

## Merge conflicts

When the factory tells this thread that its PR conflicts with main, the board has already moved the run back to Implementing.

1. Run `git fetch origin` and `git merge origin/main` on this branch. Never rebase a pushed factory branch and never force-push it.
2. Resolve each conflict so that main's change and yours both keep working. Read main's commit to learn what it meant. Do not drop either side to make the conflict go away.
3. Call `report_stage` with `stage: "verifying"`, then run lint, typecheck, tests and build, and check the changed screen when the conflict touched UI.
4. Commit the merge, push, and use PStack's `babysit` skill to drive the PR to green. Run `factory-verify` on the pushed merge commit. Then call `report_stage` with `stage: "pr"`, the `prUrl` and a fresh merge assessment again, and end the turn.
5. If the two changes contradict each other and the issue does not say which wins, abort the merge with `git merge --abort`, report `waiting` with a question that names both changes, and end the turn.

## Merge assessment

Every run ends one of three ways: the factory merges it, it hands it over to the owner for review, or you asked before building (`waiting`). If the issue is open enough that different readings give different features, report `waiting` before building.

1. Write down how you read the issue and every assumption you filled a gap with. Issues are often underspecified; that is fine. Put the assumptions in the PR body under a heading `Assumptions I made`, one bullet each; the factory copies them to the Linear comment.
2. Run `factory-verify` on the pushed head, as in Standing rules.
3. Recommend `merge` when you are confident you built what the issue asked for and that it works. Additive changes the issue asked for, such as new exports or new endpoints, are fine.
4. Recommend `handover` only when you are not confident: you are unsure what the issue meant, unsure about an assumption you had to make, or you could not show the change works. Say why in one or two sentences.

When you report `pr`, pass `assessment`: `recommendation`, `interpretation`, `assumptions`, and `confidence` with `confident` and, when you are not confident, the `reason`. Add `notes` for anything else the owner should know. When the change shows on a page, add `screenshots`: up to six entries, each with the `file` the configured Playwright server saved and a `caption` that says what the image shows and what to look for. Each file must be a PNG, JPEG or WebP image under 1 MB; `report_stage` refuses the report if one can't be read. Be honest: the factory checks CI, conflicts and Bugbot itself, holds the head to the evidence `factory-verify` reported for it, and a `merge` it cannot back up costs trust.

## PStack adaptations for unattended Factory runs

- Report `investigating` before reproducing or reading deeply, `implementing` before edits, and `verifying` before checks.
- If the control surface cannot reach the target, report `waiting` with the exact missing access or reproduction and stop.
- For a defect with a cheap test target, use `tdd`: capture the failure before the fix and keep the regression test.
- Run relevant lint, typecheck, tests, build, and browser verification before pushing.
- Prefix commits with the mission key, for example `COF-12 fix(search): match item names case-insensitively`.
- Use `make-pr-easy-to-review` for the final description and `show-me-your-work` when the run has non-obvious decisions.
- Opening the PR starts `babysit`; use `fix-ci` and `fix-merge-conflicts` when needed. Watch in the foreground because no scheduler wakes this thread after it ends.
- Babysitting never authorizes merging. When the PR is ready or only owner approval remains, run `factory-verify`, report `pr` with fresh evidence, and stop. After three failed repair rounds, report `failed` with the PR URL and exact blocker.
