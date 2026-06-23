// Load the custom Hygiena typeface via the FontFace JS API.
// This bypasses CSS @font-face issues seen in sandboxed iframes.
(async () => {
  try {
    const [regBuf, boldBuf] = await Promise.all([
      fetch('fonts/hygiena-regular.ttf').then(r => r.arrayBuffer()),
      fetch('fonts/hygiena-bold.ttf').then(r => r.arrayBuffer()),
    ]);
    const regular = new FontFace('Hygiena', regBuf, { weight: '400', style: 'normal' });
    const bold    = new FontFace('Hygiena', boldBuf, { weight: '700', style: 'normal' });
    const semi    = new FontFace('Hygiena', boldBuf, { weight: '600', style: 'normal' });
    await Promise.all([regular.load(), bold.load(), semi.load()]);
    document.fonts.add(regular);
    document.fonts.add(bold);
    document.fonts.add(semi);
    document.documentElement.classList.add('hygiena-loaded');
  } catch (e) {
    console.warn('Hygiena font load failed:', e);
  }
})();
