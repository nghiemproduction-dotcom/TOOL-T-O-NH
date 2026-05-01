import { GoogleGenAI, Type } from "@google/genai";

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export interface Preset {
  id: string;
  name: string;
  prompts: string[];
}

export const presets: Preset[] = [
  {
    id: "gao-tam-cam",
    name: "DỰNG CHÂN DUNG NGHỆ THUẬT RICE-ART",
    prompts: [
      // Style 1: Sand Art
      'Maintain original aspect ratio and facial proportions. Do NOT stretch or squash the image. Hyper-realistic sand art portrait, based precisely on the person in the original image, ensuring full character fidelity without alteration of age or gender features, rendered with extremely detailed layers of colored sand. The image features a rich, but bright and luminous tonal gradient, utilizing warm golden browns, light sepia tones, and pale tans to create a photorealistic granular texture that minimizes deep, dark shadows, ensuring the face is bright and aesthetic. All original facial features, hair details (including wrinkles or beard if present in the source), and accessories (like glasses frames) are precisely rendered with fine sand grains. Soft, blended shadows are achieved through varying sand densities and subtle color shades to preserve clarity and brightness. The background is a textured, light sandy beige surface. Masterpiece quality sand painting.',
      // Style 2: Colored Pencil (Roasted Rice Tone)
      'Maintain original aspect ratio and facial proportions. Do NOT stretch or squash the image. Professional colored pencil portrait drawing, based precisely on the person in the original image. The entire piece is rendered in a sophisticated "roasted rice" color palette: varying shades of warm golden browns, toasted ambers, light sepia, and pale cream tans. Extremely detailed and ultra-smooth blending, showing meticulous fine-line pencil textures and cross-hatching to define volumes. High fidelity to the original person face, hair, and features. The lighting is bright and aesthetic, avoiding deep shadows to keep the portrait luminous. Masterpiece quality, hand-drawn art on textured paper.',
      // Style 3: Watercolor + Colored Pencil (Roasted Rice Tone)
      'Maintain original aspect ratio and facial proportions. Do NOT stretch or squash the image. A masterpiece portrait blending realistic watercolor washes with fine-point colored pencil details, based precisely on the subject in the photo. Tonal direction: "roasted rice" palette (warm golden browns, sepia tones, toasted grains). Luminous, fluid watercolor gradients form the base skin tones and backgrounds, while sharp colored pencil strokes define the eyes, hair strands, and intricate facial details. The overall look is bright, highly aesthetic, and detailed without dark heavy shadows. Full character fidelity preserved.'
    ]
  },
  {
    id: "tach-nen",
    name: "MACRO PORTRAIT & REMOVE BG",
    prompts: [
      'Maintain original aspect ratio and facial proportions. Do NOT stretch or squash. A hyper-detailed, ultra-photorealistic macro-portrait of the subject from the reference image, perfect facial likeness... (detailed features preservation). Shot on high-end camera. Perfectly smooth pure chroma key green solid background (#00FF00).',
      'Maintain original aspect ratio and facial proportions. Do NOT stretch or squash. A hyper-detailed portrait upgrade. Studio lighting. Sharp detail. Solid green background.',
      'Maintain original aspect ratio and facial proportions. Do NOT stretch or squash. High-end portrait photography style. Green background for easy cutout.'
    ]
  }
];

export async function generateImageVariation(
  promptVariation: string,
  base64ImageData: string,
  mimeType: string,
  userModifier: string,
  customApiKey?: string
): Promise<string | null> {
  const finalPrompt = userModifier 
    ? `${promptVariation}\n\nAdditional user requirement: ${userModifier}`
    : promptVariation;

  const apiKeyToUse = (customApiKey && customApiKey.trim().length > 0) 
    ? customApiKey.trim() 
    : (process.env.GEMINI_API_KEY);
  
  if (!apiKeyToUse || apiKeyToUse === "undefined" || apiKeyToUse === "") {
    console.error("[Gemini] API Key is missing. User must provide one in UI.");
    throw new Error("MISSING_API_KEY");
  }

  // Final validation of key format (basic check)
  const finalApiKey = apiKeyToUse.trim();
  const ai = new GoogleGenAI({ apiKey: finalApiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: `(CRITICAL: Maintain original image dimensions and aspect ratio. Do NOT stretch, warp, or change the subject's proportions). ${finalPrompt}`,
          },
        ],
      },
    });

    if (response.candidates && response.candidates.length > 0) {
      const parts = response.candidates[0].content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          return part.inlineData.data;
        }
      }
    }
  } catch (error: any) {
    console.error("Gemini API Error Detail:", error);
    
    // Robust error checking for production (JSON status, code, or message)
    const errorStr = JSON.stringify(error).toLowerCase();
    const errorMsg = (error?.message || String(error)).toLowerCase();
    const statusCode = error?.status || error?.statusCode || (error?.error?.code);

    // 1. Check for Quota Exceeded (429)
    if (
      statusCode === 429 ||
      errorMsg.includes("429") || 
      errorMsg.includes("quota") || 
      errorMsg.includes("limit") ||
      errorStr.includes("429") ||
      errorStr.includes("quota") ||
      errorStr.includes("resource_exhausted")
    ) {
      throw new Error("QUOTA_EXCEEDED");
    }

    // 2. Check for Invalid/Missing API Key (400/403)
    if (
      statusCode === 400 || 
      statusCode === 403 ||
      errorMsg.includes("api key not found") || 
      errorMsg.includes("invalid") || 
      errorStr.includes("403") ||
      errorStr.includes("api_key_invalid")
    ) {
      throw new Error("INVALID_API_KEY");
    }

    throw error;
  }

  return null;
}
