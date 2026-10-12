// 打包 plugins/<目录>/dist/ 为 release/<slug>-<version>.zip。
// 用法:
//   node scripts/package.mjs --tag <plugin-dir>-v<version>              # 打包（需先 npm run build）
//   node scripts/package.mjs --tag <plugin-dir>-v<version> --print-package   # 只解析并输出 npm 包名
//   node scripts/package.mjs --tag <plugin-dir>-v<version> --expect-package <npm-name>
// 校验 tag 格式、插件目录存在，以及 manifest.json、package.json 与 tag 三处版本一致。
import { mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import zipLib from 'zip-lib';

const usage = '用法: node scripts/package.mjs --tag <plugin-dir>-v<version> [--print-package] [--expect-package <npm-name>]';

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--print-package') {
      args['--print-package'] = true;
    } else if (argv[i] === '--tag' || argv[i] === '--expect-package') {
      const value = argv[i + 1];
      if (!value) fail(`缺少 ${argv[i]} 的值；${usage}`);
      args[argv[i]] = value;
      i += 1;
    } else {
      args._.push(argv[i]);
    }
  }
  if (!args['--tag']) fail(`缺少 --tag；${usage}`);
  return args;
}

function resolvePlugin(tag, root) {
  const tagPattern = /^(.+)-v(\d+\.\d+\.\d+)$/;
  const match = tagPattern.exec(tag);
  if (!match) fail(`tag "${tag}" 不符合 <插件目录>-v<语义化版本> 格式，例如 native-markdown-enhance-v0.2.0`);
  const [, pluginDir, tagVersion] = match;
  const pluginPath = path.join(root, 'plugins', pluginDir);
  if (!existsSync(pluginPath)) fail(`plugins/ 下不存在插件目录 "${pluginDir}"`);
  return { pluginDir, pluginPath, tagVersion };
}

async function loadVersions({ pluginPath, pluginDir, tagVersion }) {
  const manifestPath = path.join(pluginPath, 'manifest.json');
  const packageJsonPath = path.join(pluginPath, 'package.json');
  if (!existsSync(manifestPath)) fail(`缺少 ${path.join('plugins', pluginDir, 'manifest.json')}`);
  if (!existsSync(packageJsonPath)) fail(`缺少 ${path.join('plugins', pluginDir, 'package.json')}`);
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
  const versions = { tag: tagVersion, manifest: manifest.version, package: packageJson.version };
  const mismatched = Object.entries(versions).filter(([, version]) => version !== tagVersion);
  if (mismatched.length > 0) {
    const detail = Object.entries(versions).map(([source, version]) => `${source}: ${version}`).join(', ');
    fail(`版本不一致（${detail}）；请先统一 plugins/${pluginDir}/manifest.json、package.json 与 tag 的版本`);
  }
  return { manifest, packageJson };
}

const { '--tag': tag, '--expect-package': expectPackage, '--print-package': printPackage } = parseArgs(process.argv.slice(2));

const root = process.cwd();
const plugin = resolvePlugin(tag, root);
const { manifest, packageJson } = await loadVersions(plugin);
const npmName = packageJson.name;

if (expectPackage && expectPackage !== npmName) {
  fail(`--expect-package "${expectPackage}" 与 plugins/${plugin.pluginDir}/package.json 的 name "${npmName}" 不一致`);
}

if (printPackage) {
  console.log(npmName);
} else {
  const distPath = path.join(plugin.pluginPath, 'dist');
  if (!existsSync(path.join(distPath, 'manifest.json'))) {
    fail(`构建产物缺失：${path.join('plugins', plugin.pluginDir, 'dist', 'manifest.json')} 不存在；请先运行 npm run build`);
  }

  const slug = String(manifest.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const zipName = `${slug}-${plugin.tagVersion}.zip`;
  const releaseDir = path.join(root, 'release');
  await mkdir(releaseDir, { recursive: true });
  const zipPath = path.join(releaseDir, zipName);

  await zipLib.archiveFolder(distPath, zipPath);

  console.log(`✓ ${zipPath}`);
  console.log(`npm-package: ${npmName}`);
}
