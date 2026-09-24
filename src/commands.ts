export type Command = 'NOTE' | 'TIP' | 'IMPORTANT' | 'WARNING' | 'CAUTION' | 'DETAILS' | 'KEYBOARD' | 'DIFF';

export interface Selection {
  from: number;
  to: number;
}

export interface EditResult {
  text: string;
  selection: Selection;
}

export interface Insertion {
  insert: string;
  selection: Selection;
}

export class CommandUnavailable extends Error {}

function blockSpacing(before: string, after: string, eol: string): { prefix: string; suffix: string } {
  return {
    prefix: before.length === 0 || /(?:\r?\n){2}$/.test(before) ? '' : before.endsWith('\n') ? eol : eol + eol,
    suffix: after.length === 0 || /^(?:\r?\n){2}/.test(after) ? '' : /^\r?\n/.test(after) ? eol : eol + eol,
  };
}

function assertTopLevelContext(before: string): void {
  const currentLine = before.slice(before.lastIndexOf('\n') + 1);
  if (/^(?: {0,3}>| {2,}|\t| {0,3}(?:[-*+] |\d+[.)] ))/.test(currentLine)) {
    throw new CommandUnavailable('请在顶层段落插入此块');
  }
  let fence: { marker: string; length: number } | null = null;
  for (const line of before.split(/\r?\n/)) {
    const match = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (!match) continue;
    if (!fence) fence = { marker: match[1][0], length: match[1].length };
    else if (match[1][0] === fence.marker && match[1].length >= fence.length && /^\s*$/.test(match[2])) fence = null;
  }
  if (fence) throw new CommandUnavailable('请在代码围栏外插入此块');
}

export function createInsertion(command: Command, context: { before: string; selected: string; after: string }): Insertion {
  const { before, selected, after } = context;
  const eol = /\r\n/.test(before + selected + after) ? '\r\n' : '\n';
  if (command === 'KEYBOARD') {
    if (/\r|\n/.test(selected)) throw new CommandUnavailable('请选择单行文字');
    const content = selected ? selected.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '按键';
    const insert = `<kbd>${content}</kbd>`;
    const selection = selected
      ? { from: insert.length, to: insert.length }
      : { from: 5, to: 5 + content.length };
    return { insert, selection };
  }
  assertTopLevelContext(before);

  let block: string;
  let selectionInBlock: Selection;
  if (['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION'].includes(command)) {
    const header = `> [!${command}]${eol}> `;
    const body = selected.length ? selected.split(/\r?\n/).join(`${eol}> `) : '在这里输入内容';
    block = header + body;
    selectionInBlock = selected.length
      ? { from: block.length, to: block.length }
      : { from: header.length, to: header.length + body.length };
  } else if (command === 'DETAILS') {
    const heading = `<details>${eol}<summary>`;
    const title = '展开查看';
    const body = selected || '在这里输入内容';
    block = `${heading}${title}</summary>${eol}${eol}${body}${eol}${eol}</details>`;
    selectionInBlock = { from: heading.length, to: heading.length + title.length };
  } else if (command === 'DIFF') {
    const longestFence = Math.max(0, ...[...selected.matchAll(/`+/g)].map((match) => match[0].length));
    const fence = '`'.repeat(Math.max(3, longestFence + 1));
    const header = `${fence}diff${eol}`;
    const body = selected || `- 原内容${eol}+ 新内容`;
    block = `${header}${body}${eol}${fence}`;
    selectionInBlock = selected.length
      ? { from: block.length, to: block.length }
      : { from: header.length, to: header.length + body.length };
  } else {
    throw new CommandUnavailable('尚未支持此命令');
  }
  const { prefix, suffix } = blockSpacing(before, after, eol);
  const insert = prefix + block + suffix;
  const selection = {
    from: prefix.length + selectionInBlock.from,
    to: prefix.length + selectionInBlock.to,
  };
  return { insert, selection };
}

export function createEdit(command: Command, snapshot: { text: string; from: number; to: number }): EditResult {
  const { text, from, to } = snapshot;
  if (from < 0 || to < from || to > text.length) throw new CommandUnavailable('选区已失效');
  const insertion = createInsertion(command, {
    before: text.slice(0, from),
    selected: text.slice(from, to),
    after: text.slice(to),
  });
  return {
    text: text.slice(0, from) + insertion.insert + text.slice(to),
    selection: { from: from + insertion.selection.from, to: from + insertion.selection.to },
  };
}
