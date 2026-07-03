FROM alleninstituteforai/olmocr:latest

WORKDIR /worker

RUN python -m pip install --no-cache-dir runpod

COPY handler.py /worker/handler.py

ENV OLMOCR_MODEL=olmocr
ENV OLMOCR_WORKERS=1
ENV OLMOCR_MAX_CONCURRENT_REQUESTS=1

CMD ["python", "-u", "/worker/handler.py"]
