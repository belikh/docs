# Voice

How every page, README, release note and error message for a jupiter.au project is worded. Read it before you write prose, and run the check at the end before you finish.

The standard: a reader who has never seen the project finds the answer on the first screen, understands every sentence on the first read, and can act on it without asking anyone.

## The reader

Write for one person: a capable developer or user who is busy, is partway through a task, and arrived from a search or a link. They read the title, the first sentence and the first code block. Many read in their second language or through a translator. Everything below follows from that.

## Ten rules

1. **Answer first.** The first sentence says what the thing is or what the reader gets. Background comes after the answer, or not at all.
2. **One idea per sentence.** Keep most sentences under 25 words. A sentence with a second "and" or a third comma becomes two sentences.
3. **Say "you" and use the present tense.** "You set the port in `config.yaml`." "The server restarts." Steps are commands: "Run `npm test`."
4. **Name the actor.** "The importer skips private repositories" tells the reader what does the work. "Private repositories are skipped" hides it.
5. **Use the short word.** Use, help, show, start, end, before, after, can, because, about, so.
6. **State facts a reader can check.** Numbers, names, defaults, limits, file paths, exact error text. A sentence with no checkable fact is deleted.
7. **One name for one thing.** Choose the term once (in the glossary when the project has one) and keep it. Two names make a reader look for two things.
8. **Put the condition first.** "To change the port, edit `config.yaml`." "If the build fails, run `npm ci`." The reader learns whether the sentence applies before they read the instruction.
9. **Show it.** Every task has a command or an example that can be pasted and run, with the output it prints. Every option is in a table with its type and default.
10. **Stop.** No summary of what was just said, no closing line, no offer of further help. The page ends when the content ends.

## Rewrites

Bad examples are in code style so the check leaves them alone.

| Instead of | Write |
| --- | --- |
| `Welcome to Aquila! This guide will walk you through the installation process.` | Install Aquila with `nix run github:belikh/aquila`. |
| `Aquila is a powerful, robust fleet manager that seamlessly integrates with your hosts.` | Aquila deploys NixOS configurations to hosts over SSH and rolls back a host that fails its health check. |
| `In order to utilize the API, it is important to note that a token is required.` | The API needs a token. Create one with `aquila token new`. |
| `It's not just a dashboard, it's your command centre.` | The dashboard lists every host with its last deploy and its health. |
| `Simply run the command and you're all set!` | Run `aquila deploy`. It prints `deployed 12 hosts` when it finishes. |
| `Errors may occasionally be encountered when the configuration is invalid.` | An invalid configuration stops the deploy with `error: option 'services.foo' does not exist`. |
| `The cache can be leveraged to significantly improve performance.` | The cache cuts a rebuild from 90 seconds to 8. |
| `Fast. Simple. Yours.` | Builds in 8 seconds, has one config file and runs on your own hosts. |

## What reads as machine-written

A reader who meets these stops trusting the text around them. Each one has a literal replacement.

- **Praise in place of a fact:** `powerful`, `robust`, `seamless`, `elegant`, `effortless`, `delightful`, `stunning`, `vibrant`, `cutting-edge`, `revolutionary`, `blazing fast`. Say what it does, what it survives and how long it takes.
- **Business verbs:** `supercharge`, `streamline`, `empower`, `showcase`, `foster`, `delve`, `underscores`, `holistic`, `take it to the next level`. Say what changes for the reader.
- **Weight without content:** `pivotal`, `myriad`, `tapestry`, `plays a role`, `when it comes to`. Say what depends on the thing, give the number, name the subject.
- **Sincerity and ease words:** `simply`, `genuinely`, `truly`, `honestly`, `easily`, `basically`, `obviously`. Delete the word. If the claim then looks weak, add the evidence.
- **Contrast for effect:** `X, not Y`, `not just X but Y`, `more than just`. Describe what the thing is. Compare only when the reader must choose between two real options, and then describe each option on its own.
- **Signposting:** `worth noting`, `it is important to`, `note that`, `in conclusion`, `moreover`, `furthermore`, `additionally`, `let's`. Start the sentence with its subject.
- **The document describing itself:** `this page explains`, `in this guide`, `we'll cover`. Start with the content.
- **Rhythm tricks:** three adjectives in a row, three one-word sentences, a one-line paragraph for drama, a question the next sentence answers.
- **A trailing comment on the sentence:** "..., ensuring a smooth experience", "..., making it ideal for teams". End the sentence at the fact.
- **Hedging stacked on hedging:** "may potentially", "can sometimes possibly". State what happens and when.
- **The em dash.** Use a comma, a colon, a full stop or parentheses.
- **Emoji and exclamation marks.**
- **Openers and closers:** `welcome to`, `great question`, `feel free to`, a last line that offers more help.

## What makes text hard to read

- **Stacked clauses.** A sentence that needs to be read twice has too many parts. Split it at "which", "while" and "and".
- **Nouns made from verbs.** "Perform the installation of" is "install". "Make a decision" is "decide". "Provides validation of" is "validates".
- **Long words where a short one exists:** `utilize` (use), `leverage` (use), `facilitate` (help), `prior to` (before), `in order to` (to), `is able to` (can), `due to the fact that` (because), `a wide range of` (many, or the number).
- **Undefined terms and unexplained abbreviations.** Define a term where it first appears, or link it with `[[term:Name]]`.
- **Pronouns far from their noun.** If "it" or "this" could mean two things, repeat the noun.
- **A wall of prose for a list.** Steps are a numbered list. Options are a table. Three or more parallel items are a bullet list.
- **A paragraph with more than one job.** One paragraph explains one thing, in two to five sentences.

## Headings, links and errors

- Headings are nouns or short verb phrases in sentence case: "Install", "Configuration", "Change a token". A reader scans them to find the task.
- Link text names the target: "see [Configure a host]" works out of context; "click here" does not.
- Quote an error exactly, in code style, then give its cause and its fix in that order.
- A warning says what the reader can lose and how to avoid it. Use `:::warning` only for that.

## The check

```sh title="Check the wording"
npx jupiter-docs check                       # the pages in docs-src, with every other check
npx jupiter-docs voice README.rst CHANGELOG.md   # any other Markdown or .rst file
```

The check reads prose only. Code blocks, inline code and block quotes are left out, so a quoted phrase, a film title or an API's own error string stays as given: put it in code style or a block quote.

| Finding | Level |
| --- | --- |
| A word or phrase from the lists above, an em dash, an emoji | Error: the check fails. |
| `note that`, `in order to`, `additionally`, `is able to`, `prior to`, `easily`, `X, not Y`, an exclamation mark, three one-word sentences, a sentence over 35 words | Warning: printed; `--strict` makes it fail. |

The full word list is `VOICE` in `packages/docs/src/spec.mjs` of `belikh/docs`. Fix the sentence when the check flags a word: replacing `robust` with a synonym keeps the empty claim, so state the fact the word stood for.

The check finds patterns. It cannot tell whether a page answers the reader's question. Finish by reading the page as someone who has never seen the project, and confirm they can do the task from the first screen.
