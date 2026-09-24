import { Command, CommandUnavailable, createInsertion } from './commands';
import { renderTemplate } from './templates';

export type InsertionCommand = Command | { template: string };

function insertionFor(command: InsertionCommand, context: { before: string; selected: string; after: string }) {
  return typeof command === 'string' ? createInsertion(command, context) : renderTemplate(command.template, context.selected);
}

export interface TextareaSnapshot {
  kind: 'textarea';
  text: string;
  from: number;
  to: number;
  source: HTMLTextAreaElement;
  url: string;
}

export interface FileSnapshot {
  kind: 'file';
  source: HTMLElement;
  url: string;
  html: string;
  range: Range;
  before: string;
  selected: string;
  after: string;
}

export type EditorSnapshot = TextareaSnapshot | FileSnapshot;

export interface EditorAdapter {
  readonly element: Element;
  isWritable(): boolean;
  capture(): EditorSnapshot | null;
  insert(command: InsertionCommand, snapshot: EditorSnapshot): void;
}

export class TextareaEditor implements EditorAdapter {
  constructor(readonly field: HTMLTextAreaElement) {}

  get element(): Element { return this.field; }

  isWritable(): boolean {
    return this.field.isConnected && !this.field.disabled && !this.field.readOnly;
  }

  capture(): TextareaSnapshot | null {
    if (!this.isWritable()) return null;
    return {
      kind: 'textarea',
      text: this.field.value,
      from: this.field.selectionStart,
      to: this.field.selectionEnd,
      source: this.field,
      url: location.href,
    };
  }

  insert(command: InsertionCommand, snapshot: EditorSnapshot): void {
    if (snapshot.kind !== 'textarea' || !this.isWritable() || snapshot.source !== this.field || snapshot.url !== location.href || snapshot.text !== this.field.value) {
      throw new CommandUnavailable('编辑器内容已变化，请重新选择');
    }
    if (snapshot.from !== this.field.selectionStart || snapshot.to !== this.field.selectionEnd) {
      throw new CommandUnavailable('选区已变化，请重新选择');
    }

    const insertion = insertionFor(command, {
      before: snapshot.text.slice(0, snapshot.from),
      selected: snapshot.text.slice(snapshot.from, snapshot.to),
      after: snapshot.text.slice(snapshot.to),
    });
    this.field.focus();
    this.field.setSelectionRange(snapshot.from, snapshot.to);
    if (!document.execCommand('insertText', false, insertion.insert)) {
      throw new CommandUnavailable('此编辑器未接受原生插入');
    }
    const expected = snapshot.text.slice(0, snapshot.from) + insertion.insert + snapshot.text.slice(snapshot.to);
    if (this.field.value !== expected) {
      throw new CommandUnavailable('插入结果与预期不一致');
    }
    this.field.setSelectionRange(
      snapshot.from + insertion.selection.from,
      snapshot.from + insertion.selection.to,
    );
  }
}

function linePart(content: HTMLElement, range: Range, side: 'before' | 'after'): string {
  const node = side === 'before' ? range.startContainer : range.endContainer;
  const element = node instanceof Element ? node : node.parentElement;
  const line = element?.closest('.cm-line') ?? content;
  const part = document.createRange();
  part.selectNodeContents(line);
  if (side === 'before') part.setEnd(range.startContainer, range.startOffset);
  else part.setStart(range.endContainer, range.endOffset);
  const text = part.toString();
  if (text) return text;
  if (line === content) return '';
  if (side === 'before' && line.previousElementSibling?.matches('.cm-line')) {
    return `${line.previousElementSibling.textContent ?? ''}\n`;
  }
  if (side === 'after' && line.nextElementSibling?.matches('.cm-line')) {
    return `\n${line.nextElementSibling.textContent ?? ''}`;
  }
  return '';
}

function selectInsertedText(content: HTMLElement, insertion: { insert: string; selection: { from: number; to: number } }): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount !== 1) return;
  const caret = selection.getRangeAt(0);
  const node = caret.endContainer;
  const element = node instanceof Element ? node : node.parentElement;
  const line = element?.closest('.cm-line');
  const lines = [...content.querySelectorAll<HTMLElement>('.cm-line')];
  const lineIndex = line ? lines.indexOf(line as HTMLElement) : -1;
  if (lineIndex < 0) return;

  const beforeCaret = document.createRange();
  beforeCaret.selectNodeContents(line!);
  beforeCaret.setEnd(node, caret.endOffset);
  const caretOffset = lines.slice(0, lineIndex).reduce((sum, item) => sum + item.textContent!.length + 1, 0) + beforeCaret.toString().length;
  const start = caretOffset - insertion.insert.length + insertion.selection.from;
  const end = caretOffset - insertion.insert.length + insertion.selection.to;
  if (start < 0) return;

  function locate(offset: number): { node: Node; offset: number } | null {
    for (const item of lines) {
      const length = item.textContent?.length ?? 0;
      if (offset <= length) {
        const walker = document.createTreeWalker(item, NodeFilter.SHOW_TEXT);
        let textNode = walker.nextNode();
        while (textNode) {
          const size = textNode.textContent?.length ?? 0;
          if (offset <= size) return { node: textNode, offset };
          offset -= size;
          textNode = walker.nextNode();
        }
        return offset === 0 ? { node: item, offset: 0 } : null;
      }
      offset -= length + 1;
    }
    return null;
  }

  const from = locate(start);
  const to = locate(end);
  if (!from || !to) return;
  const range = document.createRange();
  range.setStart(from.node, from.offset);
  range.setEnd(to.node, to.offset);
  selection.removeAllRanges();
  selection.addRange(range);
}

export class FileEditor implements EditorAdapter {
  constructor(readonly element: Element, readonly content: HTMLElement) {}

  isWritable(): boolean {
    return this.element.isConnected && this.content.isConnected && this.content.getAttribute('contenteditable') === 'true';
  }

  capture(): FileSnapshot | null {
    const selection = window.getSelection();
    if (!this.isWritable() || !selection || selection.rangeCount !== 1) return null;
    const range = selection.getRangeAt(0).cloneRange();
    if (!this.content.contains(range.startContainer) || !this.content.contains(range.endContainer)) return null;
    return {
      kind: 'file',
      source: this.content,
      url: location.href,
      html: this.content.innerHTML,
      range,
      before: linePart(this.content, range, 'before'),
      selected: range.toString(),
      after: linePart(this.content, range, 'after'),
    };
  }

  insert(command: InsertionCommand, snapshot: EditorSnapshot): void {
    if (snapshot.kind !== 'file' || snapshot.source !== this.content || snapshot.url !== location.href ||
      snapshot.html !== this.content.innerHTML || !this.isWritable() ||
      !this.content.contains(snapshot.range.startContainer) || !this.content.contains(snapshot.range.endContainer)) {
      throw new CommandUnavailable('编辑器内容已变化，请重新选择');
    }
    const insertion = insertionFor(command, {
      before: snapshot.before,
      selected: snapshot.selected,
      after: snapshot.after,
    });
    this.content.focus();
    const selection = window.getSelection();
    if (!selection) throw new CommandUnavailable('无法恢复选区');
    selection.removeAllRanges();
    selection.addRange(snapshot.range);
    if (!document.execCommand('insertText', false, insertion.insert)) {
      throw new CommandUnavailable('此文件编辑器未接受原生插入');
    }
    if (this.content.innerHTML === snapshot.html) {
      throw new CommandUnavailable('文件编辑器未确认本次插入');
    }
    selectInsertedText(this.content, insertion);
  }
}
