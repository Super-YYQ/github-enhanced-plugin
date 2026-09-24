import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, loadSettings, resetBuiltIns, validateSettings } from '../src/settings';

describe('扩展配置', () => {
  it('合法的本地配置可以往返导入，自定义命令保留图标、模板和顺序', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      fontSize: 18,
      hiddenBuiltIns: ['TIP'],
      customCommands: [{ id: 'sample', name: '强调', icon: 'sparkle', template: '**{{selection}}{{cursor}}**', enabled: true }],
    };
    expect(validateSettings(JSON.parse(JSON.stringify(settings)))).toEqual(settings);
  });

  it('导入错误配置时拒绝整份文件，不接受未知标记、越界字号或重复 ID', () => {
    const command = { id: 'same', name: '备注', icon: 'sparkle', template: '{{date}}', enabled: true };
    expect(() => validateSettings({ ...DEFAULT_SETTINGS, customCommands: [command] })).toThrow(/占位符/);
    expect(() => validateSettings({ ...DEFAULT_SETTINGS, fontSize: 21 })).toThrow(/字号/);
    expect(() => validateSettings({ ...DEFAULT_SETTINGS, customCommands: [{ ...command, template: 'A' }, { ...command, template: 'B' }] })).toThrow(/重复/);
  });

  it('恢复默认只影响内置命令和字号，自定义命令保持原状', () => {
    const custom = { id: 'sample', name: '强调', icon: 'sparkle' as const, template: '**{{selection}}**', enabled: false };
    const result = resetBuiltIns({ ...DEFAULT_SETTINGS, fontSize: 20, hiddenBuiltIns: ['NOTE'], customCommands: [custom] });
    expect(result.fontSize).toBe(14);
    expect(result.hiddenBuiltIns).toEqual([]);
    expect(result.customCommands).toEqual([custom]);
  });

  it('本地配置缺失字段时补默认值并保留已有命令，导入仍严格校验', async () => {
    const custom = { id: 'sample', name: '强调', icon: 'sparkle', template: '**{{selection}}**', enabled: true };
    const partial = { version: 1, fontSize: 18, customCommands: [custom] };
    vi.stubGlobal('chrome', { storage: { local: { get: async () => ({ settings: partial }) } } });
    try {
      const loaded = await loadSettings();
      expect(loaded.error).toBeUndefined();
      expect(loaded.settings).toEqual({ ...DEFAULT_SETTINGS, fontSize: 18, customCommands: [custom] });
      expect(() => validateSettings(partial)).toThrow(/缺失字段/);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
