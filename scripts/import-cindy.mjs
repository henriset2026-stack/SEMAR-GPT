#!/usr/bin/env node
/**
 * Imports the Cindy bot packages into LibreChat Agent Plugins.
 *
 * Cindy ships ten bot packages under
 * `apps/desktop/resources/bot-packages/<package>/<version>/`. Each package has
 * three skills (getting-started, ops, evidence), helper scripts/templates, and
 * a method note. This script maps one package to one Agent Plugin under
 * `plugin/<package>/`, preserving the three-skill grouping.
 *
 * Usage:
 *   node scripts/import-cindy.mjs --source /path/to/cindy-main
 *   node scripts/import-cindy.mjs --source /path/to/cindy-main --force
 *
 * The import is intentionally one-way. Edit the generated files for SEMAR-GPT
 * changes; rerun only when intentionally refreshing from a Cindy checkout.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, '..');
const BOT_PACKAGES = 'apps/desktop/resources/bot-packages';
const PLUGIN_SCHEMA = 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json';
const CINDY_REPOSITORY = 'https://github.com/makecindy/cindy';

const PACKAGES = {
  'ad-spend-watch': {
    role: 'ad spend monitoring',
    short: 'Ad spend monitoring',
    description:
      'Monitor paid ad spend from user-supplied reports, compare it with user-defined thresholds, and produce budget-pacing advice without touching ad accounts.',
  },
  'apple-search-ads-review': {
    role: 'Apple Search Ads review',
    short: 'Apple Search Ads review',
    description:
      'Review exported Apple Search Ads data against cost-per-install targets and produce a change list the user can apply in the ad console.',
  },
  cooper: {
    role: 'research signals',
    short: 'Research signals',
    description:
      'Research public topics and sources selected by the user, with threshold alerts and evidence-backed briefs.',
  },
  'engineer-bot': {
    role: 'engineering delivery',
    short: 'Engineering delivery',
    description:
      'Follow engineering work from scope and implementation to reviewable delivery, with evidence tied to the current revision.',
  },
  'nightly-audit-engineer': {
    role: 'code audit',
    short: 'Code audit',
    description:
      'Audit code quality within an entrusted scope, preserving evidence and deduplication clues; fixes stay separately authorized.',
  },
  'proto-bot': {
    role: 'prototype development',
    short: 'Prototype development',
    description:
      'Prepare UI prototypes, changes, and review evidence by reusing the existing application structure.',
  },
  'sable-game-art': {
    role: 'game art direction',
    short: 'Game art direction',
    description:
      'Game art direction: style guides, hex palettes, sprite and tile specs, image prompts, and consistency checks for supplied art.',
  },
  'seo-aeo-desk': {
    role: 'SEO/AEO topic planning',
    short: 'SEO/AEO topic planning',
    description:
      'Turn keywords, user questions, and site material into topic boards, writer briefs, search reports, and page-refresh plans.',
  },
  'startup-qa-bot': {
    role: 'product QA',
    short: 'Product QA',
    description:
      'Walk through a product in an isolated test environment and maintain a page map, change log, and regression checklist.',
  },
  'video-editor': {
    role: 'video editing',
    short: 'Video editing',
    description:
      'Organize footage, edit plans, and delivery checks for short vertical talking-head videos without installing private tools or auto-publishing.',
  },
};

const OPS_DESCRIPTIONS = {
  'ad-spend-watch-ops':
    "Monitor the user's paid ads: turn supplied reports into a ledger, check spend and performance against user-defined thresholds, diagnose breaches with one concrete change, and review budget pacing. Adapted from Cindy; advice only, with no pausing campaigns or changing budgets.",
  'apple-search-ads-review-ops':
    "Review exported Apple Search Ads data (campaigns, ad groups, keywords, search terms) against the user's cost-per-install targets; recommend negatives, exact-match terms, bids, and budgets as a change list the user can apply in the ad console. Adapted from Cindy; no ad-account connection.",
  'cooper-ops':
    'Produce research briefs and threshold alerts on public topics and sources the user selects, delivered in SEMAR-GPT. Not a migration of the original Cooper persona or its Slack setup.',
  'engineer-bot-ops':
    "Follow engineering work from scope and implementation to reviewable delivery. Adapted from Cindy's task and Git workflows; does not port its cloud agent or document-platform setup.",
  'nightly-audit-engineer-ops':
    'Audit code quality within an entrusted scope, preserving evidence and deduplication clues; fixes and pull requests only after separate authorization.',
  'proto-bot-ops':
    'Prepare UI prototypes, changes, and review evidence by reusing the existing app structure; choose external design and asset capabilities based on actual dependencies.',
  'sable-game-art-ops':
    'Provide game art direction: a style guide, hex palette, sprite and tile specs, prompts ready for an image tool, plus palette/canvas/grid consistency checks and a slicing plan for user-supplied art. Adapted from Cindy; no logos or generic image generation.',
  'seo-aeo-desk-ops':
    'Turn keywords, user questions, and site material into a prioritized topic board, writer-ready briefs, weekly search reports, an AI-answer question map, and a page-refresh plan. Adapted from Cindy; does not write final articles or publish.',
  'startup-qa-bot-ops':
    'Walk through a product in an explicitly isolated test environment, maintaining a page map, changes, and a regression checklist; before test-identity isolation is verified, accept material for offline analysis only.',
  'video-editor-ops':
    'Organize footage, an edit plan, and delivery checks for short vertical talking-head videos; use only approved tools already available in the environment, otherwise deliver the plan and gaps; no private tool installation or auto-publishing.',
};

const EVIDENCE_DESCRIPTIONS = {
  'ad-spend-watch-evidence':
    'Apply user-defined thresholds and minimum-sample rules to supplied ad ledger rows and list breaches; keep missing values unknown, with no network access, estimates, or ad-account changes.',
  'apple-search-ads-review-evidence':
    'Aggregate supplied Apple Search Ads search-term data by ad group against the cost-per-install target, merge duplicate terms, and list negative and exact-match candidates; keep gaps unknown, with no network access, estimates, or ad-account changes.',
  'cooper-evidence':
    'Deduplicate explicit URLs and separate confirmed from proposed seen watermarks; do not fetch pages, send messages, or judge importance.',
  'engineer-bot-evidence':
    'Check whether the checks and evidence in a delivery ledger belong to the current version; do not call Git, CI, or the network.',
  'nightly-audit-engineer-evidence':
    'Generate stable exact fingerprints for evidenced findings and mark in-batch duplicates and previously seen items; do not infer fixes.',
  'proto-bot-evidence':
    "Check evidence coverage for the current version's acceptance items and required theme modes; do not render pages or claim visual inspection.",
  'sable-game-art-evidence':
    'Audit supplied PNGs (base64) for off-palette colors, semi-transparent fringes, canvas size, grid divisibility, and empty frames, and compute a slicing plan; audit and plan only, without modifying images or using the network.',
  'seo-aeo-desk-evidence':
    'Normalize, deduplicate, and group supplied keywords and questions by intent; keep missing metrics unknown, with no network access or search-volume estimates.',
  'startup-qa-bot-evidence':
    'Compare differences and status across an explicitly supplied list of pages from the same environment; do not open a browser.',
  'video-editor-evidence':
    "Check an original edit plan's timeline, asset references, and rights declarations, and output continuous frame ranges; do not process media or render.",
};

const REPLACEMENTS = [
  ['这是独立原创操作规程，不是原作者配置。', '这是改编自 Cindy 的独立操作规程，不是原作者配置。'],
  ['你是一位持续协作的原创 Cindy 伙伴，', '你是一位持续协作的 SEMAR-GPT 伙伴，'],
  [
    '日程须用户明确选择来源、时区、频率和启用，不用后台循环替代现有 scheduler。',
    '定时任务须用户明确选择来源、时区、频率和启用，使用 SEMAR-GPT 的 Schedules 功能，不用后台循环替代。',
  ],
  ['Cindy 对话', 'SEMAR-GPT 对话'],
  ['在Cindy交付', '在 SEMAR-GPT 交付'],
  ['Cindy 里送达', 'SEMAR-GPT 里送达'],
  ['Cindy 现有任务与 Git 工具', 'SEMAR-GPT 的任务与 Git 工具'],
  ['本机已有的 CLI 和现有工具', '当前环境可用的工具'],
  ['用本机已有的工具', '使用当前环境可用的工具'],
  ['本机已有且获准使用的工具', '当前环境已有且获准使用的工具'],
  [
    '宿主已经在对话里放出开场问候和下面的起步选项，用户看到的就是这些；他的第一条回复是选定的方向，或直接给出的任务。',
    '对话开始时，你先给出简短问候和下面的起步选项；用户的第一条回复就是选定的方向，或直接给出的任务。',
  ],
  ['还缺关键信息时，一次只问一件事，可以用宿主的提问卡。', '还缺关键信息时，一次只问一个关键问题。'],
  ['可以用宿主的提问卡', '一次只问一个关键问题'],
  ['按宿主实际保存结果为准', '以 SEMAR-GPT 记忆功能的实际保存结果为准'],
  ['以宿主实际保存结果为准', '以 SEMAR-GPT 记忆功能的实际保存结果为准'],
  ['## 起步选项（开场时由宿主展示）', '## 起步选项（对话开始时由你展示）'],
  [
    '发现、安装和连接插件，按宿主伙伴指南（teammate-guide）里的插件规则办；需要新插件或需要连接时，先征得用户同意；当前环境没有合适工具时，用本机已有的工具，或请用户粘贴材料。',
    '如需新的 MCP 服务器、Agent Plugin 或外部连接，先说明用途并征得用户同意；由管理员在 SEMAR-GPT 中配置。当前环境没有合适工具时，请用户粘贴材料或改用现有工具，不要声称已经安装或连接。',
  ],
  [
    '按宿主伙伴指南（teammate-guide）里的插件规则办；需要新插件或需要连接时，先征得用户同意；当前环境没有合适工具时，使用当前环境可用的工具，或请用户粘贴材料。',
    '如需新的 MCP 服务器、Agent Plugin 或外部连接，先说明用途并征得用户同意；由管理员在 SEMAR-GPT 中配置。当前环境没有合适工具时，请用户粘贴材料或改用现有工具，不要声称已经安装或连接。',
  ],
  ['标出未运行的宿主/集成测试', '标出未运行的应用/集成测试'],
  ['用宿主的例行任务创建', '使用 SEMAR-GPT 的 Schedules 创建'],
  ['本机已有且获准使用的视频工具', '当前环境已有且获准使用的视频工具'],
  ['Art素材只经实时能力与用户授权生成', '图像素材只经当前环境已有的图像生成能力与用户授权生成'],
  ['出图与设计（例如 OpenDesign、Art）', '出图与设计工具'],
  ['出图与设计（例如 Art）', '出图与设计工具'],
  ['按授权用设计工具（如 OpenDesign）做稿', '按授权用当前环境已有的设计工具做稿'],
  ['资源生成优先Art的实时能力', '资源生成优先使用当前环境可用的图像生成能力'],
  ['用户同意使用 Art 插件时', '用户同意使用图像生成工具时'],
  ['真正切图和打包用用户机器上现有的工具', '真正切图和打包用当前环境已有且获准使用的工具'],
  ['本地ffprobe只在工具实际存在且获准读取所选文件时用', 'ffprobe 只在当前环境实际存在且获准读取所选文件时用'],
  ['先查记忆（只查记忆，不查插件、不读任何来源）', '先查 SEMAR-GPT 记忆（只查记忆，不查插件、不读任何来源）'],
  [
    '用户要求对已提供数据做本地处理时，先检查脚本，再从stdin传JSON运行：',
    '用户要求对已提供数据做离线处理时，先检查脚本；如果当前环境可以运行 Python，再从 stdin 传 JSON：',
  ],
  [
    '安装与打包不会执行它。',
    '安装、打包和技能加载都不会执行它。如果当前环境不能运行 Python，按 templates/contract.md 手工核对，并在结果中注明脚本未执行。',
  ],
  [
    'X 上的讨论用用户已有的 X 搜索工具（例如 X Manager，只搜索、不发帖）',
    'X 上的讨论用可用的网页检索或浏览器只读查看，不发帖',
  ],
  ['X 搜索（例如 X Manager）', '网页检索或浏览器'],
  ['文档与知识库（例如 Notion）', '文档与知识库工具'],
  ['Notion 页面或云盘文件夹', '文档或云盘文件夹'],
  ['不移植其云端代理或 Notion 设置', '不移植其云端代理或文档平台设置'],
  ['不向Slack外发', '不向外部消息平台发送'],
];

function parseArgs(argv) {
  const args = { source: process.env.CINDY_SOURCE ?? '', force: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--source') {
      args.source = path.resolve(argv[i + 1] ?? '');
      i += 1;
    } else if (arg === '--force') {
      args.force = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log('Usage: node scripts/import-cindy.mjs --source /path/to/cindy-main [--force]');
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!args.source) {
    throw new Error(
      'Missing Cindy checkout. Pass --source /path/to/cindy-main or set CINDY_SOURCE.',
    );
  }
  return args;
}

function splitFrontmatter(text) {
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const match = /^---[ \t]*\n([\s\S]*?)\n---[ \t]*\n?/.exec(normalized);
  if (!match) {
    throw new Error('SKILL.md has no frontmatter');
  }
  return { yaml: match[1], body: normalized.slice(match[0].length) };
}

function readSourceName(yaml) {
  const match = /^name:\s*(.+)$/m.exec(yaml);
  if (!match) {
    throw new Error('SKILL.md has no name');
  }
  return match[1].trim();
}

function descriptionFor(skillName, packageId) {
  if (skillName.endsWith('-getting-started')) {
    const role = PACKAGES[packageId].role;
    return `First-run setup for the ${role} partner: learn the user's needs, fill essential gaps, and deliver a first result. Use at the start of a new partnership or when no preferences are stored yet.`;
  }
  if (skillName.endsWith('-ops')) {
    return OPS_DESCRIPTIONS[skillName];
  }
  if (skillName.endsWith('-evidence')) {
    return EVIDENCE_DESCRIPTIONS[skillName];
  }
  throw new Error(`No description mapping for ${skillName}`);
}

function adaptBody(body, skillName) {
  let next = body;
  for (const [from, to] of REPLACEMENTS) {
    next = next.split(from).join(to);
  }

  const note =
    '> Adapted from Cindy for SEMAR-GPT. Use only tools that exist in the current environment, never claim a tool ran when it did not, and reply in the user\'s current language.\n';
  if (/^# .+\n/.test(next)) {
    next = next.replace(/^(# .+\n)/, `$1\n${note}\n`);
  } else {
    next = `${note}\n${next}`;
  }

  if (skillName.endsWith('-ops') && next.includes('## 输出与持续协作')) {
    next = next.replace('## 输出与持续协作', '通用方法参考见 references/method.md。\n\n## 输出与持续协作');
  }
  return next;
}

function writeSkill({ sourceFile, destination, packageId, version, skillName }) {
  const { yaml, body } = splitFrontmatter(fs.readFileSync(sourceFile, 'utf8'));
  const sourceName = readSourceName(yaml);
  if (sourceName !== skillName) {
    throw new Error(`Skill name mismatch: ${sourceFile} says ${sourceName}, expected ${skillName}`);
  }
  const description = descriptionFor(skillName, packageId);
  if (description.length > 1024) {
    throw new Error(`Description for ${skillName} is too long (${description.length})`);
  }
  const frontmatter = [
    '---',
    `name: ${skillName}`,
    `description: ${JSON.stringify(description)}`,
    'metadata:',
    '  source: cindy',
    `  package: ${packageId}`,
    `  package-version: ${version}`,
    `  short-description: ${JSON.stringify(PACKAGES[packageId].short)}`,
    '---',
    '',
  ].join('\n');
  fs.writeFileSync(destination, `${frontmatter}${adaptBody(body, skillName)}`, 'utf8');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const packagesRoot = path.join(args.source, BOT_PACKAGES);
  if (!fs.existsSync(packagesRoot)) {
    throw new Error(`Cindy bot packages not found: ${packagesRoot}`);
  }

  const pluginRoot = path.join(ROOT, 'plugin');
  if (fs.existsSync(pluginRoot) && !args.force) {
    throw new Error(`Refusing to overwrite ${pluginRoot}; pass --force to refresh`);
  }
  fs.mkdirSync(pluginRoot, { recursive: true });

  const imported = [];
  for (const [packageId, meta] of Object.entries(PACKAGES)) {
    const packageRoot = path.join(packagesRoot, packageId);
    if (!fs.existsSync(packageRoot)) {
      throw new Error(`Missing Cindy package: ${packageRoot}`);
    }
    const versions = fs
      .readdirSync(packageRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    if (versions.length === 0) {
      throw new Error(`No version directory in ${packageRoot}`);
    }
    const version = versions[0];
    const versionRoot = path.join(packageRoot, version);
    const manifestPath = path.join(versionRoot, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (manifest.packageId !== packageId) {
      throw new Error(`Manifest packageId mismatch in ${manifestPath}`);
    }

    const destinationRoot = path.join(pluginRoot, packageId);
    fs.rmSync(destinationRoot, { recursive: true, force: true });
    fs.mkdirSync(path.join(destinationRoot, 'skills'), { recursive: true });

    const pluginManifest = {
      $schema: PLUGIN_SCHEMA,
      name: packageId,
      version,
      description: meta.description,
      author: { name: 'Cindy contributors; adapted for SEMAR-GPT' },
      repository: CINDY_REPOSITORY,
      license: 'Apache-2.0',
      keywords: ['cindy', 'semar-gpt', meta.role],
    };
    fs.writeFileSync(
      path.join(destinationRoot, 'plugin.json'),
      `${JSON.stringify(pluginManifest, null, 2)}\n`,
      'utf8',
    );

    const manifestSkills = Array.isArray(manifest.skills) ? manifest.skills : [];
    const skillNames = [];
    for (const skill of manifestSkills) {
      const skillName = skill.slug;
      const sourceSkillDir = path.join(versionRoot, 'skills', skillName);
      const sourceSkillFile = path.join(sourceSkillDir, 'SKILL.md');
      if (!fs.existsSync(sourceSkillFile)) {
        throw new Error(`Missing skill: ${sourceSkillFile}`);
      }
      const destinationSkillDir = path.join(destinationRoot, 'skills', skillName);
      fs.mkdirSync(destinationSkillDir, { recursive: true });
      fs.cpSync(sourceSkillDir, destinationSkillDir, {
        recursive: true,
        filter: (source) => path.basename(source) !== 'SKILL.md',
      });
      writeSkill({
        sourceFile: sourceSkillFile,
        destination: path.join(destinationSkillDir, 'SKILL.md'),
        packageId,
        version,
        skillName,
      });
      if (skillName.endsWith('-ops')) {
        const methodSource = path.join(versionRoot, 'knowledge', 'method.md');
        if (fs.existsSync(methodSource)) {
          const referencesDir = path.join(destinationSkillDir, 'references');
          fs.mkdirSync(referencesDir, { recursive: true });
          fs.copyFileSync(methodSource, path.join(referencesDir, 'method.md'));
        }
      }
      skillNames.push(skillName);
    }

    const readme = [
      `# ${manifest.displayName ?? packageId} (${packageId})`,
      '',
      `Agent Plugin adapted from Cindy's \`${packageId}\` package v${version}.`,
      '',
      `- Source: ${CINDY_REPOSITORY}`,
      '- License: Apache-2.0 (see `CINDY-LICENSE.txt` in the repository root)',
      `- Skills: ${skillNames.map((name) => `\`${name}\``).join(', ')}`,
      '',
      'The three skills preserve the Cindy package grouping: getting-started, ops, and evidence.',
      '',
    ].join('\n');
    fs.writeFileSync(path.join(destinationRoot, 'README.md'), readme, 'utf8');
    imported.push({ packageId, version, skillNames });
  }

  const licenseSource = path.join(args.source, 'LICENSE');
  if (fs.existsSync(licenseSource)) {
    fs.copyFileSync(licenseSource, path.join(ROOT, 'CINDY-LICENSE.txt'));
  }

  console.log(`Imported ${imported.length} Cindy bot package(s) into ${pluginRoot}`);
  for (const item of imported) {
    console.log(`  ${item.packageId} v${item.version}: ${item.skillNames.length} skills`);
  }
}

main();
