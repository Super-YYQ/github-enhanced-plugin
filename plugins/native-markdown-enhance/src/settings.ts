import type { Command } from './commands';
import { validateTemplate } from './templates';

export const ALERT_COMMANDS = ['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION'] as const satisfies readonly Command[];
export const ROOT_ITEMS = ['ALERT', 'DETAILS', 'KEYBOARD', 'DIFF'] as const;
export const ALL_BUILT_INS = [...ALERT_COMMANDS, 'DETAILS', 'KEYBOARD', 'DIFF'] as const satisfies readonly Command[];
export const CUSTOM_ICONS = ['sparkle', 'bookmark', 'code', 'check', 'info', 'quote', 'terminal', 'list'] as const;
export type RootItem = typeof ROOT_ITEMS[number];
export type CustomIcon = typeof CUSTOM_ICONS[number];

export interface CustomCommand {
  id: string;
  name: string;
  icon: CustomIcon;
  template: string;
  enabled: boolean;
}

export interface Settings {
  version: 1;
  fontSize: number;
  rootOrder: RootItem[];
  alertOrder: (typeof ALERT_COMMANDS[number])[];
  hiddenBuiltIns: Command[];
  customCommands: CustomCommand[];
}

export const DEFAULT_SETTINGS: Settings = {
  version: 1,
  fontSize: 14,
  rootOrder: [...ROOT_ITEMS],
  alertOrder: [...ALERT_COMMANDS],
  hiddenBuiltIns: [],
  customCommands: [],
};

const STORAGE_KEY = 'settings';

function record(value: unknown, name: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${name} 必须是对象`);
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, keys: string[], name: string): void {
  const actual = Object.keys(value);
  if (actual.length !== keys.length || actual.some((key) => !keys.includes(key))) throw new Error(`${name} 含未知或缺失字段`);
}

function orderedSet<T extends string>(value: unknown, allowed: readonly T[], name: string): T[] {
  if (!Array.isArray(value) || value.length !== allowed.length ||
    value.some((item) => typeof item !== 'string' || !allowed.includes(item as T)) ||
    new Set(value).size !== allowed.length) throw new Error(`${name} 顺序无效`);
  return [...value] as T[];
}

export function validateSettings(input: unknown): Settings {
  const value = record(input, '配置');
  exactKeys(value, ['version', 'fontSize', 'rootOrder', 'alertOrder', 'hiddenBuiltIns', 'customCommands'], '配置');
  if (value.version !== 1) throw new Error('不支持的配置版本');
  if (!Number.isInteger(value.fontSize) || (value.fontSize as number) < 12 || (value.fontSize as number) > 20) {
    throw new Error('字号必须为 12–20 px 的整数');
  }
  const rootOrder = orderedSet(value.rootOrder, ROOT_ITEMS, '一级菜单');
  const alertOrder = orderedSet(value.alertOrder, ALERT_COMMANDS, 'Alert');
  if (!Array.isArray(value.hiddenBuiltIns) || value.hiddenBuiltIns.some((item) => !ALL_BUILT_INS.includes(item)) ||
    new Set(value.hiddenBuiltIns).size !== value.hiddenBuiltIns.length) throw new Error('内置命令显示状态无效');
  if (!Array.isArray(value.customCommands) || value.customCommands.length > 50) throw new Error('自定义命令最多 50 条');
  const ids = new Set<string>();
  const customCommands: CustomCommand[] = value.customCommands.map((raw: unknown, index: number) => {
    const item = record(raw, `自定义命令 ${index + 1}`);
    exactKeys(item, ['id', 'name', 'icon', 'template', 'enabled'], `自定义命令 ${index + 1}`);
    if (typeof item.id !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(item.id)) throw new Error(`自定义命令 ${index + 1} 的 ID 无效`);
    if (ids.has(item.id)) throw new Error('自定义命令 ID 重复');
    ids.add(item.id);
    if (typeof item.name !== 'string' || item.name.trim() !== item.name || !item.name || [...item.name].length > 40) {
      throw new Error(`自定义命令 ${index + 1} 的名称须为 1–40 字符`);
    }
    if (!CUSTOM_ICONS.includes(item.icon as CustomIcon)) throw new Error(`自定义命令 ${index + 1} 的图标无效`);
    if (typeof item.template !== 'string' || !item.template || new TextEncoder().encode(item.template).length > 10 * 1024) {
      throw new Error(`自定义命令 ${index + 1} 的模板须为 1–10 KB`);
    }
    const validation = validateTemplate(item.template);
    if (!validation.valid) throw new Error(`自定义命令 ${index + 1}：${validation.message}（位置 ${validation.position + 1}）`);
    if (typeof item.enabled !== 'boolean') throw new Error(`自定义命令 ${index + 1} 的显示状态无效`);
    return { id: item.id, name: item.name, icon: item.icon as CustomIcon, template: item.template, enabled: item.enabled };
  });
  return {
    version: 1,
    fontSize: value.fontSize as number,
    rootOrder,
    alertOrder,
    hiddenBuiltIns: [...value.hiddenBuiltIns] as Command[],
    customCommands,
  };
}

function validateStoredSettings(input: unknown): Settings {
  const value = record(input, '配置');
  return validateSettings({ ...DEFAULT_SETTINGS, ...value });
}

export function resetBuiltIns(settings: Settings): Settings {
  return {
    ...settings,
    fontSize: DEFAULT_SETTINGS.fontSize,
    rootOrder: [...DEFAULT_SETTINGS.rootOrder],
    alertOrder: [...DEFAULT_SETTINGS.alertOrder],
    hiddenBuiltIns: [],
    customCommands: settings.customCommands.map((command) => ({ ...command })),
  };
}

export function hasVisibleCommands(settings: Settings): boolean {
  return ALL_BUILT_INS.some((command) => !settings.hiddenBuiltIns.includes(command)) ||
    settings.customCommands.some((command) => command.enabled);
}

export async function loadSettings(): Promise<{ settings: Settings; error?: string }> {
  try {
    const stored = (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY];
    return { settings: stored === undefined ? validateSettings(DEFAULT_SETTINGS) : validateStoredSettings(stored) };
  } catch (error) {
    return { settings: validateSettings(DEFAULT_SETTINGS), error: error instanceof Error ? error.message : '无法读取配置' };
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: validateSettings(settings) });
}

export function settingsFromChange(changes: Record<string, { newValue?: unknown }>): Settings | null {
  if (!(STORAGE_KEY in changes)) return null;
  try {
    return validateStoredSettings(changes[STORAGE_KEY].newValue);
  } catch {
    return null;
  }
}
