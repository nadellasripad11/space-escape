// oxy the mascot as an inline svg wrapped in a sized span (animated by css, see style.css)
import { MASCOT } from './mascot-data.js';

export const oxy = (expr, px, cls) =>
  '<span class="mascot ' + (cls || '') + '" style="width:' + px + 'px;height:' + px + 'px">' + MASCOT[expr || 'idle'] + '</span>';
