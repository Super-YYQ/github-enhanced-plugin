import type { Command } from './commands';
import { BUILT_IN_META } from './catalog';
import { iconSvg, type IconName } from './icons';
import {
  ALL_BUILT_INS, CUSTOM_ICONS, DEFAULT_SETTINGS,
  loadSettings, resetBuiltIns, saveSettings, settingsFromChange, validateSettings,
  type CustomCommand, type CustomIcon, type Settings,
} from './settings';
import { renderTemplate, validateTemplate } from './templates';

function element<T extends Element = HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`找不到设置界面：${id}`);
  return found as unknown as T;
}

function swap<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const copy = [...items];
  const other = index + direction;
  if (other < 0 || other >= copy.length) return copy;
  [copy[index], copy[other]] = [copy[other], copy[index]];
  return copy;
}

function iconButton(icon: IconName, label: string, onClick: () => void, disabled = false): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'icon-button';
  button.title = label;
  button.setAttribute('aria-label', label);
  button.innerHTML = iconSvg(icon);
  button.disabled = disabled;
  button.addEventListener('click', onClick);
  return button;
}

function toggle(label: string, checked: boolean, onChange: (checked: boolean) => void): HTMLElement {
  const wrap = document.createElement('label');
  wrap.className = 'toggle';
  wrap.title = checked ? `隐藏${label}` : `显示${label}`;
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = checked;
  input.setAttribute('aria-label', `显示${label}`);
  input.addEventListener('change', () => onChange(input.checked));
  const track = document.createElement('span');
  track.className = 'toggle-track';
  track.setAttribute('aria-hidden', 'true');
  wrap.append(input, track);
  return wrap;
}

function commandRow(label: string, description: string, icon: IconName): { row: HTMLElement; actions: HTMLElement } {
  const row = document.createElement('div');
  row.className = 'command-row';
  const image = document.createElement('span');
  image.className = 'row-icon';
  image.innerHTML = iconSvg(icon);
  const copy = document.createElement('span');
  copy.className = 'row-copy';
  const title = document.createElement('strong');
  title.textContent = label;
  const help = document.createElement('small');
  help.textContent = description;
  copy.append(title, help);
  const actions = document.createElement('span');
  actions.className = 'row-actions';
  row.append(image, copy, actions);
  return { row, actions };
}

let settings: Settings = validateSettings(DEFAULT_SETTINGS);
let editingId: string | null = null;
let selectedIcon: CustomIcon = 'sparkle';
let pendingImport: Settings | null = null;
let pendingDeleteId: string | null = null;
let pendingWrites = 0;
let saveQueue: Promise<void> = Promise.resolve();
let noticeTimer = 0;

function notice(message: string): void {
  const status = element('status');
  status.textContent = message;
  status.hidden = false;
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => { status.hidden = true; }, 3500);
}

async function persist(next: Settings, success = '已保存'): Promise<boolean> {
  let checked: Settings;
  try {
    checked = validateSettings(next);
  } catch (error) {
    renderAll();
    notice(error instanceof Error ? error.message : '保存失败');
    return false;
  }
  settings = checked;
  renderAll();
  pendingWrites++;
  const write = saveQueue.then(() => saveSettings(checked));
  saveQueue = write.catch(() => {});
  try {
    await write;
    if (pendingWrites === 1) notice(success);
    return true;
  } catch (error) {
    if (pendingWrites === 1) {
      const loaded = await loadSettings();
      settings = loaded.settings;
      renderAll();
    }
    notice(error instanceof Error ? error.message : '保存失败');
    return false;
  } finally {
    pendingWrites--;
  }
}

function renderBuiltIns(): void {
  const rootList = element('root-list');
  const alertList = element('alert-list');
  rootList.replaceChildren();
  alertList.replaceChildren();
  settings.rootOrder.forEach((item, index) => {
    const meta = item === 'ALERT'
      ? { label: 'Alert', help: '五种提示块，进入二级菜单', icon: 'alert' as IconName }
      : BUILT_IN_META[item as Command];
    const { row, actions } = commandRow(meta.label, meta.help, meta.icon);
    if (item !== 'ALERT') {
      const visible = !settings.hiddenBuiltIns.includes(item as Command);
      actions.append(toggle(meta.label, visible, (checked) => setBuiltInVisibility(item as Command, checked)));
    }
    actions.append(
      iconButton('up', `${meta.label} 上移`, () => void persist({ ...settings, rootOrder: swap(settings.rootOrder, index, -1) }), index === 0),
      iconButton('down', `${meta.label} 下移`, () => void persist({ ...settings, rootOrder: swap(settings.rootOrder, index, 1) }), index === settings.rootOrder.length - 1),
    );
    rootList.append(row);
  });
  settings.alertOrder.forEach((command, index) => {
    const meta = BUILT_IN_META[command];
    const { row, actions } = commandRow(meta.label, meta.help, meta.icon);
    actions.append(
      toggle(meta.label, !settings.hiddenBuiltIns.includes(command), (checked) => setBuiltInVisibility(command, checked)),
      iconButton('up', `${meta.label} 上移`, () => void persist({ ...settings, alertOrder: swap(settings.alertOrder, index, -1) }), index === 0),
      iconButton('down', `${meta.label} 下移`, () => void persist({ ...settings, alertOrder: swap(settings.alertOrder, index, 1) }), index === settings.alertOrder.length - 1),
    );
    alertList.append(row);
  });
}

function setBuiltInVisibility(command: Command, visible: boolean): void {
  const hiddenBuiltIns = visible
    ? settings.hiddenBuiltIns.filter((item) => item !== command)
    : [...settings.hiddenBuiltIns, command];
  void persist({ ...settings, hiddenBuiltIns });
}

function renderCustom(): void {
  const list = element('custom-list');
  list.replaceChildren();
  element('custom-count').textContent = `${settings.customCommands.length} / 50 条命令`;
  element<HTMLButtonElement>('add-command').disabled = settings.customCommands.length >= 50;
  if (settings.customCommands.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = '还没有自定义命令。可以用模板保存常用的 Markdown 片段。';
    list.append(empty);
  }
  settings.customCommands.forEach((command, index) => {
    const { row, actions } = commandRow(command.name, command.enabled ? '在「自定义」菜单显示' : '已隐藏，模板仍保留', command.icon);
    if (pendingDeleteId === command.id) {
      const confirm = document.createElement('button');
      confirm.type = 'button';
      confirm.className = 'button danger';
      confirm.textContent = '确认删除';
      confirm.addEventListener('click', () => {
        pendingDeleteId = null;
        if (editingId === command.id) closeEditor();
        void persist({ ...settings, customCommands: settings.customCommands.filter((item) => item.id !== command.id) }, '已删除命令');
      });
      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.className = 'button quiet';
      cancel.textContent = '取消';
      cancel.addEventListener('click', () => { pendingDeleteId = null; renderCustom(); });
      actions.append(confirm, cancel);
    } else {
      actions.append(
        toggle(command.name, command.enabled, (enabled) => {
          void persist({ ...settings, customCommands: settings.customCommands.map((item) => item.id === command.id ? { ...item, enabled } : item) });
        }),
        iconButton('up', `${command.name} 上移`, () => void persist({ ...settings, customCommands: swap(settings.customCommands, index, -1) }), index === 0),
        iconButton('down', `${command.name} 下移`, () => void persist({ ...settings, customCommands: swap(settings.customCommands, index, 1) }), index === settings.customCommands.length - 1),
        iconButton('edit', `编辑 ${command.name}`, () => openEditor(command.id)),
        iconButton('trash', `删除 ${command.name}`, () => { pendingDeleteId = command.id; renderCustom(); }),
      );
    }
    list.append(row);
  });
}

function renderAppearance(): void {
  document.documentElement.style.setProperty('--ui-font-size', `${settings.fontSize}px`);
  element<HTMLInputElement>('font-size').value = String(settings.fontSize);
  element<HTMLOutputElement>('font-output').value = `${settings.fontSize} px`;
}

function renderAll(): void {
  renderBuiltIns();
  renderCustom();
  renderAppearance();
}

function renderIconPicker(): void {
  const picker = element('icon-picker');
  picker.replaceChildren();
  for (const icon of CUSTOM_ICONS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'icon-choice';
    button.setAttribute('aria-pressed', String(icon === selectedIcon));
    button.setAttribute('aria-label', `${icon} 图标`);
    button.title = icon;
    button.innerHTML = iconSvg(icon);
    button.addEventListener('click', () => {
      selectedIcon = icon;
      renderIconPicker();
      picker.querySelector<HTMLButtonElement>(`[title="${icon}"]`)?.focus({ preventScroll: true });
    });
    picker.append(button);
  }
}

function updateTemplatePreview(): void {
  const template = element<HTMLTextAreaElement>('custom-template').value;
  element('template-count').textContent = `${new TextEncoder().encode(template).length} / 10240 字节`;
  const preview = element('template-preview');
  preview.replaceChildren();
  if (!template) {
    preview.textContent = '在上方输入模板，这里会显示使用示例。';
    return;
  }
  const validation = validateTemplate(template);
  if (!validation.valid) {
    preview.textContent = `${validation.message}（位置 ${validation.position + 1}）`;
    return;
  }
  const example = renderTemplate(template, '选中文字');
  const caption = document.createElement('strong');
  caption.textContent = `示例预览 · 光标位于第 ${[...example.insert.slice(0, example.selection.from)].length} 字符后`;
  const output = document.createElement('pre');
  output.textContent = example.insert;
  preview.append(caption, output);
}

function openEditor(id: string | null = null): void {
  const command = settings.customCommands.find((item) => item.id === id);
  editingId = command?.id ?? null;
  selectedIcon = command?.icon ?? 'sparkle';
  element('editor-title').textContent = command ? '编辑命令' : '新建命令';
  element<HTMLInputElement>('custom-name').value = command?.name ?? '';
  element<HTMLTextAreaElement>('custom-template').value = command?.template ?? '';
  element('name-count').textContent = `${[...(command?.name ?? '')].length} / 40 字符`;
  element('editor-error').textContent = '';
  renderIconPicker();
  updateTemplatePreview();
  const editor = element('custom-editor');
  editor.hidden = false;
  editor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  element<HTMLInputElement>('custom-name').focus({ preventScroll: true });
}

function closeEditor(): void {
  editingId = null;
  element('custom-editor').hidden = true;
}

async function saveCommand(): Promise<void> {
  const name = element<HTMLInputElement>('custom-name').value.trim();
  const template = element<HTMLTextAreaElement>('custom-template').value;
  const old = settings.customCommands.find((item) => item.id === editingId);
  const command: CustomCommand = {
    id: old?.id ?? crypto.randomUUID().replaceAll('-', ''),
    name,
    icon: selectedIcon,
    template,
    enabled: old?.enabled ?? true,
  };
  const customCommands = old
    ? settings.customCommands.map((item) => item.id === old.id ? command : item)
    : [...settings.customCommands, command];
  try {
    const next = validateSettings({ ...settings, customCommands });
    if (await persist(next, old ? '命令已更新' : '命令已添加')) closeEditor();
  } catch (error) {
    element('editor-error').textContent = error instanceof Error ? error.message : '无法保存命令';
  }
}

function exportSettings(): void {
  const blob = new Blob([JSON.stringify(settings, null, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'github-markdown-enhance-settings.json';
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  notice('配置已导出');
}

function renderImportPreview(): void {
  const box = element('import-preview');
  box.replaceChildren();
  box.hidden = pendingImport === null;
  if (!pendingImport) return;
  const title = document.createElement('h3');
  title.textContent = '导入前确认';
  const summary = document.createElement('p');
  summary.textContent = '导入会整体替换当前配置。建议先导出当前配置备份。';
  const removed = settings.customCommands.filter((item) => !pendingImport!.customCommands.some((incoming) => incoming.id === item.id));
  const existing = new Map(settings.customCommands.map((item) => [item.id, item]));
  const added = pendingImport.customCommands.filter((item) => !existing.has(item.id));
  const modified = pendingImport.customCommands.filter((item) => {
    const before = existing.get(item.id);
    return before && (before.name !== item.name || before.icon !== item.icon || before.template !== item.template || before.enabled !== item.enabled);
  });
  const sharedBefore = settings.customCommands.filter((item) => pendingImport!.customCommands.some((incoming) => incoming.id === item.id)).map((item) => item.id);
  const sharedAfter = pendingImport.customCommands.filter((item) => existing.has(item.id)).map((item) => item.id);
  const reordered = sharedBefore.join('\u0000') !== sharedAfter.join('\u0000');
  const rootLabels = (order: Settings['rootOrder']) => order.map((item) => item === 'ALERT' ? 'Alert' : BUILT_IN_META[item].label).join(' · ');
  const alertLabels = (order: Settings['alertOrder']) => order.map((item) => BUILT_IN_META[item].label).join(' · ');
  const hiddenLabels = (commands: Settings['hiddenBuiltIns']) => commands.length
    ? ALL_BUILT_INS.filter((item) => commands.includes(item)).map((item) => BUILT_IN_META[item].label).join(' · ') : '无';
  const difference = (before: string, after: string) => before === after ? '无变化' : `${before} → ${after}`;
  const items = [
    `界面字号：${settings.fontSize} → ${pendingImport.fontSize} px`,
    `自定义命令：${settings.customCommands.length} → ${pendingImport.customCommands.length} 条`,
    `新增 ${added.length} 条 · 修改 ${modified.length} 条 · 共同命令排序${reordered ? '将调整' : '不变'}`,
    `现有自定义命令将消失：${removed.length} 条${removed.length ? `（${removed.slice(0, 5).map((item) => item.name).join('、')}${removed.length > 5 ? '…' : ''}）` : ''}`,
    `一级顺序：${difference(rootLabels(settings.rootOrder), rootLabels(pendingImport.rootOrder))}`,
    `Alert 顺序：${difference(alertLabels(settings.alertOrder), alertLabels(pendingImport.alertOrder))}`,
    `隐藏的内置命令：${difference(hiddenLabels(settings.hiddenBuiltIns), hiddenLabels(pendingImport.hiddenBuiltIns))}`,
  ];
  const list = document.createElement('ul');
  for (const item of items) { const li = document.createElement('li'); li.textContent = item; list.append(li); }
  const buttons = document.createElement('div');
  buttons.className = 'review-actions';
  const confirm = document.createElement('button');
  confirm.type = 'button';
  confirm.className = 'button danger';
  confirm.textContent = '确认替换';
  confirm.addEventListener('click', async () => {
    if (!pendingImport) return;
    if (await persist(pendingImport, '配置已导入')) {
      pendingImport = null;
      renderImportPreview();
    }
  });
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'button quiet';
  cancel.textContent = '取消';
  cancel.addEventListener('click', () => { pendingImport = null; renderImportPreview(); });
  buttons.append(confirm, cancel);
  box.append(title, summary, list, buttons);
}

async function readImport(file: File): Promise<void> {
  pendingImport = null;
  renderImportPreview();
  if (file.size > 1024 * 1024) { notice('配置文件超过 1 MB'); return; }
  try {
    pendingImport = validateSettings(JSON.parse(await file.text()));
    renderImportPreview();
    element('import-preview').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (error) {
    notice(error instanceof Error ? `导入失败：${error.message}` : '导入失败：文件无效');
  }
}

async function boot(): Promise<void> {
  const loaded = await loadSettings();
  settings = loaded.settings;
  renderAll();
  if (loaded.error) notice(`配置读取失败，已显示默认值：${loaded.error}`);
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    const next = settingsFromChange(changes);
    if (next && pendingWrites === 0) { settings = next; renderAll(); }
  });
  element<HTMLButtonElement>('add-command').addEventListener('click', () => openEditor());
  element<HTMLButtonElement>('cancel-edit').addEventListener('click', closeEditor);
  element<HTMLButtonElement>('save-command').addEventListener('click', () => { void saveCommand(); });
  element<HTMLTextAreaElement>('custom-template').addEventListener('input', updateTemplatePreview);
  element<HTMLInputElement>('custom-name').addEventListener('input', () => {
    const name = element<HTMLInputElement>('custom-name').value;
    element('name-count').textContent = `${[...name].length} / 40 字符`;
  });
  element<HTMLInputElement>('font-size').addEventListener('input', () => {
    const size = Number(element<HTMLInputElement>('font-size').value);
    document.documentElement.style.setProperty('--ui-font-size', `${size}px`);
    element<HTMLOutputElement>('font-output').value = `${size} px`;
  });
  element<HTMLInputElement>('font-size').addEventListener('change', () => {
    const fontSize = Number(element<HTMLInputElement>('font-size').value);
    void persist({ ...settings, fontSize });
  });
  element<HTMLButtonElement>('export-settings').addEventListener('click', exportSettings);
  element<HTMLButtonElement>('choose-import').addEventListener('click', () => element<HTMLInputElement>('import-file').click());
  element<HTMLInputElement>('import-file').addEventListener('change', () => {
    const input = element<HTMLInputElement>('import-file');
    const file = input.files?.[0];
    input.value = '';
    if (file) void readImport(file);
  });
  element<HTMLButtonElement>('reset-settings').addEventListener('click', () => { element('reset-preview').hidden = false; });
  element<HTMLButtonElement>('cancel-reset').addEventListener('click', () => { element('reset-preview').hidden = true; });
  element<HTMLButtonElement>('confirm-reset').addEventListener('click', () => {
    void persist(resetBuiltIns(settings), '已恢复内置默认');
    element('reset-preview').hidden = true;
  });
}

void boot();
