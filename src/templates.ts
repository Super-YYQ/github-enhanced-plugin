import type { Insertion } from './commands';

export type TemplateValidation = { valid: true } | { valid: false; position: number; message: string };

interface Token {
  kind: 'text' | 'selection' | 'cursor';
  value?: string;
}

function parseTemplate(template: string): { tokens: Token[]; validation: TemplateValidation } {
  const tokens: Token[] = [];
  let offset = 0;
  let cursorSeen = false;
  while (offset < template.length) {
    const open = template.indexOf('{{', offset);
    const strayClose = template.indexOf('}}', offset);
    if (strayClose !== -1 && (open === -1 || strayClose < open)) {
      return { tokens, validation: { valid: false, position: strayClose, message: '多余的 }}' } };
    }
    if (open === -1) {
      tokens.push({ kind: 'text', value: template.slice(offset) });
      break;
    }
    if (open > offset) tokens.push({ kind: 'text', value: template.slice(offset, open) });
    const close = template.indexOf('}}', open + 2);
    if (close === -1 || template.indexOf('{{', open + 2) < close && template.indexOf('{{', open + 2) !== -1) {
      return { tokens, validation: { valid: false, position: open, message: '占位符未闭合' } };
    }
    const name = template.slice(open + 2, close);
    if (name !== 'selection' && name !== 'cursor') {
      return { tokens, validation: { valid: false, position: open, message: `不支持的占位符：{{${name}}}` } };
    }
    if (name === 'cursor' && cursorSeen) {
      return { tokens, validation: { valid: false, position: open, message: '{{cursor}} 只能出现一次' } };
    }
    if (name === 'cursor') cursorSeen = true;
    tokens.push({ kind: name });
    offset = close + 2;
  }
  return { tokens, validation: { valid: true } };
}

export function validateTemplate(template: string): TemplateValidation {
  return parseTemplate(template).validation;
}

export function renderTemplate(template: string, selected: string): Insertion {
  const parsed = parseTemplate(template);
  if (!parsed.validation.valid) throw new Error(`${parsed.validation.message}（位置 ${parsed.validation.position + 1}）`);
  let insert = '';
  let caret: number | null = null;
  for (const token of parsed.tokens) {
    if (token.kind === 'text') insert += token.value ?? '';
    else if (token.kind === 'selection') insert += selected;
    else caret = insert.length;
  }
  const position = caret ?? insert.length;
  return { insert, selection: { from: position, to: position } };
}
