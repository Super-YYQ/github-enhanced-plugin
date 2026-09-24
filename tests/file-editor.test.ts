// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { startEnhancer } from '../src/mount';
import { DEFAULT_SETTINGS } from '../src/settings';

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

it('在 Markdown 文件编辑器上方增加入口，向原生可编辑区插入 Note', () => {
  history.replaceState({}, '', '/owner/repo/edit/main/README.md');
  document.body.innerHTML = '<div id="file"><div class="cm-editor"><div class="cm-content" contenteditable="true"><div class="cm-line">说明</div></div></div></div>';
  const editor = document.querySelector('.cm-editor');
  const content = document.querySelector('.cm-content') as HTMLElement;
  const textNode = document.querySelector('.cm-line')?.firstChild as Text;
  const selection = window.getSelection()!;
  const range = document.createRange();
  range.setStart(textNode, 2);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  Object.defineProperty(document, 'execCommand', {
    configurable: true,
    value: vi.fn((_name: string, _show: boolean, text: string) => {
      const selected = window.getSelection()!;
      const target = selected.getRangeAt(0);
      target.deleteContents();
      const inserted = document.createTextNode(text);
      target.insertNode(inserted);
      target.setStartAfter(inserted);
      target.collapse(true);
      selected.removeAllRanges();
      selected.addRange(target);
      content.dispatchEvent(new InputEvent('input', { bubbles: true, data: text }));
      return true;
    }),
  });
  const stop = startEnhancer();
  const button = document.querySelector('[data-gh-enhance-button]') as HTMLButtonElement;
  expect(button).toBeTruthy();
  button.click();
  (document.querySelector('[data-gh-category="ALERT"]') as HTMLButtonElement).click();
  (document.querySelector('[data-gh-command="NOTE"]') as HTMLButtonElement).click();
  expect(document.querySelector('.cm-editor')).toBe(editor);
  expect(content.textContent).toContain('> [!NOTE]');
  expect(window.getSelection()?.toString()).toBe('在这里输入内容');
  stop();
});

it('非 Markdown 文件不显示入口', () => {
  history.replaceState({}, '', '/owner/repo/edit/main/app.ts');
  document.body.innerHTML = '<div class="cm-editor"><div class="cm-content" contenteditable="true"></div></div>';
  const stop = startEnhancer();
  expect(document.querySelector('[data-gh-enhance-button]')).toBeNull();
  stop();
});

it('新建文件随文件名切换 Markdown 入口', async () => {
  history.replaceState({}, '', '/owner/repo/new/main');
  document.body.innerHTML = '<input aria-label="File name"><div class="cm-editor"><div class="cm-content" contenteditable="true"></div></div>';
  const stop = startEnhancer();
  const filename = document.querySelector('input')!;
  expect(document.querySelector('[data-gh-enhance-button]')).toBeNull();
  filename.value = 'README.md';
  filename.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(document.querySelectorAll('[data-gh-enhance-button]')).toHaveLength(1);
  filename.value = 'app.ts';
  filename.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(document.querySelector('[data-gh-enhance-button]')).toBeNull();
  stop();
});

it('编辑已有 Markdown 文件时改成非 Markdown 文件名会移除入口', async () => {
  history.replaceState({}, '', '/owner/repo/edit/main/README.md');
  document.body.innerHTML = '<input aria-label="File name" value="README.md"><div class="cm-editor"><div class="cm-content" contenteditable="true"></div></div>';
  const stop = startEnhancer();
  expect(document.querySelectorAll('[data-gh-enhance-button]')).toHaveLength(1);
  const filename = document.querySelector('input')!;
  filename.value = 'app.ts';
  filename.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(document.querySelector('[data-gh-enhance-button]')).toBeNull();
  stop();
});

it('自定义模板在文件编辑器中将光标放到 cursor 标记处', () => {
  history.replaceState({}, '', '/owner/repo/edit/main/README.md');
  document.body.innerHTML = '<div class="cm-editor"><div class="cm-content" contenteditable="true"><div class="cm-line">重要</div></div></div>';
  const content = document.querySelector('.cm-content') as HTMLElement;
  const textNode = document.querySelector('.cm-line')!.firstChild as Text;
  const selection = window.getSelection()!;
  const range = document.createRange();
  range.selectNodeContents(textNode);
  selection.removeAllRanges();
  selection.addRange(range);
  Object.defineProperty(document, 'execCommand', {
    configurable: true,
    value: vi.fn((_name: string, _show: boolean, text: string) => {
      const active = window.getSelection()!;
      const target = active.getRangeAt(0);
      target.deleteContents();
      const inserted = document.createTextNode(text);
      target.insertNode(inserted);
      target.setStartAfter(inserted);
      target.collapse(true);
      active.removeAllRanges();
      active.addRange(target);
      return true;
    }),
  });
  const stop = startEnhancer({
    ...DEFAULT_SETTINGS,
    customCommands: [{ id: 'emphasis', name: '强调', icon: 'sparkle', template: '**{{selection}}{{cursor}}**', enabled: true }],
  });
  (document.querySelector('[data-gh-enhance-button]') as HTMLButtonElement).click();
  (document.querySelector('[data-gh-category="CUSTOM"]') as HTMLButtonElement).click();
  (document.querySelector('[data-gh-custom-command="emphasis"]') as HTMLButtonElement).click();
  expect(content.textContent).toBe('**重要**');
  expect(selection.anchorNode?.textContent).toBe('**重要**');
  expect(selection.anchorOffset).toBe(4);
  stop();
});
