import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const handlerPath = resolve(here, "handler.py");
const handlerB64 = readFileSync(handlerPath).toString("base64");

const startCommand = [
  "bash",
  "-lc",
  '"set -e; python -m pip install --no-cache-dir runpod; mkdir -p /worker; printf \'%s\' \\"$RUNPOD_HANDLER_B64\\" | base64 -d > /worker/handler.py; exec python -u /worker/handler.py"',
].join(" ");

console.log(`Container image:
alleninstituteforai/olmocr:latest-with-model

Start command:
${startCommand}

Environment variables:
RUNPOD_HANDLER_B64=${handlerB64}
OLMOCR_MODEL=olmocr
OLMOCR_WORKERS=1
OLMOCR_MAX_CONCURRENT_REQUESTS=1
OLMOCR_TIMEOUT_SECONDS=900

Recommended endpoint settings:
Type: Queue
GPU: 24 GB VRAM minimum; 48 GB is safer for larger legal PDFs
Container disk: 80 GB or more if Runpod shows a disk/container storage field
`);
