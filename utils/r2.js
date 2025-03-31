import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import mime from "mime-types";

let s3;

function getS3() {
  const {
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_ENDPOINT,
  } = process.env;

  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT) {
    throw new Error("❌ Missing R2 credentials or configuration in .env");
  }

  if (!s3) {
    s3 = new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }

  return s3;
}

// Upload a file to R2
export async function R2Upload(file) {
  const { R2_BUCKET, R2_PUBLIC_URL } = process.env;

  if (!R2_BUCKET || !R2_PUBLIC_URL) {
    throw new Error("❌ Missing R2 bucket or public URL in .env");
  }

  const ext = mime.extension(file.mimetype);
  const filename = `${uuidv4()}.${ext}`;

  const upload = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: filename,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: "public-read",
  });

  await getS3().send(upload);
  return `${R2_PUBLIC_URL}/${filename}`;
}

// Delete a file from R2 using its public URL
export async function R2Delete(fileUrl) {
  const { R2_BUCKET, R2_PUBLIC_URL } = process.env;

  if (!R2_BUCKET || !R2_PUBLIC_URL) {
    throw new Error("❌ Missing R2 bucket or public URL in .env");
  }

  const key = fileUrl.replace(R2_PUBLIC_URL, "");
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });

  await getS3().send(command);
}
