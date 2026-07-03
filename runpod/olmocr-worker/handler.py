import base64
import glob
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

import runpod


EXTENSIONS = {
    "application/pdf": ".pdf",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
}


def _file_extension(mime_type: str, document_title: str) -> str:
    suffix = Path(document_title or "").suffix.lower()
    if suffix in {".pdf", ".png", ".jpg", ".jpeg"}:
        return ".jpg" if suffix == ".jpeg" else suffix
    return EXTENSIONS.get(mime_type, ".pdf")


def _read_markdown(workspace: str) -> str:
    markdown_files = sorted(glob.glob(os.path.join(workspace, "markdown", "*.md")))
    if not markdown_files:
        markdown_files = sorted(glob.glob(os.path.join(workspace, "**", "*.md"), recursive=True))
    parts = []
    for path in markdown_files:
        with open(path, "r", encoding="utf-8", errors="replace") as handle:
            text = handle.read().strip()
        if text:
            parts.append(text)
    return "\n\n".join(parts).strip()


def run_olmocr(file_base64: str, mime_type: str, document_title: str) -> str:
    temp_dir = tempfile.mkdtemp(prefix="olmocr-runpod-")
    try:
        extension = _file_extension(mime_type, document_title)
        input_path = os.path.join(temp_dir, f"input{extension}")
        workspace = os.path.join(temp_dir, "workspace")
        with open(input_path, "wb") as handle:
            handle.write(base64.b64decode(file_base64))

        command = [
            "olmocr",
            workspace,
            "--markdown",
            "--workers",
            os.environ.get("OLMOCR_WORKERS", "1"),
            "--max_concurrent_requests",
            os.environ.get("OLMOCR_MAX_CONCURRENT_REQUESTS", "1"),
            "--pdfs",
            input_path,
        ]
        model = os.environ.get("OLMOCR_MODEL", "").strip()
        if model and model != "olmocr":
            command[2:2] = ["--model", model]

        completed = subprocess.run(command, check=False, capture_output=True, text=True, timeout=int(os.environ.get("OLMOCR_TIMEOUT_SECONDS", "900")))
        if completed.returncode != 0:
            raise RuntimeError((completed.stderr or completed.stdout or "olmOCR failed").strip())

        text = _read_markdown(workspace)
        if not text:
            raise RuntimeError("olmOCR completed but produced no markdown output.")
        return text
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


def handler(event):
    payload = event.get("input") or {}
    file_base64 = payload.get("fileBase64") or payload.get("image") or ""
    mime_type = payload.get("mimeType") or "application/pdf"
    document_title = payload.get("documentTitle") or "document"
    if not file_base64:
        return {"error": "fileBase64 is required."}

    text = run_olmocr(file_base64, mime_type, document_title)
    return {
        "text": text,
        "extractedText": text,
        "markdown": text,
        "source": "olmocr-runpod",
        "documentTitle": document_title,
    }


runpod.serverless.start({"handler": handler})
