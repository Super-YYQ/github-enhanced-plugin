import type { Command } from './commands';
import type { IconName } from './icons';

export const BUILT_IN_META: Record<Command, { label: string; help: string; icon: IconName }> = {
  NOTE: { label: 'Note', help: '补充说明', icon: 'note' },
  TIP: { label: 'Tip', help: '建议与技巧', icon: 'tip' },
  IMPORTANT: { label: 'Important', help: '重要信息', icon: 'important' },
  WARNING: { label: 'Warning', help: '潜在风险', icon: 'warning' },
  CAUTION: { label: 'Caution', help: '严重风险', icon: 'caution' },
  DETAILS: { label: 'Details', help: '折叠内容', icon: 'details' },
  KEYBOARD: { label: 'Keyboard', help: '键盘按键', icon: 'keyboard' },
  DIFF: { label: 'Diff', help: '差异代码块', icon: 'diff' },
};
