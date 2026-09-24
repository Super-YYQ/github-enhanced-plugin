const shapes = {
  sparkle: '<path d="m8 1 1.6 5.4L15 8l-5.4 1.6L8 15l-1.6-5.4L1 8l5.4-1.6L8 1Z"/><path d="m2 1 .4 1.6L4 3l-1.6.4L2 5l-.4-1.6L0 3l1.6-.4L2 1Z"/>',
  alert: '<path d="M8 1.5 15 14H1L8 1.5Z"/><path d="M8 6v3.5M8 12h.01"/>',
  note: '<circle cx="8" cy="8" r="6.5"/><path d="M8 7v4M8 5h.01"/>',
  tip: '<path d="M5.5 11.5h5M6 13.5h4M5 9.5C3.8 8.6 3 7.2 3 5.8a5 5 0 0 1 10 0c0 1.4-.8 2.8-2 3.7-.5.4-.8.9-.8 1.5H5.8c0-.6-.3-1.1-.8-1.5Z"/>',
  important: '<circle cx="8" cy="8" r="6.5"/><path d="M8 4.5v4.5M8 11.5h.01"/>',
  warning: '<path d="M8 1.5 15 14H1L8 1.5Z"/><path d="M8 6v3.5M8 12h.01"/>',
  caution: '<path d="M4 2h8l2 2v8l-2 2H4l-2-2V4l2-2Z"/><path d="M8 5v4M8 11h.01"/>',
  details: '<rect x="1.5" y="2" width="13" height="12" rx="2"/><path d="M5 6.5 7 8l-2 1.5M9 8h3"/>',
  keyboard: '<rect x="1" y="3" width="14" height="10" rx="2"/><path d="M4 6h.01M7 6h.01M10 6h.01M4 9h.01M7 9h.01M10 9h.01M4 11h8"/>',
  diff: '<path d="M5 2v12M2 5h6M12 2v12M9 11h6"/>',
  bookmark: '<path d="M3 2h10v12l-5-3-5 3V2Z"/>',
  code: '<path d="m5.5 4-4 4 4 4M10.5 4l4 4-4 4M9 2l-2 12"/>',
  check: '<circle cx="8" cy="8" r="6.5"/><path d="m4.5 8 2.5 2.5 4.5-5"/>',
  info: '<circle cx="8" cy="8" r="6.5"/><path d="M8 7v4M8 5h.01"/>',
  quote: '<path d="M6.5 5H3v5h3.5l-2 3M13 5H9.5v5H13l-2 3"/>',
  terminal: '<rect x="1.5" y="2" width="13" height="12" rx="2"/><path d="m4 5 2.5 2.5L4 10M8 10h4"/>',
  list: '<path d="M5 4h9M5 8h9M5 12h9M2 4h.01M2 8h.01M2 12h.01"/>',
  right: '<path d="m6 3 5 5-5 5"/>',
  left: '<path d="m10 3-5 5 5 5"/>',
  down: '<path d="m3 6 5 5 5-5"/>',
  up: '<path d="m3 10 5-5 5 5"/>',
  plus: '<path d="M8 2v12M2 8h12"/>',
  trash: '<path d="M3 4h10M6 4V2h4v2M4 4l.6 10h6.8L12 4M6.5 7v4M9.5 7v4"/>',
  edit: '<path d="m3 10 7.5-7.5 3 3L6 13H3v-3ZM9.5 3.5l3 3"/>',
  download: '<path d="M8 1v9m0 0 3-3m-3 3L5 7M2 11v3h12v-3"/>',
  upload: '<path d="M8 10V1m0 0 3 3M8 1 5 4M2 11v3h12v-3"/>',
} as const;

export type IconName = keyof typeof shapes;

export function iconSvg(name: IconName, size = 16): string {
  return `<svg aria-hidden="true" viewBox="0 0 16 16" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${shapes[name]}</svg>`;
}
