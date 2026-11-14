# @belikh/jupiter-docs

Generates a project's documentation from one Markdown source folder. The same `docs-src/` produces a static site, plain GitHub Markdown and a PDF, all in the Jupiter look.

```sh
npm install --save-dev @belikh/jupiter-docs
npx jupiter-docs init          # docs.config.json and docs-src/
npx jupiter-docs check         # validate the source and its wording
npx jupiter-docs voice README.rst   # check the wording of any other Markdown or .rst file
npx jupiter-docs build         # docs/*.md and dist/site
npx jupiter-docs build --pdf   # dist/<id>.pdf for each project (needs xelatex and rsvg-convert)
npx jupiter-docs build --check # fail when docs/*.md is out of date
```

The format (page header, directives, links, config) is described in `docs-src/writing-documentation.md` of belikh/docs and in the `jupiter-docs` agent skill (`skill/SKILL.md`). `src/spec.mjs` lists every directive and header key.

- Design system: not installed as npm dependencies. The generator reads the tokens, graphics, GitHub kit and fonts from `vendor/design` (or `$JUPITER_DESIGN_DIR`), which `scripts/update-design.mjs` fills from the latest belikh/design release, and falls back to `node_modules` for projects that install `@belikh/jupiter-*` themselves.
- Site: output is relative-linked with hashed assets, a `_headers` file and a 404 page. Set `base` in `docs.config.json` to serve it from a sub-path.
- PDF: `latex/jupiter-docs.cls` plus `jupiter.sty`, fonts and graphics from the `jupiter-latex` bundle (`vendor/design/latex`, `latexDir` or `JUPITER_LATEX_DIR`). It needs `xelatex` and `rsvg-convert`.
- Projects: `jupiter-docs import` fetches other projects into `docs-src/_imported/<project id>/`. `discover` finds every public repository of an owner that has a `docs.config.json`; `sources` lists single repositories. Each project gets a landing page, its own navigation and its own glossary on the site.
- Sections: a folder in `docs-src/` is a section. `start`, `guides`, `reference`, `concepts` and `develop` have fixed titles and order (`STANDARD_SECTIONS` in `src/spec.mjs`).
- Voice: `check` fails on wording from the `VOICE` lists in `src/spec.mjs` (praise words, filler, an em dash, an emoji) and warns on long sentences. `skill/VOICE.md` explains each rule.
- Redirects: `redirects` in the config maps an old address to a page id; the site writes a page at the old address that sends the reader on.
- Tests: `npm test` in the repository root.
