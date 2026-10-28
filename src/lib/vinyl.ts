/**
 * The vinyl record shared by the landing loader and the landing records.
 *
 * It is drawn in greys into a tiny offscreen canvas (2 pixels per cell) and read back as cells: the darker the
 * pixel, the more ink the cell gets. So a record is a black disc with a pale track gap, a sheen that sweeps
 * round as it spins, and a pale label whose marking turns with the record.
 */

/** What is printed on the label. It rotates with the record, so even a still frame shows which way it spins. */
export type Label = 'half' | 'quarter' | 'ring' | 'solid';

/** Eight ink tones for the cells, from full ink to the faintest wash, on the warm paper page. */
export const INK = ['26,25,23', '52,50,47', '78,76,72', '104,101,96', '132,129,123', '160,157,150', '188,185,178', '214,211,204'];

/** The cell tone (an index into INK) for a drawn grey: dark pixels get the most ink. */
export const toneOf = (lum: number) => Math.min(7, Math.max(0, Math.floor(lum / 32)));

const grey = (v: number, a = 1) => `rgba(${v},${v},${v},${a})`;

/** Draws one record centred on (cx, cy), radius R, in raster pixels (`S` is raster pixels per cell). */
export function drawVinyl(c: CanvasRenderingContext2D, cx: number, cy: number, R: number, S: number, ang: number, label: Label) {
  const circle = (rad: number) => {
    c.beginPath();
    c.arc(cx, cy, Math.max(0, rad), 0, Math.PI * 2);
  };
  const lab = R * 0.4;

  // a solid black disc with one pale track gap, both wide enough to survive being drawn in whole cells
  c.fillStyle = grey(22);
  circle(R);
  c.fill();
  c.strokeStyle = grey(150);
  c.lineWidth = S * 1.3;
  circle(lab + (R - lab) * 0.58);
  c.stroke();

  // two opposite sheens that sweep round as the record spins
  c.fillStyle = grey(255, 0.34);
  for (let q = 0; q < 2; q++) {
    const s0 = ang + q * Math.PI;
    c.beginPath();
    c.moveTo(cx + Math.cos(s0) * lab * 1.2, cy + Math.sin(s0) * lab * 1.2);
    c.arc(cx, cy, Math.max(0, R - S * 0.6), s0 - 0.22, s0 + 0.22);
    c.lineTo(cx + Math.cos(s0 - 0.22) * lab * 1.2, cy + Math.sin(s0 - 0.22) * lab * 1.2);
    c.closePath();
    c.fill();
  }

  // the label: pale, with a dark marking that turns with the record
  c.fillStyle = grey(236);
  circle(lab);
  c.fill();
  c.fillStyle = grey(22);
  c.strokeStyle = grey(22);
  if (label === 'half' || label === 'quarter') {
    c.beginPath();
    c.moveTo(cx, cy);
    c.arc(cx, cy, lab, ang, ang + (label === 'half' ? Math.PI : Math.PI / 2));
    c.closePath();
    c.fill();
  } else {
    if (label === 'ring') {
      c.lineWidth = S * 0.7;
      circle(lab * 0.64);
      c.stroke();
    }
    c.beginPath();
    c.arc(cx + Math.cos(ang) * lab * 0.64, cy + Math.sin(ang) * lab * 0.64, S * 0.55, 0, Math.PI * 2);
    c.fill();
  }

  // the spindle hole, cut right through
  c.globalCompositeOperation = 'destination-out';
  c.fillStyle = '#000';
  circle(S * 0.7);
  c.fill();
  c.globalCompositeOperation = 'source-over';
}
