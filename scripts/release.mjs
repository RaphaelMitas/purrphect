#!/usr/bin/env node
// Usage: pnpm release [patch|minor|major|x.y.z] [--dry-run]
// Opens an auto-merging version bump PR; .github/workflows/release.yml takes over on main.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const appJson = fileURLToPath(new URL("../apps/dart/app.json", import.meta.url));
const run = (cmd, args) => execFileSync(cmd, args, { cwd: root, encoding: "utf8" }).trim();
const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const bump = args.find((a) => !a.startsWith("--")) ?? "patch";

run("git", ["fetch", "origin", "main"]);
if (run("git", ["status", "--porcelain"]) !== "") fail("Working tree is not clean.");
if (run("git", ["rev-parse", "HEAD"]) !== run("git", ["rev-parse", "origin/main"])) {
  fail("Releases start from an up-to-date main.");
}

const source = readFileSync(appJson, "utf8");
const current = JSON.parse(source).expo.version;
const [major, minor, patch] = current.split(".").map(Number);
const next =
  { major: `${major + 1}.0.0`, minor: `${major}.${minor + 1}.0`, patch: `${major}.${minor}.${patch + 1}` }[bump] ??
  bump;
if (!/^\d+\.\d+\.\d+$/.test(next)) fail(`Expected patch, minor, major or x.y.z, got "${bump}".`);
const [to, from] = [next, current].map((v) => v.split(".").map(Number));
const differs = to.findIndex((n, i) => n !== from[i]);
if (differs === -1 || to[differs] < from[differs]) fail(`v${next} is not newer than v${current}.`);
if (run("git", ["ls-remote", "--tags", "origin", `refs/tags/v${next}`]) !== "") fail(`v${next} is already tagged.`);

console.log(`Releasing v${next} (from v${current})`);
if (dryRun) process.exit(0);

// A text edit keeps app.json formatted the way Biome wants it.
writeFileSync(appJson, source.replace(`"version": "${current}"`, `"version": "${next}"`));
const branch = `release/v${next}`;
run("git", ["switch", "-c", branch]);
try {
  run("git", ["commit", "-am", `Release v${next}`]);
  run("git", ["push", "-u", "origin", branch]);
  console.log(
    run("gh", [
      "pr",
      "create",
      "--title",
      `Release v${next}`,
      "--body",
      `Bumps Dart Purrphect to v${next}. On merge, the Release workflow builds and submits through EAS, tags it, and refreshes the store screenshots.`,
    ]),
  );
  run("gh", ["pr", "merge", "--auto", "--squash"]);
} finally {
  run("git", ["switch", "main"]);
}
