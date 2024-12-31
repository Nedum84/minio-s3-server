import { once } from "lodash";
import {
  S3,
  DeleteObjectsCommandInput,
  PutObjectCommandInput,
  CreateBucketCommand,
  PutBucketPolicyCommand,
  BucketLocationConstraint,
} from "@aws-sdk/client-s3";

const config = {
  bucketName: process.env.BUCKET_NAME || "test-bucket-name",
  dev: process.env.NODE_ENV || "development",
  awsRegion: process.env.AWS_REGION || "eu-west-2",
  minioBaseUrl: process.env.MINIO_BASE_URL || "http://localhost:9000",
  minioUsername: process.env.MINIO_USERNAME || "admin",
  minioPassword: process.env.MINIO_PASSWORD || "Password1234",
};

const isDevelopmentOrTest = config.dev === "test" || config.dev === "development";

export const uploadFile = async (
  key: string,
  data: Buffer,
  options?: { contentType?: string; ContentEncoding?: string }
): Promise<string> => {
  const { contentType, ContentEncoding } = options || {};

  const storage = await getStorageInstance();

  const putCommand: PutObjectCommandInput = {
    Bucket: config.bucketName,
    Key: key,
    Body: data,
    ACL: "public-read",
    ContentType: contentType,
    ContentEncoding,
  };

  await storage.putObject(putCommand); // OR await storage.send(new PutObjectCommand(putCommand));

  return generateBaseUrl(key);
};

export const deleteS3Files = async (keys: string[]) => {
  const storage = await getStorageInstance();

  const deleteParams: DeleteObjectsCommandInput = {
    Bucket: config.bucketName,
    Delete: {
      Objects: keys.map((Key) => ({ Key })),
    },
  };

  return storage.deleteObjects(deleteParams, function (err, data) {
    if (err) console.log(err, err.stack);
    else console.log("Deleted", data);
  });
};

const generateBaseUrl = (key: string) => {
  if (isDevelopmentOrTest) {
    return `${config.minioBaseUrl}/${config.bucketName}/${key}`;
  }

  const domain = `s3.${config.awsRegion}.amazonaws.com/${config.bucketName}`;
  return `https://${domain}/${key}`;
};

async function getStorageInstance(bucket: string = config.bucketName) {
  const storage = createOrGetStorageInstance();

  // ONLY DO THIS FOR LOCAL DEV/TEST
  if (isDevelopmentOrTest) {
    await createBucketIfNotExist(bucket, storage);
  }

  return storage;
}

const createOrGetStorageInstance = once((): S3 => {
  if (isDevelopmentOrTest) {
    // MinIO S3 Client
    return new S3({
      endpoint: config.minioBaseUrl,
      forcePathStyle: true,
      region: config.awsRegion,
      credentials: {
        accessKeyId: config.minioUsername,
        secretAccessKey: config.minioPassword,
      },
    });
  }

  // AWS S3
  return new S3({ region: config.awsRegion });
});

async function createBucketIfNotExist(bucket: string, storage: S3): Promise<void> {
  try {
    await storage.send(
      new CreateBucketCommand({
        Bucket: bucket,
        CreateBucketConfiguration: {
          LocationConstraint: config.awsRegion as BucketLocationConstraint,
        },
      })
    );

    // Set the bucket policy
    const bucketPolicy = {
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "PublicRead",
          Effect: "Allow",
          Principal: "*",
          Action: ["s3:GetObject", "s3:GetObjectVersion"],
          Resource: [`arn:aws:s3:::${bucket}/*`],
        },
      ],
    };

    await storage.send(
      new PutBucketPolicyCommand({
        Bucket: bucket,
        Policy: JSON.stringify(bucketPolicy),
      })
    );
  } catch (error) {
    const code = error.code || error.Code;
    if (code === "BucketAlreadyOwnedByYou") {
      return;
    }

    throw error;
  }
}
