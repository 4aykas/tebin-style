# Coding standards

Read at review. Each rule here is a judgement call; anything a script can
decide belongs in `pnpm verify` instead.

## Brand values have a source

A new or changed value in `themes/tebin/tokens.json` or
`themes/tebin-classic/tokens.json` (colour, type, spacing, radius, motion)
names its source in the PR or in `$description`: tebin.pro as built, the 2017
brand book, or an owner decision with its issue. `tebin` describes the live
site, so a value from another library or design system is a proposal until it
is checked against tebin.pro. Flag a brand value with no source.

## Borrowing reviews record what was left

A change that adopts ideas from an outside project says what it took, what
it left and why, in the CHANGELOG entry or the PR. The left-out half stops
the next review from proposing the same thing again.

## Rules state the target

A new entry in `rules/rules.json` states the behaviour to produce, carries a
`rationale` that says what goes wrong without it, and a `source` that names
where it came from. `themes` narrows a rule only when it encodes one brand's
choice; general web practice stays unscoped.
