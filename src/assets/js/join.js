// Join page: fill the widget snippet with the chosen member id and add copy buttons.

function initWidgetPicker() {
  const widget = document.querySelector('[data-widget]');
  if (!widget) return;

  const picker = widget.querySelector('[data-widget-picker]');
  const select = picker.querySelector('select');
  const snippet = widget.querySelector('[data-widget-snippet]');
  const template = snippet.dataset.template;

  // Only offer the picker once there are members to pick from.
  if (select.options.length > 1) {
    picker.hidden = false;
    select.addEventListener('change', () => {
      snippet.value = template.replaceAll('{id}', select.value);
    });
  }
}

function initCopyButtons() {
  const status = document.querySelector('[data-copy-status]');
  if (!navigator.clipboard) return;

  for (const button of document.querySelectorAll('[data-copy]')) {
    const source = document.getElementById(button.dataset.copy);
    button.hidden = false;
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(source.value);
        status.textContent = 'Copied to clipboard.';
      } catch {
        source.select();
        status.textContent = 'Press Ctrl+C (or Cmd+C) to copy.';
      }
    });
  }
}

initWidgetPicker();
initCopyButtons();
