FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      libglib2.0-0 libsm6 libxrender1 libxext6 curl \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir "rembg[cli]==2.0.59" onnxruntime==1.19.2

RUN python -c "from rembg import new_session; new_session('u2net')"

EXPOSE 7001
ENV PORT=7001

CMD ["sh", "-c", "rembg s --host 0.0.0.0 --port ${PORT:-7001}"]
