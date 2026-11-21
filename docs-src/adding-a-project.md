---
title: Add a project
summary: Put a project's documentation on this site while its pages stay in the project's own repository.
section: contribute
order: 5
icon: plus
audience: developers
status: stable
---

A [[term:Project]] writes its pages in its own repository. This repository holds no copy of them: `jupiter-docs import` fetches the pages before every build, and the site, the PDF and `llms.txt` are generated from what it fetched.

## Register a project

A public repository of `belikh` registers itself. Commit these two things to its default branch:

```text title="In the project's repository"
docs.config.json        the project name and one sentence about it
docs-src/
  index.md              the project's landing text
  start/install.md      pages, grouped in folders
```

`jupiter-docs init` creates both. The next build of this site finds the repository through `discover` in `docs.config.json` here and adds the project. The site builds once a day, on every push to this repository and on request.

A repository of another owner, or one that should use a fixed branch or another id, gets one line in `sources`:

```json title="docs.config.json of this repository"
"discover": { "owner": "belikh", "exclude": ["scratch"] },
"sources": [
  { "repo": "someone/their-project" },
  { "repo": "belikh/aquila", "ref": "main", "id": "aquila", "icon": "server" }
]
```

| Key | Meaning |
| --- | --- |
| `repo` | `owner/name` on GitHub. |
| `ref` | A tag, a branch or `latest`. `latest` is the newest release, or the default branch when the project has no release or the release has no `docs.config.json`. |
| `id` | The first part of the project's addresses, for example `/aquila/`. Default: `id` in the project's own `docs.config.json`, then the repository name in lower case. |
| `title`, `summary`, `icon` | Replace the values from the project's own `docs.config.json`. |
| `path` | A local folder in place of `repo`, to preview a project that is not pushed yet. |

Private repositories, forks and archived repositories are not discovered.

## What the project's config holds

```json title="docs.config.json of the project"
{
  "project": "Aquila",
  "id": "aquila",
  "description": "A fleet manager for NixOS hosts.",
  "icon": "server",
  "versionFrom": "package.json",
  "repo": "https://github.com/belikh/aquila",
  "glossary": { "Host": "One machine that Aquila manages." }
}
```

`project` and `description` become the title and the summary of the project's card on the home page. `icon` is the icon on that card. `id` is the first part of the project's addresses; choose it once, because addresses are permanent. The glossary belongs to the project: `[[term:Host]]` on one of its pages links to the project's own glossary page.

## Sections

A folder in `docs-src` is a section. These five folder names have a fixed title, summary and icon, and appear in this order in every project, so a reader finds the same things in the same place:

| Folder | Title | What goes in it |
| --- | --- | --- |
| `start` | Start | Install the project and run it for the first time. One page is often enough. |
| `guides` | Guides | One task per page, as numbered steps with the commands to copy. |
| `reference` | Reference | Every command, option, file format and API, in tables. |
| `concepts` | Concepts | How the project works and why it is built this way. |
| `develop` | Develop | Build, test and release the project. |

Any other folder becomes a section named after the folder. A project that needs its own titles or order lists `sections` in its `docs.config.json`; declared sections come first.

## Several PDFs

A project has one PDF that holds every section. A project that needs separate ones, such as a user guide, an installation guide and a developer reference, lists `documents` in its `docs.config.json`:

```json title="docs.config.json of the project"
"documents": [
  { "id": "user", "title": "User guide", "summary": "Run Aquila day to day.", "sections": ["guides", "concepts"] },
  { "id": "install", "title": "Installation guide", "sections": ["start"] },
  { "id": "developer", "title": "Developer reference", "sections": ["reference", "develop"] }
]
```

| Key | Meaning |
| --- | --- |
| `id` | Lower case letters, digits and `-`. The PDF is `<project id>-<document id>.pdf`, so this example builds `aquila-user.pdf`, `aquila-install.pdf` and `aquila-developer.pdf`. |
| `title` | Shown below the project name on the cover, and on the download button. |
| `summary` | Optional. One sentence, shown when the pointer is over the download button. |
| `sections` | The section ids in the document, in reading order. A section can be in more than one document. |

The project's landing page has one download button per document. The PDF link at the top of a page opens the document that holds the page's section. The project's `index.md` opens every document. A link to a page of another document is plain text in the PDF, because that page is not in the file.

`jupiter-docs check` reports a document that names an unknown section as an error. It warns about a section that is in no document, because its pages are then in no PDF.

:::warning
A project with `documents` has no `<project id>.pdf`. A link to that file from another site stops working at the next build.
:::

## Addresses and links

A page is published at `/<project id>/<path of the file>/`, so `docs-src/guides/backup.md` of `aquila` is at `/aquila/guides/backup/`. The project's `index.md` is its landing page at `/aquila/`.

`[[guides/backup]]` on a page of the project names a page of the same project. To link to another project, start with its id: `[[design/consuming]]`, or `[[design]]` for its landing page. Relative links to files that are not pages, and images, point at the project's repository at the imported ref.

## When a project has errors

Run `jupiter-docs check` in the project before a release. If a released project still fails the check here, the site is built without it and the build log has a warning with every error. Errors in the pages of this repository stop the build.

Wording is treated differently. A voice finding in a project's page is an error in the project's own check and a warning here. The page stays on the site, and the build log names the sentence to fix (see [[writing-documentation#voice|Voice]]).

## When a page moves

Addresses are permanent once published. When a file is renamed or a project changes its id, add the old address to `redirects` in `docs.config.json` of this repository. The site keeps a small page there that sends the reader to the new one:

```json title="docs.config.json of this repository"
"redirects": { "consuming": "design/consuming" }
```

## Rebuild after a release

The daily build picks up a new release. To publish sooner, send a `repository_dispatch` event of type `docs-changed` from the project's release workflow:

```sh title="After the release step"
gh api repos/belikh/docs/dispatches -f event_type=docs-changed
```

The call needs a token that can write to `belikh/docs`.

## Projects without a docs-src folder

Hand-written Markdown files of a repository can be listed one by one. The entry then carries what the project's config would hold:

```json title="docs.config.json of this repository"
{
  "repo": "belikh/design", "id": "design", "title": "Design system",
  "sections": [{ "id": "use", "title": "Use" }],
  "files": {
    "docs/consuming.md": { "id": "consuming", "title": "Depending on the design system", "summary": "How a project takes the design system as a dependency.", "section": "use", "order": 10 }
  }
}
```

The import removes each file's first `#` title and a leading comment, and turns links between the listed files into page links.

:::see-also
- [[writing-documentation]]
- [[glossary]]
:::
