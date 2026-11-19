---
title: Writing documentation
summary: How to write the one source folder that becomes the docs site, the Markdown files in the repository and a PDF.
section: contribute
order: 10
icon: edit
audience: developers
status: stable
---

Documentation is written once, in `docs-src/`, as Markdown with a small header on each file. The `jupiter-docs` command (package `@belikh/jupiter-docs`) turns that folder into three outputs. Never edit an output by hand: the next build overwrites it.

| Output | Where | Command |
| --- | --- | --- |
| Static site for docs.jupiter.au | `dist/site` | `jupiter-docs build --site` |
| Plain GitHub Markdown | `docs/*.md` | `jupiter-docs build --md` |
| PDF, one per project | `dist/<id>.pdf` | `jupiter-docs build --pdf` |

## Folder layout

```text title="docs-src and docs.config.json"
docs.config.json        project name, description, version, repository, glossary
docs-src/
  index.md              landing page text
  start/install.md      one page per file; the path is the page id: start/install
  guides/backup.md      a folder is a section: this page is in Guides
```

A page belongs to the section named by its folder. The folders `start`, `guides`, `reference`, `concepts` and `develop` have a fixed title and order (see [[adding-a-project#sections|Sections]]). A page that is not in a folder names its section in its header, and `docs.config.json` lists such sections under `sections`. Pages in a section are sorted by `order`, then by title.

```json title="docs.config.json"
{
  "project": "My project",
  "versionFrom": "package.json",
  "repo": "https://github.com/me/my-project",
  "description": "What the project does, in one sentence.",
  "glossary": { "Token": "A named design constant." }
}
```

## Page header

Every page starts with a YAML block. `title` and `summary` are required. `section` is required only on a page that is not in a folder, except `index.md`.

```yaml title="docs-src/guides/setup.md"
---
title: Set up the project
summary: Install the tools and run the first build.
order: 20
icon: terminal
audience: developers
status: stable
---
```

`icon` is a name from the icon tier of the graphics set. `audience` is one of users, developers, agents or maintainers. `status` is draft, stable or deprecated. The page title is the top heading, so the body starts at `##` and never skips a level.

## Directives

Block directives start with colons. Use four colons for the outer block when you nest one inside another.

````markdown title="Callouts"
:::note
Plain information.
:::

:::warning Check the version
A title is optional. The kinds are note, tip, warning and danger.
:::
````

:::tip
Callouts become GitHub alerts in the repository Markdown, boxed text on the site and `jpcallout` boxes in the PDF.
:::

One-line directives start with two colons.

````markdown title="Graphics, diagrams and the glossary"
::graphic rule/end
::graphic spot/summit A mountain with a flag on the summit
::diagram wiring/board-to-monitor The board's GPIO 4 goes to pin 7 of the monitor
::glossary
````

`::graphic tier/name` places a graphic from `@belikh/jupiter-graphics`. Text after the name is the alt text; leave it out for a decorative graphic. The site draws it inline in the theme colour, the repository Markdown uses a light and dark `<picture>`, and the PDF uses a coloured copy. `::diagram name Alt text` places a drawing that your project made itself, see [Add a diagram](#add-a-diagram). `::glossary` lists every term from the glossary in `docs.config.json`.

## Links

Link to another page with its id, and to a heading with its anchor. Plain relative links to `.md` files also work.

````markdown title="Cross-references"
See [[guides/setup]] or [[guides/setup#install|the install steps]].
A [[term:Token]] is defined once in the glossary.

:::see-also
- [[reference/cli]]
:::
````

A page id names a page of the same project first. Start with a project id to link to another project: `[[design/consuming]]`. A [[term:Token]] is a named design constant.

Links to files outside the source folder, such as `../AGENTS.md`, are checked against the repository and become repository links on the site. Raw HTML is not allowed.

## Code

Give every code block a language, and a title when the block is a file or a command with context. Use `text` for plain output.

````markdown title="Code with a title"
```sh title="Install"
npm install
```
````

## Check and build

```sh title="Commands"
jupiter-docs check              # validate the source and its wording
jupiter-docs voice README.rst   # check the wording of any other Markdown or .rst file
jupiter-docs build              # write docs/*.md and dist/site
jupiter-docs build --pdf        # also build one PDF per project (needs xelatex)
jupiter-docs build --check      # fail when docs/*.md is out of date (CI)
jupiter-docs import             # fetch the projects named by sources and discover (docs-src/_imported)
jupiter-docs init               # scaffold docs-src in a new project
```

`check` names the file and line of each problem:

- a missing title or summary, or an unknown section, graphic, icon or glossary term
- a diagram that is missing, has no alt text, or breaks the drawing rules
- a broken page link or anchor
- a heading that skips a level, an unclosed directive, a code block without a language
- wording that fails the voice rules (see [Voice](#voice))

:::warning
`build --md` only writes files that carry the generated header. Hand-written files in `docs/` are never touched or deleted.
:::

## Pages from other projects

A project's pages stay in its repository. `jupiter-docs import` fetches every project named by `sources` and `discover` in `docs.config.json` at its latest release and writes the pages to `docs-src/_imported/<project id>/`. The folder is not committed and the pages are not written to `docs/`. [[adding-a-project]] has the steps and the keys.

## The design system

The site and the PDF take their colours, fonts, graphics and LaTeX classes from the latest `belikh/design` release. `npm run update:design` downloads it into `vendor/design`, which is not committed, and the workflows do the same before every build. When the design system changes, the next build looks different with no change in this repository.

## What a good page has

- A title that names the task or the thing, and a one-sentence summary that says what the reader gets.
- The command or the result in the first screen. Steps are a numbered list, one action each, with the command to copy.
- Every option, flag and file in a table with its default. A reader should not need the source code.
- One working example that can be pasted and run, with the output it prints.
- The errors a reader will meet, quoted exactly, each with its cause and its fix.
- Links to the next page a reader needs, in a `:::see-also` block.

## Voice

A reader who has never seen the project should find the answer on the first screen and understand every sentence on the first read.

- Answer first. The first sentence says what the thing is or what the reader gets.
- One idea per sentence, most under 25 words. Say "you", use the present tense, write steps as commands.
- State facts a reader can check: numbers, names, defaults, paths, exact error text.
- Use the short word: use, help, show, before, because, can.
- The page does not describe itself, and it stops when the content ends.

`jupiter-docs check` tests the prose of every page. Code blocks, inline code and block quotes are left out, so quoted text stays as given.

| Finding | Level |
| --- | --- |
| Praise words such as `powerful`, `robust`, `seamless`; sincerity words such as `simply`, `truly`; signposting such as `worth noting`, `in conclusion`, `moreover`; `not just X but Y`; `this page explains`; an em dash; an emoji | Error |
| `note that`, `in order to`, `is able to`, `prior to`, `easily`, `X, not Y`, an exclamation mark, a sentence over 35 words | Warning |

Fix the sentence when a word is flagged: state the fact the word stood for. `jupiter-docs voice README.rst` runs the same check on any Markdown or `.rst` file. The full guide, with rewrites, is [VOICE.md](../skill/VOICE.md). The visual rules are in `DESIGN.md` of the `jupiter-design-system` skill; the site and the PDF already follow them.

## Add a graphic

Graphics come only from `@belikh/jupiter-graphics`. If the set lacks one, add it to `packages/graphics` in the design repository (`belikh/design`) first. Once that is released, the next docs build can use its `tier/name`. `jupiter-docs check` fails on a name that is not in the set.

::graphic rule/loops

:::see-also
- [[adding-a-project]]
- [[glossary]]
:::

## Add a diagram

A diagram is line art that your project draws itself, for a figure the graphics set does not have: a wiring plan, a timing chart, a state machine. Write it as an SVG file and place it with `::diagram name Alt text`. The name is the path of the file below a diagram folder, without `.svg`. The folder is `diagrams` below the source folder, and `diagrams` in `docs.config.json` lists other folders:

````json title="docs.config.json"
{ "diagrams": ["diagrams", "figures"] }
````

`::diagram wiring/board-to-monitor` reads `docs-src/diagrams/wiring/board-to-monitor.svg`. The alt text is required, because a diagram is never decoration.

::diagram three-outputs One source reaches three outputs. Pages and SVG diagrams go into jupiter-docs. The site gets the diagram inline in the theme colour, the Markdown gets a light and a dark file, and the PDF gets the light file drawn with the design system's fonts.

The diagram follows the design system's rules for line art, and `jupiter-docs check` tests them:

| Rule | What to do |
| --- | --- |
| Size | Give the `<svg>` a `viewBox` at most 720 wide, and keep the file under 100 KB. |
| Elements | Use `svg`, `g`, `defs`, `marker`, `title`, `desc`, `text`, `tspan`, `path`, `line`, `polyline`, `polygon`, `rect`, `circle` and `ellipse`. |
| Lines | Set `fill="none"`, `stroke="currentColor"` and one `stroke-width` between 1 and 3 on the `<svg>`. Shapes have no fills. |
| Colour | Use `currentColor`, `none` or `var(--jp-NAME)`, where `NAME` is `text`, `text-muted`, `border`, `accent`, `ok`, `warn`, `danger` or `info`. Never a hex value, and no opacity. |
| Text | Do not set `font-family`. Diagram text is JetBrains Mono. A size of 13 or 14 units is readable in the PDF. |
| Nothing else | No gradients, filters, shadows, images, scripts, `style` attributes or links to other files. |

Text is filled and has no outline, whatever the `<svg>` sets. A marker does not inherit the colour of the line that uses it, so set `stroke` on the marker's own path.

On the site the SVG is inlined, so it follows the light and dark theme. For the Markdown output `jupiter-docs build` writes `docs/diagrams/<name>-light.svg` and `-dark.svg` and draws them with a `<picture>`, so commit them with the pages. The PDF build converts the light file with `rsvg-convert` and fails when that tool is missing, so a PDF never loses a diagram. A project's diagram folders are imported with its pages, so its diagrams appear on docs.jupiter.au.
