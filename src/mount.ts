import type { Command } from './commands';
import { BUILT_IN_META } from './catalog';
import { EditorAdapter, EditorSnapshot, FileEditor, InsertionCommand, TextareaEditor } from './editor';
import { iconSvg, type IconName } from './icons';
import { DEFAULT_SETTINGS, hasVisibleCommands, type CustomCommand, type Settings, validateSettings } from './settings';

interface Binding {
  mount: Element;
  button: HTMLButtonElement;
  editor: EditorAdapter;
}

type MenuPage = 'root' | 'ALERT' | 'CUSTOM';
export type EnhancerStop = (() => void) & { updateSettings(settings: Settings): void };

export function startEnhancer(initialSettings: Settings = DEFAULT_SETTINGS): EnhancerStop {
  const bindings = new Map<Element, Binding>();
  let settings = validateSettings(initialSettings);
  let menu: HTMLElement | null = null;
  let opened: { binding: Binding; snapshot: EditorSnapshot; page: MenuPage } | null = null;
  let scanScheduled = false;
  let disposed = false;

  function closeMenu(returnFocus = false): void {
    const previous = opened;
    menu?.remove();
    menu = null;
    opened = null;
    previous?.binding.button.setAttribute('aria-expanded', 'false');
    if (returnFocus && previous?.binding.button.isConnected) previous.binding.button.focus({ preventScroll: true });
  }

  function showError(message: string, anchor?: Element): void {
    const notice = document.createElement('div');
    notice.className = 'gh-enhance-notice';
    notice.setAttribute('role', 'status');
    notice.textContent = message;
    ((anchor ?? opened?.binding.button)?.closest('[role="dialog"],dialog') ?? document.body).append(notice);
    window.setTimeout(() => notice.remove(), 3500);
  }

  function positionMenu(): void {
    if (!menu || !opened) return;
    const popup = menu;
    const binding = opened.binding;
    popup.style.visibility = 'hidden';
    popup.style.top = '0px';
    popup.style.left = '0px';
    popup.style.maxHeight = '';
    const anchor = binding.button.getBoundingClientRect();
    const origin = popup.getBoundingClientRect();
    const dialog = binding.button.closest('[role="dialog"],dialog');
    const region = dialog?.querySelector(':scope > [role="region"]');
    const bounds = region?.getBoundingClientRect();
    const topLimit = Math.max(8, bounds?.top ?? 8);
    const bottomLimit = Math.min(window.innerHeight - 8, bounds?.bottom ?? window.innerHeight - 8);
    const below = Math.max(0, bottomLimit - anchor.bottom - 4);
    const above = Math.max(0, anchor.top - topLimit - 4);
    const openAbove = below < origin.height && above > below;
    const viewportRoom = Math.max(1, bottomLimit - topLimit);
    popup.style.maxHeight = `${Math.max(1, Math.min(origin.height, Math.max(80, openAbove ? above : below), viewportRoom))}px`;
    const height = popup.getBoundingClientRect().height;
    const width = popup.getBoundingClientRect().width;
    const top = openAbove ? anchor.top - height - 4 : anchor.bottom + 4;
    const left = Math.max(8, Math.min(anchor.right - width, window.innerWidth - width - 8));
    popup.style.top = `${Math.max(topLimit, Math.min(top, bottomLimit - height)) - origin.top}px`;
    popup.style.left = `${left - origin.left}px`;
    popup.style.visibility = 'visible';
  }

  function makeItem(label: string, icon: IconName, help: string, onSelect: () => void): HTMLButtonElement {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'gh-enhance-item';
    option.setAttribute('role', 'menuitem');
    option.tabIndex = -1;
    option.title = help;
    option.innerHTML = `<span class="gh-enhance-item-icon">${iconSvg(icon)}</span><span class="gh-enhance-item-label"></span>`;
    option.querySelector('.gh-enhance-item-label')!.textContent = label;
    option.addEventListener('click', onSelect);
    return option;
  }

  function execute(command: InsertionCommand): void {
    if (!opened) return;
    const { binding, snapshot } = opened;
    try {
      binding.editor.insert(command, snapshot);
      closeMenu();
    } catch (error) {
      showError(error instanceof Error ? error.message : '无法插入', binding.button);
      closeMenu();
    }
  }

  function commandItem(command: Command): HTMLButtonElement {
    const meta = BUILT_IN_META[command];
    const option = makeItem(meta.label, meta.icon, meta.help, () => execute(command));
    option.dataset.ghCommand = command;
    return option;
  }

  function categoryItem(label: string, icon: IconName, category: MenuPage): HTMLButtonElement {
    const option = makeItem(label, icon, `打开${label}命令`, () => renderMenuPage(category));
    option.dataset.ghCategory = category;
    option.insertAdjacentHTML('beforeend', `<span class="gh-enhance-chevron">${iconSvg('right', 14)}</span>`);
    return option;
  }

  function customItem(command: CustomCommand): HTMLButtonElement {
    const option = makeItem(command.name, command.icon, command.name, () => execute({ template: command.template }));
    option.dataset.ghCustomCommand = command.id;
    return option;
  }

  function renderMenuPage(page: MenuPage, focusTarget?: string): void {
    if (!menu || !opened) return;
    opened.page = page;
    menu.replaceChildren();
    menu.setAttribute('aria-label', page === 'root' ? 'Markdown 增强' : page === 'ALERT' ? 'Alert 命令' : '自定义命令');
    if (page !== 'root') {
      const header = document.createElement('div');
      header.className = 'gh-enhance-menu-header';
      const back = document.createElement('button');
      back.type = 'button';
      back.className = 'gh-enhance-back';
      back.setAttribute('role', 'menuitem');
      back.setAttribute('aria-label', '返回主菜单');
      back.tabIndex = -1;
      back.innerHTML = `${iconSvg('left', 16)}<span>返回</span>`;
      back.addEventListener('click', () => renderMenuPage('root', page));
      const title = document.createElement('span');
      title.textContent = page === 'ALERT' ? 'Alert' : '自定义';
      header.append(back, title);
      menu.append(header);
    }

    if (page === 'root') {
      for (const item of settings.rootOrder) {
        if (item === 'ALERT') {
          if (settings.alertOrder.some((command) => !settings.hiddenBuiltIns.includes(command))) {
            menu.append(categoryItem('Alert', 'alert', 'ALERT'));
          }
        } else if (!settings.hiddenBuiltIns.includes(item as Command)) menu.append(commandItem(item as Command));
      }
      if (settings.customCommands.some((command) => command.enabled)) menu.append(categoryItem('自定义', 'sparkle', 'CUSTOM'));
    } else if (page === 'ALERT') {
      for (const command of settings.alertOrder) {
        if (!settings.hiddenBuiltIns.includes(command)) menu.append(commandItem(command));
      }
    } else {
      for (const command of settings.customCommands) {
        if (command.enabled) menu.append(customItem(command));
      }
    }
    positionMenu();
    const target = focusTarget ? menu.querySelector<HTMLButtonElement>(`[data-gh-category="${focusTarget}"]`) : null;
    const first = page === 'root'
      ? menu.querySelector<HTMLButtonElement>('[role="menuitem"]')
      : menu.querySelector<HTMLButtonElement>('.gh-enhance-item');
    (target ?? first)?.focus({ preventScroll: true });
  }

  function openMenu(binding: Binding): void {
    if (opened?.binding === binding) {
      closeMenu(true);
      return;
    }
    closeMenu();
    const snapshot = binding.editor.capture();
    if (!snapshot) {
      showError('请先在编辑器中放置光标', binding.button);
      return;
    }
    const popup = document.createElement('div');
    popup.className = 'gh-enhance-menu';
    popup.setAttribute('role', 'menu');
    popup.style.fontSize = `${settings.fontSize}px`;
    popup.addEventListener('keydown', (event) => {
      if (!menu || !opened) return;
      const options = [...menu.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')];
      const current = options.indexOf(document.activeElement as HTMLButtonElement);
      if (event.key === 'Escape' || event.key === 'ArrowLeft' && opened.page !== 'root') {
        event.preventDefault();
        if (opened.page === 'root') closeMenu(true);
        else renderMenuPage('root', opened.page);
      } else if (event.key === 'Tab') {
        event.preventDefault();
        const owner = opened.binding;
        closeMenu();
        if (event.shiftKey) owner.button.focus({ preventScroll: true });
        else if (owner.editor instanceof TextareaEditor) owner.editor.field.focus({ preventScroll: true });
        else if (owner.editor instanceof FileEditor) owner.editor.content.focus({ preventScroll: true });
      } else if (event.key === 'ArrowRight' || event.key === 'Enter' || event.key === ' ') {
        const item = options[current];
        if (item && (event.key !== 'ArrowRight' || item.dataset.ghCategory)) {
          event.preventDefault();
          item.click();
        }
      } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1
          : event.key === 'ArrowDown' ? (current + 1) % options.length : (current - 1 + options.length) % options.length;
        const option = options[next];
        option?.focus({ preventScroll: true });
        if (option) {
          const top = option.getBoundingClientRect().top - menu.getBoundingClientRect().top + menu.scrollTop;
          if (top < menu.scrollTop) menu.scrollTop = top;
          else if (top + option.offsetHeight > menu.scrollTop + menu.clientHeight) {
            menu.scrollTop = top + option.offsetHeight - menu.clientHeight;
          }
        }
      }
    });
    opened = { binding, snapshot, page: 'root' };
    menu = popup;
    const dialog = binding.button.closest('[role="dialog"],dialog');
    (dialog ?? document.body).append(popup);
    binding.button.setAttribute('aria-expanded', 'true');
    renderMenuPage('root');
  }

  function createButton(onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'gh-enhance-button';
    button.dataset.ghEnhanceButton = '';
    const label = document.documentElement.lang.toLowerCase().startsWith('en') ? 'Markdown enhancements' : 'Markdown 增强';
    button.setAttribute('aria-label', label);
    button.title = label;
    button.innerHTML = `${iconSvg('sparkle')}${iconSvg('down', 8)}`;
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
      try { return /\.(?:md|markdown)$/i.test(decodeURIComponent(location.pathname)); }
      catch { return false; }
    }
    return false;
  }

  function scan(): void {
    scanScheduled = false;
    if (disposed) return;
    const enabled = hasVisibleCommands(settings);
    for (const [mount, binding] of bindings) {
      const issueEditor = binding.editor instanceof TextareaEditor ? binding.editor : null;
      const relevant = issueEditor ? issuePage() && mount.getAttribute('for') === issueEditor.field.id : markdownFilePage();
      if (!enabled || !relevant || !mount.isConnected || !binding.editor.isWritable() || !binding.button.isConnected) {
        if (opened?.binding === binding) closeMenu();
        if (issueEditor) binding.button.remove();
        else binding.button.parentElement?.remove();
        bindings.delete(mount);
      }
    }
    if (!enabled) return;
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
    if (scanScheduled || disposed) return;
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

  function onScrollOrResize(event: Event): void {
    if (menu && !(event.type === 'scroll' && event.target instanceof Node && menu.contains(event.target))) closeMenu();
  }

  const observer = new MutationObserver(scheduleScan);
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['for', 'disabled', 'readonly'] });
  document.addEventListener('click', onOutsideClick, true);
  document.addEventListener('focusin', onFocus, true);
  document.addEventListener('input', onInput, true);
  document.addEventListener('scroll', onScrollOrResize, true);
  window.addEventListener('resize', onScrollOrResize);
  window.addEventListener('popstate', scheduleScan);
  scan();

  const stop = (() => {
    disposed = true;
    observer.disconnect();
    document.removeEventListener('click', onOutsideClick, true);
    document.removeEventListener('focusin', onFocus, true);
    document.removeEventListener('input', onInput, true);
    document.removeEventListener('scroll', onScrollOrResize, true);
    window.removeEventListener('resize', onScrollOrResize);
    window.removeEventListener('popstate', scheduleScan);
    closeMenu();
    for (const binding of bindings.values()) {
      if (binding.editor instanceof FileEditor) binding.button.parentElement?.remove();
      else binding.button.remove();
    }
    bindings.clear();
  }) as EnhancerStop;
  stop.updateSettings = (next: Settings) => {
    settings = validateSettings(next);
    closeMenu();
    scan();
  };
  return stop;
}
