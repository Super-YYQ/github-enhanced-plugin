import { startEnhancer } from './mount';
import { loadSettings, settingsFromChange } from './settings';

async function boot(): Promise<void> {
  const { settings } = await loadSettings();
  const controller = startEnhancer(settings);
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    const next = settingsFromChange(changes);
    if (next) controller.updateSettings(next);
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { void boot(); }, { once: true });
else void boot();
