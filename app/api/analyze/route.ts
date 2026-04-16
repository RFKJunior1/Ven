import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { personas } from "@/data/personas";
import type { PersonaReaction } from "@/components/ResultsDashboard";

export const runtime = "nodejs";
export const maxDuration = 300;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function buildPersonaBlock(personaSlice: typeof personas): string {
  return personaSlice
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

function buildPrompt(personaSlice: typeof personas): string {
  const personaBlock = buildPersonaBlock(personaSlice);
  return `You are simulating the authentic, unfiltered reactions of real people to two out-of-home advertisements (Ad A and Ad B).

For each of the following ${personaSlice.length} people, based on their SPECIFIC traits, psychology, background, and life context, provide their genuine gut reaction to each ad.

${personaBlock}

For EACH persona, respond with a JSON object with EXACTLY these fields:
{
  "personaId": <number>,
  "reactionA": "<their gut reaction to Ad A in 1-2 vivid sentences - first person, unfiltered>",
  "reactionB": "<their gut reaction to Ad B in 1-2 vivid sentences - first person, unfiltered>",
  "resonanceA": <integer 0-100, how much Ad A resonated with this specific person>,
  "resonanceB": <integer 0-100, how much Ad B resonated with this specific person>,
  "wouldConvertA": <true/false, would this person act on Ad A's call to action>,
  "wouldConvertB": <true/false, would this person act on Ad B's call to action>,
  "lingeringA": <true/false, would they still be thinking about Ad A hours later>,
  "lingeringB": <true/false, would they still be thinking about Ad B hours later>,
  "philosophicalTake": "<one sentence on what this ad reveals about the society or culture that created it, from this person's perspective>"
}

Return a JSON array of exactly ${personaSlice.length} objects, one per persona, in the same order as listed above.
Respond ONLY with valid JSON — no markdown, no commentary, no code fences.`;
}

export async function POST(request: NextRequest) {
  let imageABase64: string;
  let imageBBase64: string;
  let imageAMediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  let imageBMediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";

  try {
    const formData = await request.formData();
    const imageAFile = formData.get("imageA") as File | null;
    const imageBFile = formData.get("imageB") as File | null;

    if (!imageAFile || !imageBFile) {
      return new Response(JSON.stringify({ error: "Both images are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const imageABuffer = Buffer.from(await imageAFile.arrayBuffer());
    const imageBBuffer = Buffer.from(await imageBFile.arrayBuffer());

    imageABase64 = imageABuffer.toString("base64");
    imageBBase64 = imageBBuffer.toString("base64");

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    imageAMediaType = validTypes.includes(imageAFile.type)
      ? (imageAFile.type as typeof imageAMediaType)
      : "image/jpeg";
    imageBMediaType = validTypes.includes(imageBFile.type)
      ? (imageBFile.type as typeof imageBMediaType)
      : "image/jpeg";
  } catch {
    return new Response(JSON.stringify({ error: "Failed to parse form data" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

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
          const prompt = buildPrompt(batch);

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
                  content: [
                    {
                      type: "image",
                      source: {
                        type: "base64",
                        media_type: imageAMediaType,
                        data: imageABase64,
                      },
                    },
                    {
                      type: "text",
                      text: "This is Ad A (the first out-of-home advertisement).",
                    },
                    {
                      type: "image",
                      source: {
                        type: "base64",
                        media_type: imageBMediaType,
                        data: imageBBase64,
                      },
                    },
                    {
                      type: "text",
                      text: "This is Ad B (the second out-of-home advertisement).",
                    },
                    {
                      type: "text",
                      text: prompt,
                    },
                  ],
                },
              ],
            });

            const content = response.content[0];
            if (content.type === "text") {
              rawText = content.text.trim();
            }
          } catch (apiError) {
            console.error(`Batch ${batchIndex} API error:`, apiError);
            // Send error for this batch and continue
            const errorLine = JSON.stringify({
              batch: batchIndex,
              error: `Batch ${batchIndex} failed`,
              results: [],
            });
            controller.enqueue(encoder.encode(errorLine + "\n"));
            continue;
          }

          // Parse the JSON response
          let results: PersonaReaction[] = [];
          try {
            // Strip any accidental markdown fences
            const cleaned = rawText
              .replace(/^```json\s*/i, "")
              .replace(/^```\s*/i, "")
              .replace(/```\s*$/i, "")
              .trim();
            const parsed = JSON.parse(cleaned);
            results = Array.isArray(parsed) ? parsed : [];
          } catch (parseError) {
            console.error(`Batch ${batchIndex} parse error:`, parseError, rawText.slice(0, 200));
            results = [];
          }

          const line = JSON.stringify({ batch: batchIndex, results });
          controller.enqueue(encoder.encode(line + "\n"));
        }
      } catch (err) {
        console.error("Stream error:", err);
        const errorLine = JSON.stringify({ error: "Analysis failed", results: [] });
        controller.enqueue(encoder.encode(errorLine + "\n"));
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
