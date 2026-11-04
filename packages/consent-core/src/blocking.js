/** Only explicitly inert, site-owned elements are activated. Never intercept already-running tags. */
export function bindElements(manager, doc, rules = []) {
  const activated = new WeakSet();
  const sync = () => {
    for (const node of doc.querySelectorAll('script[type="text/plain"],iframe[data-src]')) {
      const source = node.getAttribute('src') || node.dataset.src || '';
      const category =
        node.dataset.consentCategory ||
        rules.find((r) =>
          r.match.kind === 'exact' ? source === r.match.value : source.startsWith(r.match.value),
        )?.category;
      const allowed = manager.isAllowed(category);
      if (node.tagName === 'IFRAME') {
        if (allowed && !activated.has(node)) {
          node.src = node.dataset.src;
          activated.add(node);
        } else if (!allowed && activated.has(node)) {
          node.removeAttribute('src');
          activated.delete(node);
        }
      } else if (allowed && !activated.has(node)) {
        activated.add(node);
        const script = doc.createElement('script');
        for (const attr of node.attributes)
          if (!['type', 'data-consent-category'].includes(attr.name))
            script.setAttribute(attr.name, attr.value);
        script.type = node.dataset.scriptType || 'text/javascript';
        script.textContent = node.textContent;
        if (!node.hasAttribute('async')) script.async = false;
        node.after(script);
      }
    }
  };
  const reopen = (e) => {
    if (e.target.closest?.('[data-consent-preferences]')) manager.showPreferences();
  };
  doc.addEventListener('click', reopen);
  const off = manager.onConsentChange(sync);
  sync();
  const observer = new MutationObserver(sync);
  observer.observe(doc.documentElement, { childList: true, subtree: true });
  return () => {
    doc.removeEventListener('click', reopen);
    off();
    observer.disconnect();
  };
}
