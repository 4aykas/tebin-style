# Issue tracker: Gitea

Issues and PRDs for this repo live on Gitea: `git.tebin.co/TEBIN/tebin-style`
(since 2026-10-18, imported with their history from GitHub). The GitHub
repo `4aykas/tebin-style` is a push mirror; nothing is filed or answered there, and
`gh issue` reaches the stale copy.

## Conventions

Use the Gitea REST API (`https://git.tebin.co/api/v1/repos/TEBIN/tebin-style`) with
`Authorization: token <t>`, where the token comes from `GITEA_TOKEN` or the
file `~/.env/.gitea`. Never print it. Write request bodies to a file with the
Write tool and pass them with `--data @file`.

- **Create an issue**: `POST /issues` with `{"title", "body", "labels": [<label ids>]}`.
- **Read an issue**: `GET /issues/<n>` and `GET /issues/<n>/comments`.
- **List issues**: `GET /issues?state=open&type=issues&labels=<name>&limit=50`.
- **Comment on an issue**: `POST /issues/<n>/comments` with `{"body"}`.
- **Apply / remove labels**: `POST /issues/<n>/labels` with `{"labels": [<ids or names>]}` / `DELETE /issues/<n>/labels/<id>`; label ids from `GET /labels`.
- **Close**: comment, then `PATCH /issues/<n>` with `{"state": "closed"}`.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

## When a skill says "publish to the issue tracker"

Create a Gitea issue.

## When a skill says "fetch the relevant ticket"

`GET /issues/<n>` and its comments.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: a single issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body.
- **Child ticket**: listed in a task list in the map body, with `Part of #<map>` at the top of the child body. Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to the driving dev.
- **Blocking**: Gitea's issue dependencies. `POST /issues/<child>/dependencies` with `{"owner": "TEBIN", "repo": "tebin-style", "index": <blocker>}`; `GET /issues/<child>/dependencies` lists the blockers. A ticket is unblocked when every blocker is closed.
- **Frontier query**: the map's open children, minus any with an open blocker or an assignee; first in map order wins.
- **Claim**: `PATCH /issues/<n>` with `{"assignees": ["<login>"]}`, the session's first write.
- **Resolve**: comment the answer, close the issue, then append a context pointer (gist + link) to the map's Decisions-so-far.
