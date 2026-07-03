# Runpod olmOCR Worker

This image wraps AllenAI's official `alleninstituteforai/olmocr:latest`
image with a Runpod Serverless handler. The lighter base avoids pushing the
model-bundled image from a local laptop; Runpod downloads/loads the model on
the GPU worker.

## Build

Preferred: build in GitHub Actions so local Docker Desktop does not need to
pull the large Linux AMD64 CUDA layers. Push this repo to GitHub and run:

```text
Actions -> Build Runpod olmOCR worker -> Run workflow
```

The workflow publishes:

```text
ghcr.io/<github-owner>/olmocr-runpod-worker:latest
```

Manual local build:

```bash
docker build -t YOUR_REGISTRY/olmocr-runpod-worker:latest runpod/olmocr-worker
```

## Push

```bash
docker push YOUR_REGISTRY/olmocr-runpod-worker:latest
```

## Runpod Endpoint

In Runpod, choose **Serverless > New Endpoint > Deploy from a Docker image**.

Use:

```text
Container image: YOUR_REGISTRY/olmocr-runpod-worker:latest
Start command: python -u /worker/handler.py
Endpoint type: Queue
```

Environment variables:

```text
OLMOCR_MODEL=olmocr
OLMOCR_WORKERS=1
OLMOCR_MAX_CONCURRENT_REQUESTS=1
OLMOCR_TIMEOUT_SECONDS=900
```

After deployment, copy the Runpod endpoint ID into the app:

```env
OLMOCR_PROVIDER=runpod
OLMOCR_SERVER_URL=https://api.runpod.ai/v2/YOUR_ENDPOINT_ID
OLMOCR_MODEL=allenai/olmOCR-2-7B-1025-FP8
OLMOCR_API_KEY=your_runpod_api_key
```
