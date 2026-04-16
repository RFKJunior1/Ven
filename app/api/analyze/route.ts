import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { personas } from "@/data/personas";
import type { PersonaReaction } from "@/components/ResultsDashboard";

export const runtime = "nodejs";
export const maxDuration = 300;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type ValidMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";
const VALID_TYPES: ValidMediaType[] = ["image/jpeg", "image/png", "image/gif", "image/webp"];

interface ImageData {
  base64: string;
  mediaType: ValidMediaType;
}

function buildPersonaBlock(slice: typeof personas): string {
  return slice
    .map((p) => {
      const traitLines = Object.entries(p.traits)
        .map(([k, v]) => `    ${k}: ${v}`)
        .join("\n");
      return `PERSONA #${p.id}: ${p.name}
  Age: ${p.age} | Occupation: ${p.occupation} | Location: ${p.location}
  Income: ${p.income}
  Background: ${p.background}
  Psychological Traits:
${traitLines}`;
    })
    .join("\n\n");
}

function buildPrompt(slice: typeof personas, numAds: number): string {
  const adLabels = Array.from({ length: numAds }, (_, i) => `Ad ${i + 1}`).join(", ");
  const reactionsTemplate = Array.from(
    { length: numAds },
    (_, i) =>
      `    { "reaction": "<first-person gut reaction to Ad ${i + 1} in 1-2 vivid sentences>", "resonance": <0-100>, "wouldConvert": <bool>, "lingering": <bool> }`
  ).join(",\n");

  return `You are simulating the authentic, unfiltered reactions of real people to ${numAds} out-of-home advertisement${numAds > 1 ? "s" : ""} (${adLabels}).

For each of the following ${slice.length} people, based on their SPECIFIC traits, psychology, background, and life context, provide their genuine gut reaction to each ad.

${buildPersonaBlock(slice)}

For EACH persona, respond with a JSON object with EXACTLY these fields:
{
  "personaId": <number>,
  "reactions": [
${reactionsTemplate}
  ],
  "philosophicalTake": "<one sentence on what ${numAds > 1 ? "these ads reveal" : "this ad reveals"} about society from this person's perspective>"
}

Return a JSON array of exactly ${slice.length} objects, one per persona, in the same order listed above.
Respond ONLY with valid JSON — no markdown, no commentary, no code fences.`;
}

export async function POST(request: NextRequest) {
  let images: ImageData[];

  try {
    const formData = await request.formData();
    const collected: ImageData[] = [];

    for (let i = 0; i < 6; i++) {
      const file = formData.get(`image${i}`) as File | null;
      if (!file) break;
      const buffer = Buffer.from(await file.arrayBuffer());
      collected.push({
        base64: buffer.toString("base64"),
        mediaType: VALID_TYPES.includes(file.type as ValidMediaType)
          ? (file.type as ValidMediaType)
          : "image/jpeg",
      });
    }

    if (collected.length === 0) {
      return new Response(JSON.stringify({ error: "At least one image is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    images = collected;
  } catch {
    return new Response(JSON.stringify({ error: "Failed to parse form data" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const numAds = images.length;
  const BATCH_SIZE = 10;
  const batches: (typeof personas)[] = [];
  for (let i = 0; i < personas.length; i += BATCH_SIZE) {
    batches.push(personas.slice(i, i + BATCH_SIZE));
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
          const batch = batches[batchIndex];
          const prompt = buildPrompt(batch, numAds);

          const imageContent = images.flatMap((img, i) => [
            {
              type: "image" as const,
              source: { type: "base64" as const, media_type: img.mediaType, data: img.base64 },
            },
            { type: "text" as const, text: `This is Ad ${i + 1}.` },
          ]);

          let rawText = "";
          try {
            const response = await client.messages.create({
              model: "claude-opus-4-6",
              max_tokens: 4096,
              system: [
                {
                  type: "text",
                  text: "You are an expert market research simulator that embodies diverse human perspectives with psychological depth and authenticity. You always respond with valid JSON only.",
                  // @ts-expect-error cache_control is supported but not yet in type definitions
                  cache_control: { type: "ephemeral" },
                },
              ],
              messages: [
                {
                  role: "user",
                  content: [...imageContent, { type: "text" as const, text: prompt }],
                },
              ],
            });

            const content = response.content[0];
            if (content.type === "text") rawText = content.text.trim();
          } catch (apiError) {
            console.error(`Batch ${batchIndex} API error:`, apiError);
            controller.enqueue(
              encoder.encode(
                JSON.stringify({ batch: batchIndex, error: `Batch ${batchIndex} failed`, results: [] }) + "\n"
              )
            );
            continue;
          }

          let results: PersonaReaction[] = [];
          try {
            const cleaned = rawText
              .replace(/^```json\s*/i, "")
              .replace(/^```\s*/i, "")
              .replace(/```\s*$/i, "")
              .trim();
            const parsed = JSON.parse(cleaned);
            results = Array.isArray(parsed) ? parsed : [];
          } catch (parseError) {
            console.error(`Batch ${batchIndex} parse error:`, parseError, rawText.slice(0, 200));
          }

          controller.enqueue(encoder.encode(JSON.stringify({ batch: batchIndex, results }) + "\n"));
        }
      } catch (err) {
        console.error("Stream error:", err);
        controller.enqueue(encoder.encode(JSON.stringify({ error: "Analysis failed", results: [] }) + "\n"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Transfer-Encoding": "chunked",
      "X-Accel-Buffering": "no",
      "Cache-Control": "no-cache",
    },
  });
}
