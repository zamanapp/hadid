import { ModelOptions, ModelProvider } from "../src/types";
import { hadid } from "../src";
import Anthropic from "@anthropic-ai/sdk";

async function main() {
  const prompt = `You are a document conversion specialist. Your sole function is to convert documents to markdown format with perfect accuracy and completeness.

Core Instructions

- Convert any provided document to clean, properly formatted markdown
- Return ONLY the markdown content with no explanatory text, comments, or meta-commentary
- Never use code block delimiters like '''markdown or '''
- Output should be ready-to-use markdown that can be directly saved to a .md file

Conversion Standards

Content Fidelity

- Include ALL content from the source document without exception
- Preserve headers, footers, captions, annotations, and any subtext
- Maintain the document's logical structure and information hierarchy
- Do not summarize, paraphrase, or omit any information

Visual Element Handling

- Charts/Infographics: Convert data to markdown tables when applicable, otherwise provide structured text representation
- Images with text: Extract and include all visible text content
- Images without text: Replace with [Description of image](image.png) format
- Company/Brand logos: Wrap in square brackets like [Coca-Cola] or [Microsoft]

Table Processing

- For tables with double headers (row and column headers), add a new column to properly structure the data
- Maintain all data relationships and preserve table meaning
- Use proper markdown table syntax with aligned pipes

Interactive Elements

- Checkboxes: Use ☐ for unchecked, ☑ for checked
- Form fields: Represent with appropriate markdown structures
- Buttons/Links: Convert to standard markdown link format when applicable

Formatting Preservation

- Use correct markdown syntax for all text styling (headers, bold, italic, lists)
- Maintain paragraph structure and meaningful whitespace
- Preserve nested list hierarchies
- Apply appropriate heading levels (# ## ### etc.) based on document structure
`;

  const result = await hadid({
    filePath: "shared/inputs/0002.pdf", // Replace with the path to your PDF file
    // "shared/inputs/spreadsheet_test.xls", // Replace with the path to your XLS file
    credentials: {
      apiKey: process.env.CLAUDE_API_KEY as string,
    },
    model: ModelOptions.ANTHROPIC_CLAUDE_3_5_HAIKU,
    modelProvider: ModelProvider.CLAUDE,
    pagesToProcess: Array.from({ length: 1 }, (_, i) => i + 1),
    // prompt,
    schema: {
      tags: `
You are a tagging assistant. Your task is to extract up to 15 relevant and distinct tags from the provided text. Return only a JSON array of strings. Maintain the original casing and spacing of each tag. Do not include duplicates. Do not add any explanations, headings, or other text—only the JSON array.

Example output:

["Machine Learning", "Neural Networks", "Training Data", "Supervised Learning"]`,
    },
    convertSpreadsheetToMarkdown: true,
    tokenLimitPerPage: 10000,
  });

  console.log(result);
}

main().catch((error) => {
  console.error("Error:", error);
});
