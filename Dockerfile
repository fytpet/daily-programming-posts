FROM python:3.8

WORKDIR /app

COPY main.py /app
COPY requirements.txt /app

RUN pip install -r requirements.txt

CMD ["python", "main.py"]
