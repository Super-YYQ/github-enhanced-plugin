import { describe, expect, it } from 'vitest';
import { renderTemplate, validateTemplate } from '../src/templates';

describe('自定义 Markdown 模板', () => {
  it('把选区放入模板，并将光标留在指定位置', () => {
    expect(renderTemplate('**{{selection}}{{cursor}}**', '重要')).toEqual({
      insert: '**重要**',
      selection: { from: 4, to: 4 },
    });
  });

  it('没有 selection 标记时直接替换选区，没有 cursor 标记时光标在末尾', () => {
    expect(renderTemplate('> 提示', '旧内容')).toEqual({
      insert: '> 提示',
      selection: { from: 4, to: 4 },
    });
  });

  it('拒绝未知、未闭合及重复光标标记，并报告错误位置', () => {
    expect(validateTemplate('前文 {{date}}')).toMatchObject({ valid: false, position: 3 });
    expect(validateTemplate('前文 {{selection')).toMatchObject({ valid: false, position: 3 });
    expect(validateTemplate('{{cursor}}-{{cursor}}')).toMatchObject({ valid: false, position: 11 });
  });
});
