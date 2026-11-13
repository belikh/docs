# docs

The documentation site (docs.jupiter.au), its PDF and the generator `@belikh/jupiter-docs`. The design system lives in `belikh/design`; this repository depends on its latest release and never copies it.

## Rules

- Everything that inherits from the design system must follow it when it changes. `npm run update:design` downloads the latest release into `vendor/design` (not committed). Never commit files from the design system, never pin a design version here, and never restate a token value.
- Read `DESIGN.md` of the `jupiter-design-system` skill before touching `latex/jupiter-docs.cls`, `packages/docs/assets` or the site layout. The PDF uses SGI Text, SGI Alt and JetBrains Mono only; `npm run build:pdf` checks this with `pdffonts`.
- Documentation is written with the `jupiter-docs` skill (`skill/SKILL.md`). Pages of other projects come from `sources` in `docs.config.json` through `jupiter-docs import`; change them in their own repository.
- README.rst follows the `github-readme` skill. Plain wording: no slogans, no "X, not Y", no emoji.
- Commits are authored by `belikh <io@belic.net>` with no attribution lines. The body has a "Why:" paragraph.

## Commands

- `npm ci && npm run update:design`
- `npm test`, `npm run lint` (the skill matches the generator), `npm run check`
- `npm run build:site`, `npm run build:pdf`

## Where things live

- `packages/docs`: generator. `src/spec.mjs` lists every directive, front matter key and config key.
- `docs-src`, `docs.config.json`: site content. `docs/*.md` is generated and committed (`jupiter-docs build --check` fails when stale).
- `latex/jupiter-docs.cls`, `skill/SKILL.md`: copied into `packages/docs` on `npm pack` by `scripts/stage-package.mjs`.
- `.github/workflows`: `ci`, `docs-site`. `docs-site` runs on push, daily, on demand and on `repository_dispatch` (`design-released`).
