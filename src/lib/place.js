/**
 * "Idi-Araba · Mushin", but just "Ikeja" when the area and the LGA are the same
 * word.
 *
 * Several Lagos LGAs share their name with their central neighbourhood, so a
 * naive join renders "Ikeja · Ikeja". It reads like a bug, and on a screen whose
 * whole job is helping somebody tell two similar hospitals apart, a line that
 * looks broken undermines the thing it is there to do.
 */
export function formatPlace(area, lga) {
  const a = String(area ?? "").trim();
  const l = String(lga ?? "").trim();
  // A facility somebody added themselves has no LGA until it is approved.
  // Joining an empty one produces a trailing "· " that reads as a bug.
  if (!l) return a;
  if (!a) return l;
  if (a.toLowerCase() === l.toLowerCase()) return l;
  return `${a} · ${l}`;
}
