// Load config + pages and run validation: the shared first step of every command.
import { existsSync } from "node:fs";
import { loadConfig } from "./config.mjs";
import { loadPages } from "./source.mjs";
import { checkProject } from "./check.mjs";

export function loadProject(configFile) {
  const { config, root, errors } = loadConfig(configFile);
  if (!config) return { errors, warnings: [] };
  if (!existsSync(`${root}/${config.src}`)) return { errors: [...errors, `${config.src}: source folder not found (run: jupiter-docs init)`], warnings: [] };
  // An imported project with errors is left out and reported as a warning, so one project's bad release does not stop the site.
  // Errors in the pages of this repository stay errors.
  const skip = new Set(); const left = [];
  for (;;) {
    const { pages, projects } = loadPages(root, config, skip);
    const res = checkProject({ config, root, pages, projects });
    const bad = projects.filter((pr) => !pr.local && res.errors.some((e) => ownedBy(config, pr, e)));
    if (!bad.length) return { config, root, pages, projects, nav: projects[0].nav, glossaryPage: projects[0].glossaryPage, errors: [...errors, ...res.errors], warnings: [...left, ...res.warnings] };
    for (const pr of bad) {
      const own = res.errors.filter((e) => ownedBy(config, pr, e)); skip.add(pr.id);
      left.push(`project "${pr.id}" (${pr.repo || "local"} ${pr.ref ?? ""}) is left out of the site: ${own.length} error(s)`, ...own);
    }
  }
}
export const importedPrefix = (config, pr) => `${config.src}/_imported/${pr.id}`;
const ownedBy = (config, pr, e) => e.startsWith(`${importedPrefix(config, pr)}/`) || e.startsWith(`${importedPrefix(config, pr)}:`);
