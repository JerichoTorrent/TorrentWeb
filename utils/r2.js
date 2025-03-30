import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import mime from "mime-types";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

// Upload a file to R2
export async function R2Upload(file) {
  const ext = mime.extension(file.mimetype);
  const filename = `${uuidv4()}.${ext}`;

  const upload = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: filename,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: "public-read"
  });

  await s3.send(upload);
  return `${process.env.R2_PUBLIC_URL}${filename}`;
}

// Delete a file from R2 using its public URL
export async function R2Delete(fileUrl) {
  const key = fileUrl.replace(process.env.R2_PUBLIC_URL, "");
  const command = new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key
  });

  await s3.send(command);
}
