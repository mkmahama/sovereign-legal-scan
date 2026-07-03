# Runpod olmOCR Worker

This folder contains the Runpod Serverless handler used by the app's
Convert2text (`C2T`) flow.

The preferred deployment path is **no custom build**: run AllenAI's official
olmOCR image directly on Runpod and inject this small handler through an
environment variable. This avoids GitHub Actions and local Docker Desktop disk
limits when unpacking the very large CUDA/model layers.

## Preferred: Direct Runpod Deployment

Print the exact values to paste into Runpod:

```bash
node runpod/olmocr-worker/print-direct-deploy-config.mjs
```

In Runpod, choose **Serverless > New Endpoint > Deploy from a Docker image**.

```text
Container image: alleninstituteforai/olmocr:latest-with-model
Start command: use the command printed by the script
Endpoint type: Queue
```

Paste the printed environment variables into the endpoint:

```text
RUNPOD_HANDLER_B64=<printed by script>
OLMOCR_MODEL=olmocr
OLMOCR_WORKERS=1
OLMOCR_MAX_CONCURRENT_REQUESTS=1
OLMOCR_TIMEOUT_SECONDS=900
```

Use a GPU with at least 24 GB VRAM. If Runpod shows a container disk/storage
field, set it to 80 GB or higher because the official olmOCR image is large.

## App Configuration

After deployment, copy the Runpod endpoint ID into the app:

```env
OLMOCR_PROVIDER=runpod
OLMOCR_SERVER_URL=https://api.runpod.ai/v2/YOUR_ENDPOINT_ID
OLMOCR_MODEL=allenai/olmOCR-2-7B-1025-FP8
OLMOCR_API_KEY=your_runpod_api_key
```

## Optional: Custom Image Build

Only use this if you have a Docker builder with enough disk for the official
olmOCR CUDA layers:

```text
docker build --platform linux/amd64 -t YOUR_REGISTRY/olmocr-runpod-worker:latest runpod/olmocr-worker
docker push YOUR_REGISTRY/olmocr-runpod-worker:latest
```
