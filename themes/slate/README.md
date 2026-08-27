# Slate theme

A neutral, modern SaaS-style brand kit: cool gray scale with a blue accent
(`#2563EB`), Inter for text and JetBrains Mono for code. Token-only — no brand
assets — and MIT-licensed, so it is safe to reuse anywhere.

## Tokens

Canonical source: [`tokens.json`](./tokens.json) (DTCG). Generated outputs in
[`dist/`](./dist): `tokens.css`, `tailwind.css`, `tokens.dtcg.json`, `theme.ts`.

## Assets

None. This theme ships design tokens only.

## Roles

`role.primary`, `role.surface`, `role.on-surface`, `role.on-surface-muted` and
`role.outline` point at palette colours rather than copying them. Repoint a
colour and every role that names it follows.
