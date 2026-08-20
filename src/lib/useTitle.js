import { useEffect } from "react";

/**
 * Set the document title for a page.
 *
 * Next handled this through route metadata; a single-page app has to do it
 * itself. It matters more than it looks: the title is what a tab, a bookmark and
 * an Android task-switcher card show, and every screen reading "ZOEVERSE" makes
 * a person with three tabs open guess which one they were filling in.
 *
 * THE TITLE NEVER NAMES THE FACILITY. A tab reading "Federal Neuro-Psychiatric
 * Hospital" is visible to anybody glancing at the phone, and on a shared handset
 * that is a diagnosis on screen. Screens use their own generic name instead.
 */
export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — ZOEVERSE` : "ZOEVERSE";
  }, [title]);
}
