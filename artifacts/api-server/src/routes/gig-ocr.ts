import { Router, type IRouter } from "express";
import { z } from "zod";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

const OcrBody = z.object({
  imageBase64: z.string().min(1),
  mimeType: z.string().default("image/png"),
});

router.post("/gig/ocr", async (req, res): Promise<void> => {
  const parsed = OcrBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "imageBase64 is required" });
    return;
  }

  const { imageBase64, mimeType } = parsed.data;

  const today = new Date().toISOString().slice(0, 10);

  const response = await openai.chat.completions.create({
    model: "gpt-5.1",
    max_completion_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
              detail: "high",
            },
          },
          {
            type: "text",
            text: `Extract gig work earnings data from this screenshot. Return ONLY a JSON object with exactly these fields (use null for anything not visible):
{
  "entryDate": "YYYY-MM-DD or null",
  "platform": "doordash, uber, airtasker, cash, or other — null if unclear",
  "person": "driver/worker name or null",
  "startTime": "HH:MM 24h or null",
  "endTime": "HH:MM 24h or null",
  "hoursWorked": number or null,
  "grossEarnings": number or null,
  "tips": number or null,
  "fastPayAmount": number or null,
  "weeklyDepositAmount": number or null,
  "fees": number or null,
  "fuelEstimate": number or null,
  "otherExpenses": number or null,
  "netIncome": number or null,
  "paymentStatus": "pending, fast-paid, deposited, or received — null if unclear",
  "notes": "one-line summary of what this screenshot shows, or null"
}
Today is ${today}. Output only valid JSON with no markdown fences or extra text.`,
          },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content?.trim() ?? "{}";
  try {
    const data = JSON.parse(content);
    res.json({ data });
  } catch {
    res.status(422).json({ error: "Could not parse AI response", raw: content });
  }
});

export default router;
