/**
 * Custom semantic-release plugin that updates CHANGELOG.md using
 * Keep a Changelog format (https://keepachangelog.com).
 *
 * Maps conventional commit types to Keep a Changelog sections:
 *   feat       → Added
 *   fix        → Fixed
 *   perf       → Changed
 *   refactor   → Changed
 *   revert     → Removed
 *   docs       → Changed (only if they affect the site)
 *   style      → Changed
 *   chore/ci   → omitted (internal)
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const SECTION_ORDER = ["Added", "Changed", "Deprecated", "Removed", "Fixed", "Security"];

const TYPE_TO_SECTION = {
  feat: "Added",
  fix: "Fixed",
  perf: "Changed",
  refactor: "Changed",
  revert: "Removed",
  docs: "Changed",
  style: "Changed",
  test: null, // omit
  build: null, // omit
  ci: null, // omit
  chore: null, // omit
};

const HEADER = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).`;

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Extract Keep a Changelog section content from existing body.
 * Returns a Map<sectionName, string[]> of bullet lines.
 */
function parseSections(body) {
  const sections = new Map();
  let current = null;
  for (const line of body.split("\n")) {
    const heading = line.match(/^### (.+)$/);
    if (heading) {
      current = heading[1].trim();
      if (!sections.has(current)) sections.set(current, []);
      continue;
    }
    if (current && line.startsWith("- ")) {
      sections.get(current).push(line);
    }
  }
  return sections;
}

/**
 * Build the new version block in Keep a Changelog format.
 */
function buildVersionBlock(version, date, commits) {
  const sections = new Map();

  for (const { type, subject } of commits) {
    const section = TYPE_TO_SECTION[type];
    if (!section) continue;
    if (!sections.has(section)) sections.set(section, []);
    sections.get(section).push(`- ${subject}`);
  }

  if (sections.size === 0) return null;

  const lines = [`## [${version}] ${date}`, ""];
  for (const name of SECTION_ORDER) {
    const bullets = sections.get(name);
    if (!bullets) continue;
    lines.push(`### ${name}`, "");
    lines.push(...bullets);
    lines.push("");
  }
  return lines.join("\n");
}

export async function verifyConditions() {
  // Nothing to verify
}

/**
 * Read the existing changelog, extract old entries (everything below the header),
 * prepend the new version block, and write it back.
 */
export async function prepare(pluginConfig, context) {
  const { cwd, nextRelease, commits, logger } = context;
  const changelogFile = pluginConfig.changelogFile || "CHANGELOG.md";
  const filePath = resolve(cwd, changelogFile);

  let oldBody = "";
  if (existsSync(filePath)) {
    const raw = readFileSync(filePath, "utf8");
    // Strip the header block to get just the version entries
    oldBody = raw.replace(new RegExp(`^${escapeRegExp(HEADER)}\\s*`), "").trim();
  }

  const date = new Date().toISOString().slice(0, 10);
  const block = buildVersionBlock(nextRelease.version, date, commits);

  if (!block) {
    logger.log("No relevant commits for changelog, skipping %s", changelogFile);
    return;
  }

  const content = oldBody ? `${HEADER}\n\n${block}\n${oldBody}\n` : `${HEADER}\n\n${block}\n`;

  writeFileSync(filePath, content);
  logger.log("Updated %s with version %s", changelogFile, nextRelease.version);
}
