FROM python:3.9-slim

WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY requirements.txt ./

RUN pip install --upgrade pip
RUN pip install torch==2.6.0 --index-url https://download.pytorch.org/whl/cpu

RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Load environment variables
ENV MISTRAL_API_KEY=${MISTRAL_API_KEY}
ENV FREESOUND_API_KEY=${FREESOUND_API_KEY}
ENV GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
ENV GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}

EXPOSE 3002

CMD ["python", "python_backend.py"]
