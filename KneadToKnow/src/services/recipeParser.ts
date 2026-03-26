import { CLAUDE_API_KEY } from '../config/secrets';
import { Ingredient, RecipeStep } from '../types';

interface ParsedRecipe {
  name: string;
  source: string;
  ingredients: Ingredient[];
  steps: RecipeStep[];
}

const PARSE_PROMPT = `You are a recipe extraction assistant. Extract the sourdough bread recipe from the content below into a structured JSON format.

Return ONLY valid JSON with this exact structure (no markdown, no backticks, no preamble):
{
  "name": "Recipe Name",
  "ingredients": [
    {"text": "500g bread flour"}
  ],
  "steps": [
    {"text": "Description of step", "type": "step"}
  ]
}

For the "type" field in steps, use these values:
- "step" — for normal recipe steps
- "stretch_folds" — for any step involving stretch and folds, coil folds, or bulk fermentation with folding
- "proof" — for any step that is primarily about proofing, bulk rise, or fermentation time

If the recipe mentions multiple stretch & fold sets, combine them into a single step with type "stretch_folds".

Content to parse:
`;

/**
 * Parse a recipe from a URL by fetching its HTML and sending to Claude.
 */
export async function parseRecipeFromUrl(url: string): Promise<ParsedRecipe> {
  // Step 1: Fetch the webpage
  const pageResponse = await fetch(url);
  const html = await pageResponse.text();

  // Strip HTML tags to get cleaner text (keep structure)
  const textContent = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .substring(0, 15000); // Stay within token limits

  return parseWithClaude(textContent, url);
}

/**
 * Parse a recipe from raw text content (file upload).
 */
export async function parseRecipeFromText(text: string, source: string = 'Uploaded file'): Promise<ParsedRecipe> {
  return parseWithClaude(text.substring(0, 15000), source);
}

/**
 * Send content to Claude API for structured recipe extraction.
 */
async function parseWithClaude(content: string, source: string): Promise<ParsedRecipe> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: PARSE_PROMPT + content,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} — ${error}`);
  }

  const data = await response.json();
  const text = data.content
    .map((block: any) => (block.type === 'text' ? block.text : ''))
    .join('');

  // Clean up any markdown fencing Claude might add
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error('Failed to parse Claude response as JSON. Raw response: ' + text.substring(0, 200));
  }

  // Map to our types with proper IDs and sort orders
  const ingredients: Ingredient[] = (parsed.ingredients || []).map(
    (ing: any, index: number) => ({
      id: `i${index + 1}`,
      text: ing.text,
      sortOrder: index,
    })
  );

  const steps: RecipeStep[] = (parsed.steps || []).map(
    (step: any, index: number) => ({
      id: `s${index + 1}`,
      text: step.text,
      type: step.type || 'step',
      sortOrder: index,
    })
  );

  return {
    name: parsed.name || 'Imported Recipe',
    source,
    ingredients,
    steps,
  };
}
