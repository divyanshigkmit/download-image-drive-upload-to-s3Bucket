const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");
// const drive = google.drive("v2");

const s3 = require("./s3");

// If modifying these scopes, delete token.json.
const SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
];
const TOKEN_PATH = "token.json";

/**
 * Create an OAuth2 client with the given credentials, and then execute the given callback function.
 */
function authorize(credentials, callback) {
  //   console.log(credentials);
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error("Error retrieving access token", err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log("Token stored to", TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}
/**
 * Describe with given media and metaData and upload it using google.drive.create method()
 */

async function downloadFile(client) {
  const drive = google.drive({ version: "v3", auth: client });
  // console.log(drive.files);
  const files = await drive.files.list({
    auth: client,
    folderId: "1NKT-rqUC91gLA72Dkc4G8eUU38EUMKNr",
    q: "mimeType contains 'image/png' and trashed = false",
  });
  console.log(files.data.files);
  files.data.files.forEach(async (file) => {
    // console.log(file);
    const dest = fs.createWriteStream("upload/" + file.name);
    const res = await drive.files.get(
      { auth: client, fileId: file.id, alt: "media" },
      { responseType: "stream" }
    );
    // console.log("response>>>>>", res);
    // await res.data.pipe(dest);
    await res.data.pipe(dest).on("finish", () => {
      s3.uploadImage(dest.path);
    });
  });
}

fs.readFile("credentials.json", (err, content) => {
  if (err) return console.log("Error loading client secret file:", err);
  // Authorize a client with credentials, then call the Google Drive API.
  authorize(JSON.parse(content), downloadFile);
});
