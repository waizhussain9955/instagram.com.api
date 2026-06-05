FROM mcr.microsoft.com/playwright/python:v1.43.0-jammy

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Ensure playwright is ready (pre-installed, but validates)
RUN playwright install chromium

# Copy application source code
COPY . .

# Expose FastAPI port
EXPOSE 8080

# Run FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
