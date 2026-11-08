#!/usr/bin/env node
/**
 * Validates deployment skills (`skill/<name>/SKILL.md`) and Agent Plugin
 * packages (`plugin/<name>/plugin.json` + `plugin/<name>/skills/<skill>/SKILL.md`).
 *
 * The checks mirror the loader's blocking rules in
 * `packages/api/src/skills/deployment.ts` and
 * `packages/api/src/plugins/`. They intentionally avoid third-party packages so
 * the script runs on a host checkout and inside the API container.
 *
 * Usage:
 *   node scripts/check-skills.mjs
 *   node scripts/check-skills.mjs --root /app
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(SCRIPT_DIR, '..');

const SKILL_NAME_MAX = 64;
const DESCRIPTION_MAX = 1024;
const DESCRIPTION_MIN = 20;
const BODY_MAX = 100_000;
const FILE_PATH_MAX = 500;
const NAME_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const RELATIVE_PATH_PATTERN = /^[a-zA-Z0-9._\-/]+$/;
const RESERVED_PREFIXES = ['anthropic-', 'claude-'];
const RESERVED_WORDS = new Set([
  'help',
  'clear',
  'compact',
  'model',
  'exit',
  'quit',
  'settings',
  'anthropic',
  'claude',
]);
const ALLOWED_FRONTMATTER_KEYS = new Set([
  'name',
  'description',
  'when-to-use',
  'allowed-tools',
  'arguments',
  'argument-hint',
  'user-invocable',
  'disable-model-invocation',
  'always-apply',
  'alwaysApply',
  'model',
  'effort',
  'context',
  'agent',
  'paths',
  'shell',
  'hooks',
  'version',
  'license',
  'compatibility',
  'metadata',
  'references',
]);
const BOOLEAN_KEYS = new Set([
  'user-invocable',
  'disable-model-invocation',
  'always-apply',
  'alwaysApply',
]);
const PLUGIN_SCHEMA = 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json';
const MCP_SCHEMA = 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json';
const PLUGIN_NAME_PATTERN = /^(?!.*(?:--|\.\.))[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/;

const errors = [];
const warnings = [];
const skills = [];
const plugins = [];

function fail(file, message) {
  errors.push({ file, message });
}

function warn(file, message) {
  warnings.push({ file, message });
}

function relative(file) {
  return path.relative(ROOT, file) || '.';
}

function readText(file) {
  return fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
}

function parseFrontmatter(text) {
  const first = text.search(/\S/);
  if (first === -1) {
    return null;
  }
  const content = text.slice(first);
  if (!/^---[ \t]*\n/.test(content)) {
    return null;
  }
  const afterOpen = content.slice(content.indexOf('\n') + 1);
  const closing = /(?:^|\n)---[ \t]*(?:\n|$)/.exec(afterOpen);
  if (!closing) {
    return null;
  }
  return {
    yaml: afterOpen.slice(0, closing.index),
    body: afterOpen.slice(closing.index + closing[0].length),
  };
}

function parseScalar(raw) {
  const value = raw.trim();
  if (value === '') {
    return {};
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  if (value === 'null' || value === '~') {
    return null;
  }
  if (value.startsWith('"')) {
    try {
      return JSON.parse(value);
    } catch {
      return value.slice(1, -1);
    }
  }
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'");
  }
  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1).trim();
    if (inner === '') {
      return [];
    }
    return inner.split(',').map((entry) => {
      const item = entry.trim();
      if (item.startsWith('"') && item.endsWith('"')) {
        try {
          return JSON.parse(item);
        } catch {
          return item.slice(1, -1);
        }
      }
      if (item.startsWith("'") && item.endsWith("'")) {
        return item.slice(1, -1).replace(/''/g, "'");
      }
      return item;
    });
  }
  return value;
}

/** Parses the top-level scalar keys used by the skill contract. Nested maps are ignored. */
function parseTopLevelYaml(yaml) {
  const result = {};
  for (const line of yaml.split('\n')) {
    if (line.trim() === '' || line.trimStart().startsWith('#')) {
      continue;
    }
    if (/^\s/.test(line)) {
      continue;
    }
    const match = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line);
    if (!match) {
      continue;
    }
    result[match[1]] = parseScalar(match[2]);
  }
  return result;
}

function collectFiles(directory, root = directory, found = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      fail(relative(full), 'symlinks are not allowed in skill directories');
      continue;
    }
    if (entry.isDirectory()) {
      collectFiles(full, root, found);
      continue;
    }
    if (entry.isFile()) {
      found.push(path.relative(root, full).split(path.sep).join('/'));
    }
  }
  return found;
}

function validateRelativePath(file, relativePath) {
  if (relativePath.length > FILE_PATH_MAX) {
    fail(file, `file path exceeds ${FILE_PATH_MAX} characters: ${relativePath}`);
  }
  if (relativePath.startsWith('/') || relativePath.startsWith('\\')) {
    fail(file, `file path must be relative: ${relativePath}`);
  }
  if (!RELATIVE_PATH_PATTERN.test(relativePath)) {
    fail(file, `file path contains unsupported characters: ${relativePath}`);
  }
  if (relativePath.split('/').some((segment) => segment === '' || segment === '.' || segment === '..')) {
    fail(file, `file path contains an empty or traversal segment: ${relativePath}`);
  }
}

function validateSkill(skillFile, sourceLabel) {
  const text = readText(skillFile);
  const parsed = parseFrontmatter(text);
  if (!parsed) {
    fail(relative(skillFile), 'missing YAML frontmatter delimited by --- lines');
    return null;
  }
  const frontmatter = parseTopLevelYaml(parsed.yaml);
  const name = frontmatter.name;
  const description = frontmatter.description;
  const label = relative(skillFile);

  if (typeof name !== 'string' || name.length === 0) {
    fail(label, 'frontmatter.name is required');
  } else {
    if (name.length > SKILL_NAME_MAX) {
      fail(label, `frontmatter.name exceeds ${SKILL_NAME_MAX} characters`);
    }
    if (!NAME_PATTERN.test(name)) {
      fail(label, `frontmatter.name must be kebab-case: ${name}`);
    }
    if (RESERVED_PREFIXES.some((prefix) => name.toLowerCase().startsWith(prefix))) {
      fail(label, `frontmatter.name uses a reserved prefix: ${name}`);
    }
    if (RESERVED_WORDS.has(name.toLowerCase())) {
      fail(label, `frontmatter.name is reserved: ${name}`);
    }
  }

  if (typeof description !== 'string' || description.trim() === '') {
    fail(label, 'frontmatter.description is required');
  } else {
    if (description.length > DESCRIPTION_MAX) {
      fail(label, `frontmatter.description exceeds ${DESCRIPTION_MAX} characters`);
    }
    if (description.trim().length < DESCRIPTION_MIN) {
      warn(label, `frontmatter.description is shorter than ${DESCRIPTION_MIN} characters`);
    }
  }

  if (text.length > BODY_MAX) {
    fail(label, `SKILL.md exceeds ${BODY_MAX} characters`);
  }

  for (const [key, value] of Object.entries(frontmatter)) {
    if (!ALLOWED_FRONTMATTER_KEYS.has(key)) {
      warn(label, `unknown frontmatter key "${key}" (the loader keeps it but warns)`);
    }
    if (BOOLEAN_KEYS.has(key) && typeof value !== 'boolean') {
      fail(label, `frontmatter.${key} must be a boolean`);
    }
  }

  const allowedTools = frontmatter['allowed-tools'];
  if (
    allowedTools !== undefined &&
    typeof allowedTools !== 'string' &&
    !(Array.isArray(allowedTools) && allowedTools.every((entry) => typeof entry === 'string'))
  ) {
    fail(label, 'frontmatter.allowed-tools must be a string or an array of strings');
  }

  const files = collectFiles(path.dirname(skillFile)).filter((file) => file !== 'SKILL.md');
  for (const file of files) {
    validateRelativePath(label, file);
  }

  const referenced = new Set();
  const referencePattern = /\b(?:scripts|templates|references|assets)\/[A-Za-z0-9._/-]+/g;
  for (const match of text.matchAll(referencePattern)) {
    const candidate = match[0].replace(/[.,;:)]+$/, '');
    referenced.add(candidate);
  }
  for (const reference of referenced) {
    const local = path.join(path.dirname(skillFile), reference);
    const repository = path.join(ROOT, reference);
    if (!fs.existsSync(local) && !fs.existsSync(repository)) {
      warn(label, `referenced file does not exist: ${reference}`);
    }
  }

  if (typeof name === 'string' && name.length > 0) {
    skills.push({
      name,
      description: typeof description === 'string' ? description : '',
      file: skillFile,
      source: sourceLabel,
      files,
    });
  }
  return { name, description, frontmatter, files };
}

function validatePlugin(pluginDir) {
  const manifestPath = path.join(pluginDir, 'plugin.json');
  const label = relative(manifestPath);
  if (!fs.existsSync(manifestPath)) {
    fail(relative(pluginDir), 'plugin.json is missing');
    return;
  }
  let manifest;
  try {
    manifest = JSON.parse(readText(manifestPath));
  } catch (error) {
    fail(label, `plugin.json is not valid JSON: ${error.message}`);
    return;
  }
  if (manifest === null || typeof manifest !== 'object' || Array.isArray(manifest)) {
    fail(label, 'plugin.json must contain a top-level object');
    return;
  }
  if (manifest.$schema !== PLUGIN_SCHEMA) {
    fail(label, `plugin.json $schema must be ${PLUGIN_SCHEMA}`);
  }
  if (typeof manifest.name !== 'string' || manifest.name.length === 0) {
    fail(label, 'plugin.json name is required');
  } else {
    if (manifest.name.length > 64) {
      fail(label, 'plugin.json name exceeds 64 characters');
    }
    if (!PLUGIN_NAME_PATTERN.test(manifest.name)) {
      fail(label, `plugin.json name is invalid: ${manifest.name}`);
    }
  }
  if (manifest.version !== undefined && typeof manifest.version !== 'string') {
    fail(label, 'plugin.json version must be a string when present');
  }
  if (manifest.description !== undefined && typeof manifest.description !== 'string') {
    fail(label, 'plugin.json description must be a string when present');
  }
  if (manifest.keywords !== undefined) {
    if (!Array.isArray(manifest.keywords) || !manifest.keywords.every((entry) => typeof entry === 'string')) {
      fail(label, 'plugin.json keywords must be an array of strings when present');
    }
  }
  if (manifest.author !== undefined) {
    if (manifest.author === null || typeof manifest.author !== 'object' || Array.isArray(manifest.author)) {
      fail(label, 'plugin.json author must be an object when present');
    } else {
      for (const key of ['name', 'email', 'url']) {
        if (manifest.author[key] !== undefined && typeof manifest.author[key] !== 'string') {
          fail(label, `plugin.json author.${key} must be a string when present`);
        }
      }
    }
  }

  const skillsDir = path.join(pluginDir, 'skills');
  if (!fs.existsSync(skillsDir)) {
    warn(relative(pluginDir), 'plugin has no skills/ directory');
  } else {
    let count = 0;
    for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }
      const skillFile = path.join(skillsDir, entry.name, 'SKILL.md');
      if (!fs.existsSync(skillFile)) {
        continue;
      }
      count += 1;
      validateSkill(skillFile, `plugin:${manifest.name}`);
    }
    if (count === 0) {
      warn(relative(pluginDir), 'plugin has no loadable skills');
    }
  }

  const mcpPath = path.join(pluginDir, 'mcp.json');
  if (fs.existsSync(mcpPath)) {
    let mcp;
    try {
      mcp = JSON.parse(readText(mcpPath));
    } catch (error) {
      fail(relative(mcpPath), `mcp.json is not valid JSON: ${error.message}`);
      mcp = null;
    }
    if (mcp !== null) {
      if (mcp.$schema !== MCP_SCHEMA) {
        fail(relative(mcpPath), `mcp.json $schema must be ${MCP_SCHEMA}`);
      }
      if (mcp.mcpServers === null || typeof mcp.mcpServers !== 'object' || Array.isArray(mcp.mcpServers)) {
        fail(relative(mcpPath), 'mcp.json mcpServers must be an object');
      } else {
        for (const [serverName, server] of Object.entries(mcp.mcpServers)) {
          if (server === null || typeof server !== 'object' || Array.isArray(server)) {
            fail(relative(mcpPath), `mcpServers.${serverName} must be an object`);
            continue;
          }
          if (!['stdio', 'streamable-http', 'sse'].includes(server.type)) {
            fail(relative(mcpPath), `mcpServers.${serverName}.type is unsupported`);
          }
        }
      }
    }
  }

  plugins.push({ name: manifest.name, dir: pluginDir });
}

function main() {
  const args = process.argv.slice(2);
  const rootIndex = args.indexOf('--root');
  ROOT = rootIndex >= 0 ? path.resolve(args[rootIndex + 1]) : DEFAULT_ROOT;

  const skillRoot = path.join(ROOT, 'skill');
  if (fs.existsSync(skillRoot)) {
    for (const entry of fs.readdirSync(skillRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }
      const skillFile = path.join(skillRoot, entry.name, 'SKILL.md');
      if (fs.existsSync(skillFile)) {
        validateSkill(skillFile, 'deployment');
      }
    }
  } else {
    warn(relative(skillRoot), 'deployment skill directory does not exist');
  }

  const pluginRoot = path.join(ROOT, 'plugin');
  if (fs.existsSync(pluginRoot)) {
    for (const entry of fs.readdirSync(pluginRoot, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        validatePlugin(path.join(pluginRoot, entry.name));
      }
    }
  } else {
    warn(relative(pluginRoot), 'plugin directory does not exist');
  }

  const names = new Map();
  for (const skill of skills) {
    const previous = names.get(skill.name);
    if (previous) {
      fail(relative(skill.file), `duplicate skill name "${skill.name}" also used by ${relative(previous.file)}`);
    } else {
      names.set(skill.name, skill);
    }
  }
  const pluginNames = new Map();
  for (const plugin of plugins) {
    const previous = pluginNames.get(plugin.name);
    if (previous) {
      fail(relative(plugin.dir), `duplicate plugin name "${plugin.name}" also used by ${relative(previous.dir)}`);
    } else {
      pluginNames.set(plugin.name, plugin);
    }
  }

  const bySource = skills.reduce((counts, skill) => {
    counts[skill.source] = (counts[skill.source] ?? 0) + 1;
    return counts;
  }, {});

  console.log('SEMAR-GPT skill check');
  console.log(`  root: ${ROOT}`);
  console.log(`  skills: ${skills.length} (${Object.entries(bySource).map(([key, value]) => `${key}=${value}`).join(', ') || 'none'})`);
  console.log(`  plugins: ${plugins.length}`);
  for (const skill of skills) {
    console.log(`    - ${skill.name} [${skill.source}] ${skill.files.length} file(s)`);
  }
  for (const warning of warnings) {
    console.log(`  warning: ${warning.file}: ${warning.message}`);
  }
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`  error: ${error.file}: ${error.message}`);
    }
    console.error(`\n${errors.length} error(s), ${warnings.length} warning(s)`);
    process.exitCode = 1;
    return;
  }
  console.log(`\nOK: ${skills.length} skill(s), ${plugins.length} plugin(s), ${warnings.length} warning(s)`);
}

let ROOT = DEFAULT_ROOT;
main();
