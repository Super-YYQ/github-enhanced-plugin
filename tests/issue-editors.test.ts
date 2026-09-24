// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { startEnhancer } from '../src/mount';

function toolbar(id: string): string {
  return `<markdown-toolbar for="${id}"><button type="button">Bold</button></markdown-toolbar><textarea id="${id}"></textarea>`;
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('Issue 多编辑器', () => {
  it('每个 Markdown 正文框只有一个入口，命令只写入来源框', () => {
    history.replaceState({}, '', '/owner/repo/issues/new');
    document.body.innerHTML = toolbar('problem') + toolbar('solution') + toolbar('context') + '<textarea id="code"></textarea>';
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: vi.fn((_name: string, _show: boolean, text: string) => {
        const field = document.activeElement as HTMLTextAreaElement;
        field.setRangeText(text, field.selectionStart, field.selectionEnd, 'end');
        field.dispatchEvent(new InputEvent('input', { bubbles: true, data: text }));
        return true;
      }),
    });

    const stop = startEnhancer();
    expect(document.querySelectorAll('[data-gh-enhance-button]')).toHaveLength(3);
    expect(document.querySelector('markdown-toolbar[for="code"]')).toBeNull();
    (document.querySelector('[for="solution"] [data-gh-enhance-button]') as HTMLButtonElement).click();
    (document.querySelector('[data-gh-command="NOTE"]') as HTMLButtonElement).click();
    expect((document.querySelector('#solution') as HTMLTextAreaElement).value).toBe('> [!NOTE]\n> 在这里输入内容');
    expect((document.querySelector('#problem') as HTMLTextAreaElement).value).toBe('');
    expect((document.querySelector('#context') as HTMLTextAreaElement).value).toBe('');
    stop();
    expect(document.querySelectorAll('[data-gh-enhance-button]')).toHaveLength(0);
  });

  it('重新扫描和动态新增编辑器不会重复挂载', async () => {
    history.replaceState({}, '', '/owner/repo/issues/12');
    document.body.innerHTML = toolbar('first');
    const stop = startEnhancer();
    document.body.insertAdjacentHTML('beforeend', toolbar('later'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.querySelectorAll('[data-gh-enhance-button]')).toHaveLength(2);
    stop();
  });

  it('原生关联工具栏隐藏时，将入口放在同一编辑器的可见按钮栏', () => {
    history.replaceState({}, '', '/owner/repo/issues/new');
    document.body.innerHTML = '<section><markdown-toolbar for="body" style="display:none"></markdown-toolbar><div role="toolbar" aria-label="Formatting tools"><button type="button">Bold</button></div><textarea id="body"></textarea></section>';
    const stop = startEnhancer();
    expect(document.querySelector('markdown-toolbar [data-gh-enhance-button]')).toBeNull();
    expect(document.querySelector('[role="toolbar"] [data-gh-enhance-button]')).toBeTruthy();
    stop();
  });

  it('同一容器中出现多个可见按钮栏时不猜测目标', () => {
    history.replaceState({}, '', '/owner/repo/issues/new');
    document.body.innerHTML = '<section><markdown-toolbar for="body" style="display:none"></markdown-toolbar><div role="toolbar"></div><div role="toolbar"></div><textarea id="body"></textarea></section>';
    const stop = startEnhancer();
    expect(document.querySelector('[data-gh-enhance-button]')).toBeNull();
    stop();
  });

  it('Tab 关闭菜单后焦点进入所属输入框', () => {
    history.replaceState({}, '', '/owner/repo/issues/new');
    document.body.innerHTML = toolbar('body');
    const stop = startEnhancer();
    (document.querySelector('[data-gh-enhance-button]') as HTMLButtonElement).click();
    document.querySelector('[role="menuitem"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    expect(document.querySelector('.gh-enhance-menu')).toBeNull();
    expect(document.activeElement).toBe(document.getElementById('body'));
    stop();
  });
});
