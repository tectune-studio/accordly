export function createUI(config, manager) {
  let root = null,
    returnFocus = null;
  return {
    show() {
      if (typeof document === 'undefined') throw new Error('UI requires a browser');
      if (root) {
        root.shadowRoot.querySelector('button')?.focus();
        return;
      }
      returnFocus = document.activeElement;
      root = document.createElement('div');
      if (/^#[a-f0-9]{6}$/i.test(config.brandColor || ''))
        root.style.setProperty('--ck-accent', config.brandColor);
      const shadow = root.attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      style.textContent = `:host{all:initial;position:fixed;inset:0;z-index:2147483647;background:#10182866;display:flex;align-items:flex-end;justify-content:center;padding:20px;box-sizing:border-box;font:14px/1.5 system-ui;color:#172b29}*{box-sizing:border-box}.panel{background:white;border:1px solid #d5dfdc;border-radius:18px;padding:28px;width:min(540px,100%);max-height:85vh;overflow:auto;box-shadow:0 20px 80px #102c2933}h2{font-size:23px;margin:0 0 8px}p{color:#536b65}label{display:flex;gap:12px;align-items:flex-start;padding:13px 0;border-bottom:1px solid #edf1ef}input{margin-top:5px;accent-color:var(--ck-accent,#16836c);width:18px;height:18px}small{display:block;color:#536b65}footer{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}button{background:#eff6f3;color:#172b29;border:1px solid #cadbd4;border-radius:8px;padding:11px 15px;cursor:pointer;font:600 13px system-ui}button:focus-visible,a:focus-visible,input:focus-visible{outline:3px solid #157c66;outline-offset:3px}button.primary{background:var(--ck-accent,#166b58);color:white;border-color:var(--ck-accent,#166b58)}a{color:#166b58}`;
      shadow.append(style);
      const panel = document.createElement('section');
      panel.className = 'panel';
      panel.role = config.consentWall === false ? 'region' : 'dialog';
      if (config.theme) {
        panel.style.background = config.theme.background;
        panel.style.color = config.theme.foreground;
        panel.style.fontFamily = config.theme.fontFamily;
        root.style.alignItems = { top: 'flex-start', bottom: 'flex-end', center: 'center' }[
          config.theme.position
        ];
      }
      if (config.consentWall === false) {
        root.style.background = 'transparent';
        root.style.pointerEvents = 'none';
        panel.style.pointerEvents = 'auto';
      }
      if (config.consentWall !== false) panel.setAttribute('aria-modal', 'true');
      panel.setAttribute('aria-labelledby', 'ck-title');
      const heading = document.createElement('h2');
      heading.id = 'ck-title';
      heading.textContent = config.title || 'Your privacy, your choice';
      const description = document.createElement('p');
      description.textContent =
        config.description ||
        'Choose which optional services may run on this website. You can change your mind at any time.';
      panel.append(heading, description);
      const selected = manager.hasDecision()
        ? manager.getConsent()
        : Object.fromEntries(config.purposes.map((p) => [p.id, p.required]));
      for (const p of config.purposes) {
        const label = document.createElement('label');
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = selected[p.id];
        input.disabled = p.required;
        input.addEventListener('change', () => {
          selected[p.id] = input.checked;
        });
        const text = document.createElement('span');
        text.textContent = p.name + (p.required ? ' · always active' : '');
        const detail = document.createElement('small');
        detail.textContent = p.description;
        text.append(detail);
        label.append(input, text);
        panel.append(label);
      }
      if (config.privacyUrl) {
        try {
          const url = new URL(config.privacyUrl);
          if (['https:', 'http:'].includes(url.protocol)) {
            const link = document.createElement('a');
            link.href = url.href;
            link.textContent = 'Privacy policy';
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            panel.append(link);
          }
        } catch {}
      }
      const footer = document.createElement('footer');
      for (const [label, click] of [
        [config.text?.rejectAll || 'Reject optional', manager.rejectAll],
        [config.text?.acceptAll || 'Accept all', manager.acceptAll],
        [config.text?.save || 'Save preferences', () => manager.setConsent(selected)],
      ]) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        if (label === 'Save preferences') button.className = 'primary';
        button.onclick = click;
        footer.append(button);
      }
      panel.append(footer);
      shadow.append(panel);
      shadow.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && manager.hasDecision()) manager.close();
        if (e.key !== 'Tab' || config.consentWall === false) return;
        const focusable = [...shadow.querySelectorAll('button,input:not(:disabled),a')];
        const first = focusable[0],
          last = focusable.at(-1);
        if (e.shiftKey && shadow.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && shadow.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      });
      document.body.append(root);
      shadow.querySelector('input:not(:disabled),button')?.focus();
    },
    close() {
      root?.remove();
      root = null;
      returnFocus?.focus?.();
    },
  };
}
