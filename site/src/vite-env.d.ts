/// <reference types="vite/client" />

// @fontsource packages ship a plain index.css with no "types" field; these
// are side-effect-only imports (self-hosted font-face declarations), so an
// ambient declaration is enough for tsc without affecting the runtime bundle.
declare module "@fontsource-variable/big-shoulders-display";
declare module "@fontsource-variable/hanken-grotesk";
declare module "@fontsource/ibm-plex-mono";
