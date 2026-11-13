# @belikh/jupiter-docs

Generates a project's documentation from one Markdown source folder. The same `docs-src/` produces a static site, plain GitHub Markdown and a PDF, all in the Jupiter look.

```sh
npm install --save-dev @belikh/jupiter-docs
npx jupiter-docs init          # docs.config.json and docs-src/
npx jupiter-docs check         # validate the source
npx jupiter-docs build         # docs/*.md and dist/site
npx jupiter-docs build --pdf   # dist/<id>.pdf (needs xelatex and rsvg-convert)
npx jupiter-docs build --check # fail when docs/*.md is out of date
```

The format (page header, directives, links, config) is described in `docs-src/writing-documentation.md` of belikh/docs and in the `jupiter-docs` agent skill (`skill/SKILL.md`). `src/spec.mjs` lists every directive and header key.

- Design system: not installed as npm dependencies. The generator reads the tokens, graphics, GitHub kit and fonts from `vendor/design` (or `$JUPITER_DESIGN_DIR`), which `scripts/update-design.mjs` fills from the latest belikh/design release, and falls back to `node_modules` for projects that install `@belikh/jupiter-*` themselves.
- Site: output is relative-linked with hashed assets, a `_headers` file and a 404 page. Set `base` in `docs.config.json` to serve it from a sub-path.
- PDF: `latex/jupiter-docs.cls` plus `jupiter.sty`, fonts and graphics from the `jupiter-latex` bundle (`vendor/design/latex`, `latexDir` or `JUPITER_LATEX_DIR`). It needs `xelatex` and `rsvg-convert`.
- Import: `jupiter-docs import` fetches the files listed in `sources` at the latest release tag into `docs-src/_imported`.
- Tests: `npm test` in the repository root.
