import { Platform } from 'react-native';

/**
 * Web-only scrollbar theming (v12; recolored v13).
 *
 * React Native styles can't reach scrollbar pseudo-elements, and the
 * browser default (thick, white track/thumb on Chromium) clashes with the
 * theme on every scrollable view. So on web we inject one global
 * stylesheet at startup: thin bars, transparent track, a translucent
 * navy thumb (dark-on-light since the v13 light theme), rounded.
 * `::-webkit-scrollbar` covers Chromium/WebKit; `scrollbar-width` +
 * `scrollbar-color` cover Firefox. The rules are unscoped (plus a
 * universal Firefox rule) so every ScrollView/FlatList in the app —
 * present and future — picks them up. No-op on native.
 */

const STYLE_ID = 'miniledger-scrollbar-style';

/** Translucent navy ink — visible on #F6F8FA/white, never a solid block. */
const THUMB = 'rgba(10, 37, 64, 0.2)';
const THUMB_HOVER = 'rgba(10, 37, 64, 0.34)';

const CSS = `
  * {
    scrollbar-width: thin;
    scrollbar-color: ${THUMB} transparent;
  }
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: ${THUMB};
    border-radius: 999px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: ${THUMB_HOVER};
  }
  ::-webkit-scrollbar-corner {
    background: transparent;
  }
`;

interface WebStyleElement {
  id: string;
  textContent: string;
}

interface WebDocument {
  getElementById: (id: string) => unknown;
  createElement: (tag: 'style') => WebStyleElement;
  head: { appendChild: (el: WebStyleElement) => void };
}

export function injectScrollbarStyles(): void {
  if (Platform.OS !== 'web') return;
  const doc = (globalThis as unknown as { document?: WebDocument }).document;
  if (!doc || doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  doc.head.appendChild(style);
}
