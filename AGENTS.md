# Team rules (every agent reads this)

Lunar Landing Site Navigator, NASA Space Apps 2026 (Athens). Team: trim, gio, koum.
Trim and gio use Claude Code. Koum uses Codex (ChatGPT) on Windows.

## Folder ownership

Only edit files inside folders your human owns.

| Name | GitHub login  | Owns                                   |
|------|---------------|----------------------------------------|
| trim | nitrimandylis | everything not listed below            |
| gio  | supergioo0    | `data/` (Python precompute, JSON out)  |
| koum | FILL_IN       | `story/` (slides, video script, sources) |

Nobody's agent edits `.github/`, `AGENTS.md` or `CLAUDE.md`. Trim changes those by hand.

## Stack

- Next.js (App Router), TypeScript, Tailwind, shadcn/ui. Package manager: Bun (`bun install`, `bun run dev`).
- `data/` is Python. It writes JSON that the app reads. The app never calls Python at runtime.
- `story/` is Markdown only: no code.

## Contract

The data shapes passed between folders. Change only when both owners agree.

FILL IN at kickoff (sites + hourly Sun/Earth elevation JSON).

## How work lands

1. Never push to `main`. Work on a branch: `<name>/<short-description>`.
2. Keep each PR to one feature.
3. Open a PR only when your human says so ("ship it"): commit, push, `gh pr create --fill`.
4. CI runs the check, then an AI review. PASS merges automatically. FAIL comments with
   what to fix and pings the author in Discord. Fix it on the same branch and push again.
5. Before starting new work: `git checkout main && git pull`.

The check is `bun run check` (eslint, typecheck, `bun test`) plus `pytest` for `data/`.
Run it before saying anything is done. `story/` changes need no check.

## Tests

- Pure functions (data in, data out, no DOM or rendering) need a test, including one
  known-answer test against a value from a real source.
- Rendering and UI need no tests. The typecheck covers them.

## Pinging people in Discord

Send a ping without asking first, but only in these two cases, and tell your human in the
same reply:

1. You are blocked on a folder someone else owns.
2. Something koum needs for the video or slides is ready.

```bash
gh workflow run notify.yml -f to=gio -f message="need date field from fetchSites()"
```

`to` is `trim`, `gio` or `koum`. No progress updates, no "starting X". You never read
Discord or wait for a reply: stop, and the humans decide what happens next.

## Do not

- Commit `.env` files, API keys or tokens.
- Use any code or material from before the hackathon started, unless the team has confirmed
  it is allowed. Cite every outside source you use in `story/sources.md`, so it can go in
  the submission.
- Commit font files. Fonts load from their CDN CSS link only (licence forbids the files in a public repo).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
