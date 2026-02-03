import fs from "fs";
import S3 from "aws-sdk/clients/s3";
import "dotenv/config";

const bucketName = process.env.AWS_BUCKET_NAME as string;
const region = process.env.AWS_BUCKET_REGION as string;
const accessKeyId = process.env.AWS_ACCESS_KEY as string;
const secretAccessKey = process.env.AWS_SECRET_KEY as string;

const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey,
});

function uploadFile(file: any) {
  const fileStream = fs.createReadStream(file.path);

  const uploadParams = {
    Bucket: bucketName,
    Body: fileStream,
    Key: file.filename,
  };

  return s3.upload(uploadParams).promise();
}

const getFileStream = (key: any) => {
  const downloadParams = {
    Key: key,
    Bucket: bucketName,
  };

  return s3.getObject(downloadParams).createReadStream();
};

export { getFileStream, uploadFile };
