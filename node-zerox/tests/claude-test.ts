import { ModelOptions, ModelProvider } from "../src/types";
import { zerox } from "../src";
import Anthropic from "@anthropic-ai/sdk";

async function main() {
  const prompt = `You are a specialized document parser that converts documents into structured formats. Your task is to analyze the provided document and return a clean, well-formatted JSON object containing both markdown representation and relevant tags.
Output Format
Your response must strictly adhere to this JSON structure:
{
  "markdown": "# Document Title\n\n## Section\n\nContent...",
  "tags": ["relevant-tag-1", "relevant-tag-2", "document-type"]
}

Markdown Conversion Guidelines
Convert the entire document into clean, semantic ATX-style Markdown
Use proper heading hierarchy:

# for the main title
## for major sections
### (or deeper) for subsections as appropriate


Preserve the original document's visual structure and information hierarchy
Format elements consistently:

Use bullet points (* or -) for lists
Apply bold formatting for field labels (e.g., **Name:**)
Use backticks for IDs, tracking numbers, and code
For tables, use standard Markdown table syntax


When images, QR codes, or barcodes appear, insert appropriate placeholders:

*(QR code present)*
*(Barcode present)*
*(Logo present)*
*(Image present: brief description if obvious)*


Preserve formatting for addresses, contact information, and other structured data
Do not omit any textual content from the original document
Do not add interpretation, commentary, or metadata not present in the original

Tag Generation Requirements
Generate an array of up to 15 relevant tags based on the document content, following these rules:
Use lowercase letters only
Connect multi-word concepts with hyphens (e.g., shipping-label not shipping label)
Eliminate duplicates and near-duplicates
Return only the tags array, with no explanations
If insufficient context exists for meaningful tagging, return an empty array ([])

Tag Categories to Consider:

-Document type: invoice, receipt, shipping-label, purchase-order, contract, etc.
-Organizations: company names, government agencies, institutions
-People: roles or specific individuals if prominently mentioned
-Locations: countries, cities, regions relevant to the document
-Products/Services: categories or specific items mentioned
-Industries: sectors relevant to the document content
-Time periods: if the document relates to specific timeframes
-Status indicators: draft, final, approved, pending, etc.
-Process types: procurement, shipping, payment, application, etc.

Processing Instructions:

1.First, carefully analyze the entire document
2.Identify the document type, key entities, and primary purpose
3.Convert to clean markdown following the guidelines above
4.Generate appropriate tags based on content analysis
5.Format the final output as a valid JSON object with both "markdown" and "tags" fields
6.Ensure the JSON is properly escaped and formatted

Do not include any text outside the JSON structure. Your entire response should be valid, parseable JSON.`;

  console.log(process.env.CLAUDE_API_KEY as string);

  const result = await zerox({
    filePath: "file path to the document you want to convert",
    credentials: {
      apiKey: process.env.CLAUDE_API_KEY as string,
    },
    model: ModelOptions.ANTHROPIC_CLAUDE_3_5_HAIKU,
    modelProvider: ModelProvider.CLAUDE,
    pagesToProcess: Array.from({ length: 3 }, (_, i) => i + 1),
    // prompt: "Convert the document to markdown ATX style",
    schema: {
      tags: `Extract relevant tags from documents to improve searchability and categorisation.

Given the following text, extract up to 15 of the most relevant tags. Tags should include important keywords and named entities such as people, organisations, locations, events, and topics. Tags should make the document easier to find via search.

Guidelines:
	•	Return at most 15 tags
	•	Preserve casing and spacing for proper nouns (e.g. “United Nations”, “John Smith”)
	•	Remove duplicates
	•	Tags should be relevant, specific, and search-friendly

Output format (stringified JSON array):
["tag1", "tag2", "tag3", "..."]`,
    },
  });

  console.log(result);
}

main().catch((error) => {
  console.error("Error:", error);
});
