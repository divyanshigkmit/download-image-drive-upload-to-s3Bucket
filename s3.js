require("dotenv").config();
const fs = require("fs");
const S3 = require("aws-sdk/clients/s3");
var zlib = require("zlib");

const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;
const bucket = process.env.AWS_BUCKET_NAME;

const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey,
});

const uploadImage = async (filePath) => {
  fs.readFile(filePath, async (err, data) => {
    const body = data;
    if (err) {
      console.log(err);
      throw err;
    } else {
      const uploadParams = {
        Bucket: bucket,
        ACL: "public-read",
        Body: body,
        Key: filePath,
      };
      const data = await s3.upload(uploadParams).promise();
      console.log(data);
      return;
    }
  });
  // const fileStream = await fs.readFileSync(filePath);
  // console.log(fileStream);
  // const uploadParams = {
  //   Bucket: bucket,
  //   ACL: "public-read",
  //   Body: fileStream,
  //   Key: filePath,
  //   ContentType: "image/png",
  //   ContentEncoding: "gzip",
  // };

  // const data = await s3.upload(uploadParams).promise();
  // console.log(data);
  // return;
};

// const uploadImage = (filePath) => {
//   fs.readFile(filePath, (err, data) => {
//     console.log(data);
//     if (err) throw err;
//     const params = {
//       Bucket: bucket,
//       ACL: "public-read",
//       Body: data,
//       Key: filePath,
//       ContentType: "image/png",
//     };
//     s3.upload(params, function (s3Err, data) {
//       if (s3Err) throw s3Err;
//       console.log(`File uploaded successfully at ${data.Location}`);
//     });
//   });
// };

module.exports = {
  uploadImage,
};
