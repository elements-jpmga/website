// Extraction check against the developer-pack samples (needs tools/ocr built and python3 + PyMuPDF).
import { extractUbio } from '../src/extract.mjs';
import path from 'node:path';
const pack = path.resolve('../Elements_Restore_Web_App_Developer_Pack');
for (const f of ['04_Leslie_UBIO_Stress_Sample.pdf', '05_Leslie_UBIO_Vascular_Sample.pdf']) {
  const r = await extractUbio(path.join(pack, f), '/tmp/restore-check.png');
  console.log(f, '→', r.kind);
  for (const [k, v] of Object.entries(r.fields)) console.log('  ', k.padEnd(20), JSON.stringify(v));
}
