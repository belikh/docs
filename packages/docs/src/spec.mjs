// The source format in one dependency-free place. The parser, `check`, the writers, the agent skill drift check and the
// "Writing documentation" page all read these tables, so a directive added here is known everywhere.

/** Callout containers (`:::note Title`). gh = GitHub alert type, tex = jpcallout kind, css = components.css modifier. */
export const CALLOUTS = {
  note: { label: "Note", gh: "NOTE", tex: "info", css: "" },
  tip: { label: "Tip", gh: "TIP", tex: "ok", css: " jp-callout--ok" },
  warning: { label: "Warning", gh: "WARNING", tex: "warn", css: " jp-callout--warn" },
  danger: { label: "Danger", gh: "CAUTION", tex: "danger", css: " jp-callout--danger" },
};

/** Block directives: `:::name arg` ... `:::` (container) and `::name arg` (leaf, one line). */
export const CONTAINERS = [...Object.keys(CALLOUTS), "see-also"];
export const LEAVES = ["graphic", "glossary"];
export const DIRECTIVES = [...CONTAINERS, ...LEAVES];

/** Inline syntax: `[[page-id]]`, `[[page-id#heading|text]]`, `[[term:Name]]`. */
export const INLINE = ["[[page-id]]", "[[page-id#anchor|text]]", "[[term:Name]]"];

/** Code fence info string: `lang title="Text"`. */
export const FENCE_OPTIONS = ["title"];

export const FRONT_MATTER = {
  title: "string, required",
  summary: "string, required: one sentence, shown in search, cards and the page header",
  section: "string: a section id. Default: the name of the page's first folder (guides/setup.md is in guides). Required for a page that is not in a folder, except index.md",
  order: "number: position inside the section (default 100; ties sort by title)",
  icon: "string: a name from the icon tier of the graphics set, for example home or gear",
  audience: "one of users, developers, agents, maintainers",
  status: "one of draft, stable, deprecated",
  source: "set by jupiter-docs import: { repo, ref, path, url } of the file the page was fetched from (do not write it by hand)",
};
export const AUDIENCES = ["users", "developers", "agents", "maintainers"];
export const STATUSES = ["draft", "stable", "deprecated"];

/** Sections every project can use without declaring them: a folder with one of these names gets this title, summary and icon.
 *  They sort in this order, after the sections a project declares itself. */
export const STANDARD_SECTIONS = [
  { id: "start", title: "Start", summary: "Install it and run it for the first time.", icon: "play" },
  { id: "guides", title: "Guides", summary: "Steps for one task each.", icon: "book" },
  { id: "reference", title: "Reference", summary: "Every command, option and file format.", icon: "code" },
  { id: "concepts", title: "Concepts", summary: "How it works and why it is built this way.", icon: "lightbulb" },
  { id: "develop", title: "Develop", summary: "Build, test and release the project.", icon: "git-branch" },
];

export const CONFIG_KEYS = {
  project: "string, required: the project name",
  id: "string: file name for the PDF (default: the project name, lower case)",
  description: "string: one sentence for the landing page and meta description",
  icon: "string: icon tier name shown on the project's card when a hub site lists the project",
  version: "string, or versionFrom: path of a JSON file whose version field is used",
  versionFrom: "string",
  repo: "string: repository URL, used for edit links and the header link",
  repoBranch: "string, default main",
  siteUrl: "string: public URL (https://docs.example.org), needed for the sitemap",
  base: "string, default /: the path the site is served from",
  src: "string, default docs-src",
  mdOut: "string, default docs",
  siteOut: "string, default dist/site",
  pdfOut: "string, default dist",
  sections: "list of { id, title, summary?, icon? }, in navigation order. Optional: a folder of pages is a section without being listed",
  glossary: "object: term to definition",
  hero: "string: spot graphic for the landing page, for example spot/summit",
  graphicsUrl: "string: URL template for graphics in generated Markdown: {root} {tier} {name} {theme}",
  latexDir: "string: a directory holding jupiter-docs.cls (monorepo packages/latex, or an unpacked jupiter-latex.tgz)",
  author: "string: author line on the PDF cover",
  pdf: "string: file name of the published PDF in the site root (for example jupiter-docs.pdf); adds a PDF link to the top bar and the landing page",
  sources: "list of projects whose pages jupiter-docs import fetches. { repo } reads the docs.config.json and source folder of that repository. { repo, files, sections } lists hand-written Markdown files instead: files maps a repo path to { id, title, summary, section, order, icon, audience, status }. Optional on both: ref (a tag, a branch or latest: the newest release, or the default branch when there is none), id, title, summary, icon. { path } reads a local folder",
  discover: "{ owner, exclude? }: every public repository of this GitHub user or organisation that has a docs.config.json at its root is imported as a project; exclude lists repository names to leave out",
  designDir: "string: where the design system release is unpacked (default vendor/design, or $JUPITER_DESIGN_DIR)",
};
