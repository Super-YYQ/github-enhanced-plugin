import { describe, expect, it } from 'vitest';
import { CommandUnavailable, createEdit } from '../src/commands';

describe('插入命令', () => {
  it('在文中选区插入 NOTE，只替换选区并保留前后正文', () => {
    const source = '前文\n问题一\n问题二\n后文';
    const from = source.indexOf('问题一');
    const to = source.indexOf('\n后文');
    const result = createEdit('NOTE', { text: source, from, to });
    const expected = '前文\n\n> [!NOTE]\n> 问题一\n> 问题二\n\n后文';
    const caret = expected.indexOf('\n\n后文');
    expect(result).toEqual({
      text: expected,
      selection: { from: caret, to: caret },
    });
  });

  it.each(['TIP', 'IMPORTANT', 'WARNING', 'CAUTION'] as const)('%s 在空光标处插入可选择的正文占位', (kind) => {
    const result = createEdit(kind, { text: '开头\n结尾', from: 3, to: 3 });
    expect(result.text).toBe(`开头\n\n> [!${kind}]\n> 在这里输入内容\n\n结尾`);
    expect(result.text.slice(result.selection.from, result.selection.to)).toBe('在这里输入内容');
  });

  it('Details 保留选中的正文并选择标题占位', () => {
    const result = createEdit('DETAILS', { text: 'A\n原有正文\nZ', from: 2, to: 6 });
    expect(result.text).toBe('A\n\n<details>\n<summary>展开查看</summary>\n\n原有正文\n\n</details>\n\nZ');
    expect(result.text.slice(result.selection.from, result.selection.to)).toBe('展开查看');
  });

  it('Keyboard 转义选中文字，拒绝多行', () => {
    const result = createEdit('KEYBOARD', { text: 'Ctrl & <K>', from: 0, to: 10 });
    expect(result.text).toBe('<kbd>Ctrl &amp; &lt;K&gt;</kbd>');
    expect(() => createEdit('KEYBOARD', { text: 'Ctrl\nK', from: 0, to: 6 })).toThrow(CommandUnavailable);
  });

  it('Diff 围栏超过选中内容中的反引号长度', () => {
    const source = '```\n+ 新行';
    const result = createEdit('DIFF', { text: source, from: 0, to: source.length });
    expect(result.text).toBe('````diff\n```\n+ 新行\n````');
  });

  it('在可识别的围栏、引用和嵌套列表上下文拒绝顶层块插入', () => {
    for (const text of ['```js\nconst x = 1', '> 引用正文', '  - 嵌套列表']) {
      expect(() => createEdit('NOTE', { text, from: text.length, to: text.length })).toThrow(CommandUnavailable);
    }
    const text = '```js\ncode\n```\n结尾';
    expect(createEdit('NOTE', { text, from: text.length, to: text.length }).text).toContain('> [!NOTE]');
  });

  it('CRLF 文档中继续使用 CRLF，且保留选区外 Unicode 正文', () => {
    const text = '😀 前文\r\n正文\r\n尾声';
    const from = text.indexOf('正文');
    const to = from + 2;
    const result = createEdit('WARNING', { text, from, to });
    expect(result.text).toBe('😀 前文\r\n\r\n> [!WARNING]\r\n> 正文\r\n\r\n尾声');
  });
});
