import { ModelOptions, ModelProvider } from "hadid/node-hadid/dist/types";
import { hadid } from "hadid";

/**
 * Example using Google Gemini with Hadid to extract structured data from documents.
 * This shows extraction setup with schema definition for a property report document.
 */
async function main() {
  // Define the schema for property report data extraction
  const schema = {
    type: "object",
    properties: {
      commercial_office: {
        type: "object",
        properties: {
          average: { type: "string" },
          median: { type: "string" },
        },
        required: ["average", "median"],
      },
      transactions_by_quarter: {
        type: "array",
        items: {
          type: "object",
          properties: {
            quarter: { type: "string" },
            transactions: { type: "integer" },
          },
          required: ["quarter", "transactions"],
        },
      },
      year: { type: "integer" },
    },
    required: ["commercial_office", "transactions_by_quarter", "year"],
  };

  try {
    const result = await hadid({
      credentials: {
        apiKey: process.env.GEMINI_API_KEY || "",
      },
      extractOnly: true, // Skip OCR, only perform extraction (defaults to false)
      filePath:
        "https://omni-demo-data.s3.amazonaws.com/test/property_report.png",
      model: ModelOptions.GOOGLE_GEMINI_2_FLASH,
      modelProvider: ModelProvider.GOOGLE,
      schema,
    });
    console.log("Extracted data:", result.extracted);
  } catch (error) {
    console.error("Error extracting data:", error);
  }
}

main();
