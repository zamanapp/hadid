import {
  CompletionArgs,
  CompletionResponse,
  ExtractionArgs,
  ExtractionResponse,
  MessageContentArgs,
  ModelInterface,
  ClaudeCredentials,
  ClaudeLLMParams,
  OperationMode,
} from "../types";
import {
  cleanupImage,
  convertKeysToCamelCase,
  convertKeysToSnakeCase,
  encodeImageToBase64,
  truncateByWordCount,
} from "../utils";
import { CONSISTENCY_PROMPT, SYSTEM_PROMPT_BASE } from "../constants";
import axios from "axios";
import fs from "fs-extra";
import { Anthropic } from "@anthropic-ai/sdk";
import fileType from "file-type";

export default class ClaudeModel implements ModelInterface {
  private apiKey: string;
  private model: string;
  private llmParams?: Partial<ClaudeLLMParams>;
  private client: Anthropic;

  constructor(
    credentials: ClaudeCredentials,
    model: string,
    llmParams?: Partial<ClaudeLLMParams>
  ) {
    this.apiKey = credentials.apiKey;
    this.model = model;
    this.client = new Anthropic({
      apiKey: this.apiKey,
    });
    this.llmParams = llmParams;
  }

  async getCompletion(
    mode: OperationMode,
    params: CompletionArgs | ExtractionArgs
  ): Promise<CompletionResponse | ExtractionResponse> {
    const modeHandlers = {
      [OperationMode.EXTRACTION]: () =>
        this.handleExtraction(params as ExtractionArgs),
      [OperationMode.OCR]: () => this.handleOCR(params as CompletionArgs),
    };

    const handler = modeHandlers[mode];
    if (!handler) {
      throw new Error(`Unsupported operation mode: ${mode}`);
    }

    return await handler();
  }

  private async createMessageContent({
    input,
    options,
  }: MessageContentArgs): Promise<any> {
    const processImages = async (imagePaths: string[]) => {
      const nestedImages = await Promise.all(
        imagePaths.map(async (imagePath) => {
          const imageBuffer = await fs.readFile(imagePath);
          const buffers = await cleanupImage({
            correctOrientation: options?.correctOrientation ?? false,
            imageBuffer,
            scheduler: options?.scheduler ?? null,
            trimEdges: options?.trimEdges ?? false,
          });

          const type = await fileType.fromBuffer(buffers[0]);

          return buffers.map((buffer) => ({
            type: "image",
            source: {
              type: "base64",
              media_type: type?.mime || "image/png",
              data: encodeImageToBase64(buffer),
            },
          }));
        })
      );
      return nestedImages.flat();
    };

    if (Array.isArray(input)) {
      console.log("Processing array of inputs:", input);

      return processImages(input);
    }

    if (typeof input === "string") {
      return [
        {
          text: truncateByWordCount(input, options?.wordLimitPerPage ?? 20000),
          type: "text",
        },
      ];
    }

    const { imagePaths, text } = input;
    const images = await processImages(imagePaths);
    return [...images, { text, type: "text" }];
  }

  private async handleOCR({
    buffers,
    maintainFormat,
    priorPage,
    prompt,
  }: CompletionArgs): Promise<CompletionResponse> {
    const systemPrompt = prompt || SYSTEM_PROMPT_BASE;

    // Default system message
    const messages: any = [];

    // If content has already been generated, add it to context.
    // This helps maintain the same format across pages
    if (maintainFormat && priorPage && priorPage.length) {
      messages.push({
        role: "assistant",
        content: CONSISTENCY_PROMPT(priorPage),
      });
    }

    const type = await fileType.fromBuffer(buffers[0]);

    // Add image to request
    const imageContents = buffers.map((buffer) => {
      return {
        type: "image",
        source: {
          type: "base64",
          media_type: type?.mime || "image/png",
          data: encodeImageToBase64(buffer),
        },
      };
    });
    messages.push({ role: "user", content: imageContents });

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.llmParams?.maxTokens || 2048,
        system: systemPrompt,
        messages,
      });

      const data = response;

      const result: CompletionResponse = {
        content: data.content[0].type === "text" ? data.content[0].text : "",
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens,
      };

      return result;
    } catch (err) {
      console.error("Error in Claude completion", err);
      throw err;
    }
  }

  private async handleExtraction({
    input,
    options,
    prompt,
    schema,
  }: ExtractionArgs): Promise<ExtractionResponse> {
    try {
      const messages: any = [];

      if (prompt) {
        messages.push({ role: "assistant", content: prompt });
      }

      let content = await this.createMessageContent({ input, options });

      if (content[0].text <= 10) {
        return {
          extracted: {},
          inputTokens: 0,
          outputTokens: 0,
        };
      }

      messages.push({
        role: "user",
        content,
      });

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.llmParams?.maxTokens || 2048,
        system: `
You are an assistant that extracts information from user documents uploaded. Your output must strictly adhere to the following JSON schema: ${JSON.stringify(
          schema
        )}.

CRITICAL: Return ONLY the JSON object. Do not include any text, explanations, markdown formatting, code blocks, or other content before or after the JSON. Your entire response must be valid JSON that matches the schema exactly.`,
        messages,
      });

      const data = response;

      const result: ExtractionResponse = {
        extracted: JSON.parse(
          data.content[0].type === "text" ? data.content[0].text : "{}"
        ),
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens,
      };

      // if (this.llmParams?.logprobs) {
      //   result["logprobs"] = convertKeysToCamelCase(
      //     data.choices[0].logprobs
      //   )?.content;
      // }

      return result;
    } catch (err) {
      console.error("Error in Claude completion", err);
      throw err;
    }
  }
}
