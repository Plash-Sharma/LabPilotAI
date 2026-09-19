import logging
import os
from pathlib import Path

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

# Fallback for local development if S3 isn't configured
STORAGE_DIR = Path(__file__).parent.parent.parent.parent / "storage"
STORAGE_DIR.mkdir(parents=True, exist_ok=True)


class StorageService:
    def __init__(self) -> None:
        self.bucket = os.getenv("S3_BUCKET_NAME")
        if self.bucket:
            self.s3_client = boto3.client(
                "s3",
                aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
                region_name=os.getenv("AWS_REGION", "ap-south-1"),
            )
        else:
            self.s3_client = None

    def upload_pdf(self, file_path: str, object_name: str) -> str:
        """
        Uploads a PDF to S3. If S3 isn't configured, returns a local path URI.
        """
        if not self.s3_client or not self.bucket:
            logger.info("S3 not configured. Using local storage: %s", file_path)
            return f"local://{object_name}"

        try:
            self.s3_client.upload_file(
                file_path,
                self.bucket,
                object_name,
                ExtraArgs={"ContentType": "application/pdf"},
            )
            return f"s3://{self.bucket}/{object_name}"
        except ClientError:
            logger.exception("Failed to upload %s to S3", file_path)
            raise

    def get_presigned_url(self, s3_uri: str) -> str:
        if not self.s3_client or not s3_uri.startswith("s3://"):
            return s3_uri

        object_name = s3_uri.split("s3://")[1].split("/", 1)[1]
        try:
            url = self.s3_client.generate_presigned_url(
                ClientMethod="get_object",
                Params={"Bucket": self.bucket, "Key": object_name},
                ExpiresIn=3600,
            )
            return url
        except ClientError:
            logger.exception("Failed to generate presigned URL for %s", s3_uri)
            raise


storage_service = StorageService()
