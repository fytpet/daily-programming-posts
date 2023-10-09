#!/bin/bash

gcloud functions deploy extract-daily-posts \
  --gen2 \
  --runtime=python38 \
  --region=us-central1 \
  --source=./extract \
  --entry-point=main \
  --trigger-topic=command-extract-daily-posts \
  --max-instances=1
