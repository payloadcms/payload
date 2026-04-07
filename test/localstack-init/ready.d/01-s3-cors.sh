#!/bin/bash
# Configure CORS on the S3 bucket so browsers can PUT files directly to localstack.
# Runs automatically when LocalStack is ready (mounted at /etc/localstack/init/ready.d/).

awslocal s3api create-bucket --bucket payload-bucket --region us-east-1 2>/dev/null || true

awslocal s3api put-bucket-cors --bucket payload-bucket --cors-configuration '{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "HEAD", "DELETE"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
}'

echo "S3 CORS configured on payload-bucket"
