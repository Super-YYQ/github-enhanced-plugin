import { Command } from './commands';
import { EditorAdapter, EditorSnapshot, FileEditor, TextareaEditor } from './editor';

const items: { command: Command; label: string; help: string }[] = [
  { command: 'NOTE', label: 'Note', help: '补充说明' },
  { command: 'TIP', label: 'Tip', help: '建议与技巧' },
  { command: 'IMPORTANT', label: 'Important', help: '重要信息' },
  { command: 'WARNING', label: 'Warning', help: '潜在风险' },
  { command: 'CAUTION', label: 'Caution', help: '严重风险' },
  { command: 'DETAILS', label: 'Details', help: '折叠内容' },
  { command: 'KEYBOARD', label: 'Keyboard', help: '键盘按键' },
  { command: 'DIFF', label: 'Diff', help: '差异代码块' },
];

interface Binding {
  mount: Element;
  button: HTMLButtonElement;
  editor: EditorAdapter;
}

export function startEnhancer(): () => void {
  const bindings = new Map<Element, Binding>();
  let menu: HTMLElement | null = null;
  let opened: { binding: Binding; snapshot: EditorSnapshot } | null = null;
  let scanScheduled = false;

  function closeMenu(returnFocus = false): void {
    const previous = opened;
    menu?.remove();
    menu = null;
    opened = null;
    previous?.binding.button.setAttribute('aria-expanded', 'false');
    if (returnFocus && previous?.binding.button.isConnected) previous.binding.button.focus();
  }

  function openMenu(binding: Binding): void {
    closeMenu();
    const snapshot = binding.editor.capture();
    if (!snapshot) {
      showError('请先在编辑器中放置光标');
      return;
    }
    opened = { binding, snapshot };
    const popup = document.createElement('div');
    popup.className = 'gh-enhance-menu';
    popup.setAttribute('role', 'menu');
    popup.setAttribute('aria-label', 'Markdown 增强');
    const rect = binding.button.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom;
    popup.style.top = `${below < 260 && rect.top > below ? Math.max(8, rect.top - 360) : rect.bottom + 4}px`;
    popup.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - 230))}px`;

    for (const item of items) {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'gh-enhance-item';
      option.dataset.ghCommand = item.command;
      option.setAttribute('role', 'menuitem');
      option.tabIndex = -1;
      option.textContent = `${item.label} · ${item.help}`;
      option.addEventListener('click', () => {
        if (!opened || opened.binding !== binding) return;
        try {
          binding.editor.insert(item.command, opened.snapshot);
          closeMenu();
        } catch (error) {
          showError(error instanceof Error ? error.message : '无法插入');
          closeMenu();
        }
      });
      popup.append(option);
    }
    popup.addEventListener('keydown', (event) => {
      const options = [...popup.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')];
      const current = options.indexOf(document.activeElement as HTMLButtonElement);
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu(true);
      } else if (event.key === 'Tab') {
        event.preventDefault();
        closeMenu();
        if (event.shiftKey) binding.button.focus();
        else if (binding.editor instanceof TextareaEditor) binding.editor.field.focus();
        else if (binding.editor instanceof FileEditor) binding.editor.content.focus();
      } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1
          : event.key === 'ArrowDown' ? (current + 1) % options.length : (current - 1 + options.length) % options.length;
        options[next]?.focus();
      }
    });
    menu = popup;
    document.body.append(popup);
    binding.button.setAttribute('aria-expanded', 'true');
    popup.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
  }

  function showError(message: string): void {
    const notice = document.createElement('div');
    notice.className = 'gh-enhance-notice';
    notice.setAttribute('role', 'status');
    notice.textContent = message;
    document.body.append(notice);
    window.setTimeout(() => notice.remove(), 3500);
  }

  function createButton(onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'gh-enhance-button';
    button.dataset.ghEnhanceButton = '';
    button.textContent = document.documentElement.lang.toLowerCase().startsWith('en') ? 'Enhance ▾' : '增强 ▾';
    button.setAttribute('aria-haspopup', 'menu');
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', onClick);
    return button;
  }

  function issuePage(): boolean {
    return /^\/[^/]+\/[^/]+\/issues(?:\/|$)/.test(location.pathname);
  }

  function issueButtonBar(toolbar: Element, field: HTMLTextAreaElement): Element | null {
    if (getComputedStyle(toolbar).display !== 'none') return toolbar;
    const container = toolbar.parentElement;
    if (!container?.contains(field)) return null;
    const visible = [...container.querySelectorAll('[role="toolbar"]')]
      .filter((candidate) => candidate !== toolbar && getComputedStyle(candidate).display !== 'none');
    return visible.length === 1 ? visible[0] : null;
  }

  function markdownFilePage(): boolean {
    if (!/^\/[^/]+\/[^/]+\/(?:edit|new)\//.test(location.pathname)) return false;
    const filename = document.querySelector<HTMLInputElement>('input[aria-label="File name"]');
    if (filename) return /\.(?:md|markdown)$/i.test(filename.value);
    if (/\/edit\//.test(location.pathname)) {
      try {
        return /\.(?:md|markdown)$/i.test(decodeURIComponent(location.pathname));
      } catch {
        return false;
      }
    }
    return false;
  }

  function scan(): void {
    scanScheduled = false;
    for (const [mount, binding] of bindings) {
      const issueEditor = binding.editor instanceof TextareaEditor ? binding.editor : null;
      const relevant = issueEditor ? issuePage() && mount.getAttribute('for') === issueEditor.field.id : markdownFilePage();
      if (!relevant || !mount.isConnected || !binding.editor.isWritable() || !binding.button.isConnected) {
        if (opened?.binding === binding) closeMenu();
        if (issueEditor) binding.button.remove();
        else binding.button.parentElement?.remove();
        bindings.delete(mount);
      }
    }
    if (issuePage()) for (const toolbar of document.querySelectorAll('markdown-toolbar[for]')) {
      if (bindings.has(toolbar)) continue;
      const id = toolbar.getAttribute('for');
      if (!id) continue;
      const field = document.getElementById(id);
      if (!(field instanceof HTMLTextAreaElement) || field.disabled || field.readOnly || !field.isConnected) continue;
      const buttonBar = issueButtonBar(toolbar, field);
      if (!buttonBar) continue;
      const editor = new TextareaEditor(field);
      let binding: Binding;
      const button = createButton(() => openMenu(binding));
      binding = { mount: toolbar, button, editor };
      buttonBar.append(button);
      bindings.set(toolbar, binding);
    }
    if (markdownFilePage()) {
      const candidates = document.querySelectorAll<HTMLElement>('.cm-editor .cm-content[contenteditable="true"]');
      if (candidates.length === 1) {
        const content = candidates[0];
        const host = content.closest('.cm-editor');
        if (host?.parentElement && !bindings.has(host)) {
          const bar = document.createElement('div');
          bar.className = 'gh-enhance-filebar';
          let binding: Binding;
          const button = createButton(() => openMenu(binding));
          bar.append(button);
          host.parentElement.insertBefore(bar, host);
          binding = { mount: host, button, editor: new FileEditor(host, content) };
          bindings.set(host, binding);
        }
      }
    }
  }

  function scheduleScan(): void {
    if (scanScheduled) return;
    scanScheduled = true;
    queueMicrotask(scan);
  }

  function onOutsideClick(event: MouseEvent): void {
    if (!menu || !opened) return;
    if (menu.contains(event.target as Node) || opened.binding.button.contains(event.target as Node)) return;
    closeMenu();
  }

  function onFocus(event: FocusEvent): void {
    if (!opened) return;
    const target = event.target;
    if (target instanceof HTMLTextAreaElement && opened.binding.editor instanceof TextareaEditor && target !== opened.binding.editor.field) closeMenu();
  }

  function onInput(event: Event): void {
    if (event.target instanceof HTMLInputElement && event.target.matches('input[aria-label="File name"]')) scheduleScan();
  }

  const observer = new MutationObserver(scheduleScan);
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['for', 'disabled', 'readonly'] });
  document.addEventListener('click', onOutsideClick, true);
  document.addEventListener('focusin', onFocus, true);
  document.addEventListener('input', onInput, true);
  window.addEventListener('popstate', scheduleScan);
  scan();
  return () => {
    observer.disconnect();
    document.removeEventListener('click', onOutsideClick, true);
    document.removeEventListener('focusin', onFocus, true);
    document.removeEventListener('input', onInput, true);
    window.removeEventListener('popstate', scheduleScan);
    closeMenu();
    for (const binding of bindings.values()) {
      if (binding.editor instanceof FileEditor) binding.button.parentElement?.remove();
      else binding.button.remove();
    }
    bindings.clear();
  };
}
