// prepack for packages/docs: npm only packs files inside the package folder, so copy the LaTeX class and the agent skill in.
import { cpSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root = join(dirname(fileURLToPath(import.meta.url)), ".."); const pkg = join(root, "packages/docs");
for (const d of ["latex", "skill"]) { mkdirSync(join(pkg, d), { recursive: true }); cpSync(join(root, d), join(pkg, d), { recursive: true }); }
