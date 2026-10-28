/** The public site's light/dark switch. The choice lives on <html data-site-theme> (dark when absent). */
export const THEME_KEY = 'v2-theme';

export const isLight = () => typeof document !== 'undefined' && document.documentElement.dataset.siteTheme === 'light';

/** The ten cell tones of the pixel records: eight neutrals (dark → bright source luminance), then blue and amber. */
const DARK = ['70,68,64', '92,90,85', '118,115,109', '146,142,135', '174,169,161', '200,195,187', '224,218,209', '244,238,229', '107,149,255', '244,176,98'];
const LIGHT = ['214,210,202', '192,188,180', '166,162,155', '138,134,128', '108,105,99', '78,76,71', '52,50,46', '30,29,27', '58,92,220', '214,128,30'];

export const tones = () => (isLight() ? LIGHT : DARK);
