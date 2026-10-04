# Elements Restore — production image for Render (or any Docker host).
# The Playwright image already contains Chromium (used to print the client PDF) at the matching version.
FROM mcr.microsoft.com/playwright:v1.63.0-noble

# PyMuPDF rasterises page 1 of each UBIO PDF for OCR
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3-pip \
 && pip3 install --no-cache-dir --break-system-packages pymupdf==1.26.5 \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    PORT=10000 \
    OCR_ENGINE=tesseract \
    RESTORE_DATA=/tmp/restore-data

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY . .

USER pwuser
EXPOSE 10000
CMD ["node", "server.mjs"]
