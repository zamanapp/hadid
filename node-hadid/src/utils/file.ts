import { convert } from "libreoffice-convert";
import { exec } from "child_process";
import { fromPath } from "pdf2pic";
import { pipeline } from "stream/promises";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";
import { WriteImageResponse } from "pdf2pic/dist/types/convertResponse";
import axios from "axios";
import fileType from "file-type";
import fs from "fs-extra";
import heicConvert from "heic-convert";
import mime from "mime-types";
import path from "path";
import pdf from "pdf-parse";
import util from "util";
import xlsx from "xlsx";

import { ASPECT_RATIO_THRESHOLD } from "../constants";
import {
  ConvertPdfOptions,
  ExcelSheetContent,
  ModelInterface,
  Page,
  PageStatus,
} from "../types";
import { isValidUrl } from "./common";

const convertAsync = promisify(convert);

const execAsync = util.promisify(exec);

// Save file to local tmp directory
export const downloadFile = async ({
  filePath,
  tempDir,
}: {
  filePath: string;
  tempDir: string;
}): Promise<{ extension: string; localPath: string }> => {
  const fileNameExt = path.extname(filePath.split("?")[0]);
  const localPath = path.join(tempDir, uuidv4() + fileNameExt);

  let mimetype;

  // Check if filePath is a URL
  if (isValidUrl(filePath)) {
    const writer = fs.createWriteStream(localPath);

    const response = await axios({
      url: filePath,
      method: "GET",
      responseType: "stream",
    });

    if (response.status !== 200) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    mimetype = response.headers?.["content-type"];
    await pipeline(response.data, writer);
  } else {
    // If filePath is a local file, copy it to the temp directory
    await fs.copyFile(filePath, localPath);
  }

  if (!mimetype) {
    mimetype = mime.lookup(localPath);
  }

  let extension = mime.extension(mimetype);
  if (!extension) {
    extension = fileNameExt || "";
  }

  if (!extension) {
    if (mimetype === "binary/octet-stream") {
      extension = ".bin";
    } else {
      throw new Error("File extension missing");
    }
  }

  if (!extension.startsWith(".")) {
    extension = `.${extension}`;
  }

  return { extension, localPath };
};

// Check if file is a Compound File Binary (legacy Office format)
export const checkIsCFBFile = async (filePath: string): Promise<boolean> => {
  const type = await fileType.fromFile(filePath);
  return type?.mime === "application/x-cfb";
};

// Check if file is a PDF by inspecting its magic number ("%PDF" at the beginning)
export const checkIsPdfFile = async (filePath: string): Promise<boolean> => {
  const buffer = await fs.readFile(filePath);
  return buffer.subarray(0, 4).toString() === "%PDF";
};

// Convert HEIC file to JPEG
export const convertHeicToJpeg = async ({
  localPath,
  tempDir,
}: {
  localPath: string;
  tempDir: string;
}): Promise<string> => {
  try {
    const inputBuffer = await fs.readFile(localPath);
    const outputBuffer = await heicConvert({
      buffer: inputBuffer,
      format: "JPEG",
      quality: 1,
    });

    const jpegPath = path.join(
      tempDir,
      `${path.basename(localPath, ".heic")}.jpg`
    );
    await fs.writeFile(jpegPath, Buffer.from(outputBuffer));
    return jpegPath;
  } catch (err) {
    console.error(`Error converting .heic to .jpeg:`, err);
    throw err;
  }
};

// Convert each page (from other formats like docx) to a png and save that image to tmp
export const convertFileToPdf = async ({
  extension,
  localPath,
  tempDir,
}: {
  extension: string;
  localPath: string;
  tempDir: string;
}): Promise<string> => {
  const inputBuffer = await fs.readFile(localPath);
  const outputFilename = path.basename(localPath, extension) + ".pdf";
  const outputPath = path.join(tempDir, outputFilename);

  try {
    const pdfBuffer = await convertAsync(inputBuffer, ".pdf", undefined);
    await fs.writeFile(outputPath, pdfBuffer);
    return outputPath;
  } catch (err) {
    console.error(`Error converting ${extension} to .pdf:`, err);
    throw err;
  }
};

// Convert each page to a png and save that image to tempDir
export const convertPdfToImages = async ({
  imageDensity = 300,
  imageHeight = 2048,
  pagesToProcess,
  pdfPath,
  tempDir,
}: {
  imageDensity?: number;
  imageHeight?: number;
  pagesToProcess: number | number[];
  pdfPath: string;
  tempDir: string;
}): Promise<string[]> => {
  const aspectRatio = (await getPdfAspectRatio(pdfPath)) || 1;
  const shouldAdjustHeight = aspectRatio > ASPECT_RATIO_THRESHOLD;
  const adjustedHeight = shouldAdjustHeight
    ? Math.max(imageHeight, Math.round(aspectRatio * imageHeight))
    : imageHeight;

  const options: ConvertPdfOptions = {
    density: imageDensity,
    format: "png",
    height: adjustedHeight,
    preserveAspectRatio: true,
    saveFilename: path.basename(pdfPath, path.extname(pdfPath)),
    savePath: tempDir,
  };

  try {
    try {
      const storeAsImage = fromPath(pdfPath, options);
      const convertResults: WriteImageResponse[] = await storeAsImage.bulk(
        pagesToProcess
      );
      // Validate that all pages were converted
      return convertResults.map((result) => {
        if (!result.page || !result.path) {
          throw new Error("Could not identify page data");
        }
        return result.path;
      });
    } catch (err) {
      return await convertPdfWithPoppler(pagesToProcess, pdfPath, options);
    }
  } catch (err) {
    console.error("Error during PDF conversion:", err);
    throw err;
  }
};

// Converts an Excel file to HTML format
export const convertExcelToHtml = async (
  filePath: string
): Promise<ExcelSheetContent[]> => {
  const tableClass = "hadid-excel-table";

  try {
    if (!(await fs.pathExists(filePath))) {
      throw new Error(`Excel file not found: ${filePath}`);
    }

    const workbook = xlsx.readFile(filePath, {
      type: "file",
      cellStyles: false,
      cellHTML: true,
    });

    if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error("Invalid Excel file or no sheets found");
    }

    const sheets: ExcelSheetContent[] = [];

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];

      const jsonData = xlsx.utils.sheet_to_json<any[]>(worksheet, {
        header: 1,
      });

      let sheetContent = "";
      sheetContent += `<h2>Sheet: ${sheetName}</h2>`;

      sheetContent += `<table class="${tableClass}">`;

      if (jsonData.length > 0) {
        jsonData.forEach((row: any[], rowIndex: number) => {
          sheetContent += "<tr>";

          const cellTag = rowIndex === 0 ? "th" : "td";

          if (row && row.length > 0) {
            row.forEach((cell) => {
              const cellContent =
                cell !== null && cell !== undefined ? cell.toString() : "";

              sheetContent += `<${cellTag}>${cellContent}</${cellTag}>`;
            });
          }

          sheetContent += "</tr>";
        });
      }

      sheetContent += "</table>";

      sheets.push({
        sheetName,
        content: sheetContent,
        contentLength: sheetContent.length,
      });
    }

    return sheets;
  } catch (error) {
    throw error;
  }
};

// Alternative PDF to PNG conversion using Poppler
const convertPdfWithPoppler = async (
  pagesToProcess: number | number[],
  pdfPath: string,
  options: ConvertPdfOptions
): Promise<string[]> => {
  const { density, format, height, saveFilename, savePath } = options;
  const outputPrefix = path.join(savePath, saveFilename);

  const run = async (from?: number, to?: number) => {
    const pageArgs = from && to ? `-f ${from} -l ${to}` : "";
    const cmd = `pdftoppm -${format} -r ${density} -scale-to-y ${height} -scale-to-x -1 ${pageArgs} "${pdfPath}" "${outputPrefix}"`;
    await execAsync(cmd);
  };

  if (pagesToProcess === -1) {
    await run();
  } else if (typeof pagesToProcess === "number") {
    await run(pagesToProcess, pagesToProcess);
  } else if (Array.isArray(pagesToProcess)) {
    await Promise.all(pagesToProcess.map((page) => run(page, page)));
  }

  const convertResults = await fs.readdir(savePath);
  return convertResults
    .filter(
      (result) =>
        result.startsWith(saveFilename) && result.endsWith(`.${format}`)
    )
    .map((result) => path.join(savePath, result));
};

/**
 * Converts an Excel file to Markdown format
 * @param filePath Path to the Excel file
 * @returns Array of objects containing sheet name and markdown content
 */
export const convertExcelToMarkdown = async (
  filePath: string
): Promise<ExcelSheetContent[]> => {
  try {
    if (!(await fs.pathExists(filePath))) {
      throw new Error(`Excel file not found: ${filePath}`);
    }

    const workbook = xlsx.readFile(filePath, {
      type: "file",
    });

    if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error("Invalid Excel file or no sheets found");
    }

    const sheets: ExcelSheetContent[] = [];

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];

      const jsonData = xlsx.utils.sheet_to_json<any[]>(worksheet, {
        header: 1,
      });

      let markdownContent = `## Sheet: ${sheetName}\n\n`;

      if (jsonData.length > 0) {
        // Create header row if data exists
        if (jsonData[0] && jsonData[0].length > 0) {
          // Add header row
          markdownContent += "| ";
          jsonData[0].forEach((cell) => {
            const cellContent =
              cell !== null && cell !== undefined ? cell.toString() : "";
            markdownContent += `${cellContent} | `;
          });
          markdownContent += "\n";

          // Add separator row
          markdownContent += "| ";
          jsonData[0].forEach(() => {
            markdownContent += "--- | ";
          });
          markdownContent += "\n";

          // Add data rows
          for (let i = 1; i < jsonData.length; i++) {
            if (jsonData[i] && jsonData[i].length > 0) {
              markdownContent += "| ";

              // Ensure we have the same number of cells as the header
              const row = jsonData[i];
              const headerLength = jsonData[0].length;

              for (let j = 0; j < headerLength; j++) {
                const cell = j < row.length ? row[j] : "";
                const cellContent =
                  cell !== null && cell !== undefined ? cell.toString() : "";
                markdownContent += `${cellContent} | `;
              }

              markdownContent += "\n";
            }
          }
        } else {
          markdownContent += "No data in this sheet.\n";
        }
      } else {
        markdownContent += "Empty sheet.\n";
      }

      sheets.push({
        sheetName,
        content: markdownContent,
        contentLength: markdownContent.length,
      });
    }

    return sheets;
  } catch (error) {
    throw error;
  }
};

// Extracts pages from a structured data file (like Excel)
export const extractPagesFromStructuredDataFile = async (
  filePath: string,
  convertSpreadsheetToMarkdown: boolean,
  pagesToProcess: number | number[]
): Promise<Page[]> => {
  if (isExcelFile(filePath)) {
    let allSheets;

    if (convertSpreadsheetToMarkdown) {
      allSheets = await convertExcelToMarkdown(filePath);
    } else {
      allSheets = await convertExcelToHtml(filePath);
    }

    const sheets =
      pagesToProcess === -1
        ? allSheets
        : Array.isArray(pagesToProcess)
        ? allSheets.filter((_, index) => pagesToProcess.includes(index + 1))
        : allSheets.slice(0, pagesToProcess);

    const pages: Page[] = [];

    sheets.forEach((sheet: ExcelSheetContent, index: number) => {
      pages.push({
        content: sheet.content,
        contentLength: sheet.contentLength,
        page: index + 1,
        status: PageStatus.SUCCESS,
      });
    });

    return pages;
  }

  return [];
};

// Gets the number of pages from a PDF
export const getNumberOfPagesFromPdf = async ({
  pdfPath,
}: {
  pdfPath: string;
}): Promise<number> => {
  const dataBuffer = await fs.readFile(pdfPath);
  const data = await pdf(dataBuffer);
  return data.numpages;
};

// Gets the aspect ratio (height/width) of a PDF
const getPdfAspectRatio = async (
  pdfPath: string
): Promise<number | undefined> => {
  return new Promise((resolve) => {
    exec(`pdfinfo "${pdfPath}"`, (error, stdout) => {
      if (error) return resolve(undefined);

      const sizeMatch = stdout.match(/Page size:\s+([\d.]+)\s+x\s+([\d.]+)/);
      if (sizeMatch) {
        const height = parseFloat(sizeMatch[2]);
        const width = parseFloat(sizeMatch[1]);
        return resolve(height / width);
      }

      resolve(undefined);
    });
  });
};

// Checks if a file is an Excel file
export const isExcelFile = (filePath: string): boolean => {
  const extension = path.extname(filePath).toLowerCase();
  return (
    extension === ".xlsx" ||
    extension === ".xls" ||
    extension === ".xlsm" ||
    extension === ".xlsb"
  );
};

// Checks if a file is a structured data file (like Excel)
export const isStructuredDataFile = (filePath: string): boolean => {
  return isExcelFile(filePath);
};
