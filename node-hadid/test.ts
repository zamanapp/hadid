import fs from "fs";
import fileType from "file-type";

// Read a file as a buffer (example)
const buffer = fs.readFileSync(
  "/Users/fazasophian/Projects/zerox-claude/shared/inputs/0006.png"
);

async function getMimeType(buffer: any) {
  const type = await fileType.fromBuffer(buffer);
  if (type) {
    console.log(`MIME: ${type.mime}`);
    console.log(`Extension: ${type.ext}`);
  } else {
    console.log("Could not determine MIME type");
  }
}

getMimeType(buffer);
