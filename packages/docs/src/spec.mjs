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
export const LEAVES = ["graphic", "diagram", "glossary"];
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
  id: "string: the project's short name in lower case letters, digits and -. It is the file name of the PDF and the first part of the project's addresses on a hub site (default: the project name, lower case; on a hub, the repository name)",
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
  diagrams: "list of folders below the source folder that hold the SVG files of ::diagram (default [\"diagrams\"]). ::diagram wiring looks for wiring.svg in each folder, in order",
  graphicsUrl: "string: URL template for graphics in generated Markdown: {root} {tier} {name} {theme}",
  latexDir: "string: a directory holding jupiter-docs.cls (monorepo packages/latex, or an unpacked jupiter-latex.tgz)",
  author: "string: author line on the PDF cover",
  pdf: "string: file name of this project's PDF (default {id}.pdf). Every project gets one; its pages link to it when build --pdf has written it",
  sources: "list of projects whose pages jupiter-docs import fetches. { repo } reads the docs.config.json and source folder of that repository. { repo, files, sections } lists hand-written Markdown files instead: files maps a repo path to { id, title, summary, section, order, icon, audience, status }. Optional on both: ref (a tag, a branch or latest: the newest release, or the default branch when there is none), id, title, summary, icon. { path } reads a local folder",
  redirects: "object: an old address to a page id, for example { \"consuming\": \"design/consuming\" }. The site keeps a page at the old address that sends the reader to the new one",
  discover: "{ owner, exclude? }: every public repository of this GitHub user or organisation that has a docs.config.json at its root is imported as a project; exclude lists repository names to leave out",
  designDir: "string: where the design system release is unpacked (default vendor/design, or $JUPITER_DESIGN_DIR)",
};

// ---- Voice. `jupiter-docs check` and `jupiter-docs voice` test prose against these tables (code, inline code and block quotes are
// not tested). Each entry is [label, pattern, what to write]. The label is what skill/VOICE.md shows; the pattern is a
// case-insensitive regular expression matched on whole words. "error" entries fail the check, "warning" entries are printed.
export const VOICE = {
  error: [
    // praise that states no fact
    ["seamless", "seamless(ly)?", "say what connects to what, and how"],
    ["effortless", "effortless(ly)?", "say how many steps it takes"],
    ["robust", "robust(ly|ness)?", "say what it survives: a restart, a bad input, a lost connection"],
    ["powerful", "powerful(ly)?", "say what it can do"],
    ["elegant", "elegant(ly)?", "describe the design"],
    ["delightful", "delight(ful|fully|s|ed)?", "say what the reader gets"],
    ["stunning", "stunning(ly)?", "describe what is on the screen"],
    ["vibrant", "vibrant", "name the colours"],
    ["cutting-edge", "cutting[- ]edge|state[- ]of[- ]the[- ]art|world[- ]class|best[- ]in[- ]class|next[- ]generation", "state the measured result"],
    ["revolutionary", "revolutionary|game[- ]chang(er|ing)|groundbreaking", "say what changed"],
    ["blazing fast", "blazing(ly)?[- ]fast|lightning[- ]fast", "give the time in milliseconds or seconds"],
    ["supercharge", "supercharg(e|es|ed|ing)|turbocharg(e|es|ed|ing)", "say what gets faster and by how much"],
    ["streamline", "streamlin(e|es|ed|ing)", "say which steps are removed"],
    ["empower", "empower(s|ed|ing)?", "say what the reader can now do"],
    ["holistic", "holistic(ally)?|synerg(y|ies|istic)|paradigm", "say the literal thing"],
    // long words where a short one exists
    ["leverage", "leverag(e|es|ed|ing)", "write use"],
    ["utilize", "utili[sz](e|es|ed|ing|ation)", "write use"],
    ["facilitate", "facilitat(e|es|ed|ing)", "write help, or say what it does"],
    ["delve", "delv(e|es|ed|ing)", "write look at, or start with the content"],
    ["foster", "foster(s|ed|ing)?", "write help or encourage, or state the effect"],
    ["showcase", "showcas(e|es|ed|ing)", "write show"],
    ["underscores", "underscor(es|ed|ing) (the|how|why|that|a|an)", "write shows"],
    ["myriad", "myriad|plethora", "give the number, or write many"],
    ["pivotal", "pivotal|crucial", "say what depends on it"],
    ["tapestry", "tapestry|testament to", "say the literal thing"],
    // words that claim sincerity or ease
    ["simply", "simply", "delete the word; the step is as hard as it is"],
    ["genuinely", "genuinely|truly|honestly", "delete the word and give the evidence"],
    ["basically", "basically|obviously|of course|needless to say", "delete it; if it were obvious the reader would not be reading"],
    // filler and signposting
    ["worth noting", "(it('s| is) )?worth (noting|mentioning|pointing out)", "state the fact"],
    ["it is important to", "it('s| is) important to (note|remember|understand|know|mention)( that)?|importantly", "state the fact; use a :::warning when the reader can lose something"],
    ["in conclusion", "in (conclusion|summary)|to sum up|in a nutshell|at the end of the day", "stop when the content ends"],
    ["moreover", "moreover|furthermore", "start the sentence with its subject"],
    ["let's", "let('|’)s|dive (in|into|deeper)|deep dive", "start with the first step"],
    ["welcome to", "welcome to|look no further|say goodbye to|whether you('|’)?re|whether you are", "say what the project does"],
    ["when it comes to", "when it comes to|in the world of|in today('|’)s", "name the subject and say the fact"],
    ["a wide range of", "a (wide|broad|vast) (range|variety|array) of", "list them, or give the number"],
    ["plays a role", "plays? an? ([a-z]+ )?role", "say what it does"],
    ["take it to the next level", "to the next level|unlock the (full )?(power|potential)|harness the power", "say what the reader can now do"],
    ["due to the fact that", "due to the fact that|in the event that|at this point in time|has the ability to|for the purpose of", "write because, if, now, can, to"],
    ["feel free to", "feel free to|rest assured|i hope this|happy to help|great question|as an ai", "delete it"],
    // contrast for effect
    ["not just X but Y", "not (just|only|merely) [^.!?]{0,80}\\bbut\\b|more than just|(isn('|’)t|is not|aren('|’)t|are not) just", "describe what it is"],
    // the document talking about itself
    ["this page explains", "this (page|guide|document|section|article|tutorial|readme|chapter) (explains|describes|covers|shows|walks|will|provides|outlines|details|introduces|is about)|in this (page|guide|document|section|article|tutorial|chapter)|we('|’)ll (cover|explore|look|walk|show|see|learn)|we will (cover|explore|look|walk|show|see|learn)", "start with the content"],
  ],
  warning: [
    ["note that", "note that|please note|keep in mind that|bear in mind that", "state the fact, or use a :::note"],
    ["in order to", "in order to", "write to"],
    ["additionally", "additionally,|in addition,", "start the sentence with its subject"],
    ["is able to", "(is|are) able to", "write can"],
    ["prior to", "prior to|subsequent to", "write before or after"],
    ["easily", "easily|quickly and easily", "say how many steps or how long"],
    ["X, not Y", "[a-z]+, not (a|an|just|merely) [a-z]+", "describe what it is; compare only two real options"],
  ],
  /** A sentence with more words than this is a warning. */
  maxSentenceWords: 35,
};
