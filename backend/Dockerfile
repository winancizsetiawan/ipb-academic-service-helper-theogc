FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (psycopg2 needs libpq)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create uploads directory (override with Railway volume mount in production)
RUN mkdir -p uploads

# Ensure start.sh is executable
RUN chmod +x start.sh

EXPOSE 8000

CMD ["bash", "start.sh"]
