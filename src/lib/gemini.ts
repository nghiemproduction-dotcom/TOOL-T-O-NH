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
      'Hyper-realistic sand art portrait, based precisely on the person in the original image, ensuring full character fidelity without alteration of age or gender features, rendered with extremely detailed layers of colored sand. The image features a rich, but bright and luminous tonal gradient, utilizing warm golden browns, light sepia tones, and pale tans to create a photorealistic granular texture that minimizes deep, dark shadows, ensuring the face is bright and aesthetic. All original facial features, hair details (including wrinkles or beard if present in the source), and accessories (like glasses frames) are precisely rendered with fine sand grains. Soft, blended shadows are achieved through varying sand densities and subtle color shades to preserve clarity and brightness. The background is a textured, light sandy beige surface. Masterpiece quality sand painting.',
      // Style 2: Colored Pencil (Roasted Rice Tone)
      'Professional colored pencil portrait drawing, based precisely on the person in the original image. The entire piece is rendered in a sophisticated "roasted rice" color palette: varying shades of warm golden browns, toasted ambers, light sepia, and pale cream tans. Extremely detailed and ultra-smooth blending, showing meticulous fine-line pencil textures and cross-hatching to define volumes. High fidelity to the original person face, hair, and features. The lighting is bright and aesthetic, avoiding deep shadows to keep the portrait luminous. Masterpiece quality, hand-drawn art on textured paper.',
      // Style 3: Watercolor + Colored Pencil (Roasted Rice Tone)
      'A masterpiece portrait blending realistic watercolor washes with fine-point colored pencil details, based precisely on the subject in the photo. Tonal direction: "roasted rice" palette (warm golden browns, sepia tones, toasted grains). Luminous, fluid watercolor gradients form the base skin tones and backgrounds, while sharp colored pencil strokes define the eyes, hair strands, and intricate facial details. The overall look is bright, highly aesthetic, and detailed without dark heavy shadows. Full character fidelity preserved.'
    ]
  },
  {
    id: "tach-nen",
    name: "MACRO PORTRAIT & REMOVE BG",
    prompts: [
      'A hyper-detailed, ultra-photorealistic macro-portrait of the exact same Asian woman from the reference image, perfect facial likeness. She has dark hair styled in an elegant updo with individual, meticulously defined, separated loose wavy strands framing her face. She wears the identical light olive green top, which now shows its complex individual woven fibers and thread counts with macro-level clarity. The cluster of white fabric roses at her bust is rendered with incredible detail, showing the complex petal structure, the specific woven fabric texture of each petal, and tiny, clearly defined thread-sewn details connecting them. She wears the gold leaf-like earrings and a gold arm cuff with intricate surface textures, micro-scratches, and sharp metallic reflections. The skin texture is upgraded to a pore-perfect, natural texture, clearly showing individual pores and microscopic peach fuzz, without excessive smoothing. Her detailed eye makeup features individual eyelashes clearly defined. Professional multi-point studio lighting to emphasize textures, clear rim lighting. Perfectly smooth pure chroma key green solid background (#00FF00). Razor-sharp critical focus across her face and all intricate details. Shot on a Hasselblad H6D-100c with an 85mm f/1.4 lens for critical focus, f/2.2, 1/250s, ISO 100, 8k resolution, incredibly lifelike, masterpiece, sharpest details possible\n\nNEGATIVE PROMPT: blur, low resolution, poorly drawn, cartoon, illustration, painting, 3d render, distorted face, messy background, complex background, text, watermark, artificial plastic skin, airbrushed, overly smooth skin, mutated, overexposed, underexposed, bad proportions, depth of field blur, noise, artifacts.',
      'A hyper-detailed, ultra-photorealistic macro-portrait of the exact same Asian woman from the reference image, perfect facial likeness. She has dark hair styled in an elegant updo with individual, meticulously defined, separated loose wavy strands framing her face. She wears the identical light olive green top, which now shows its complex individual woven fibers and thread counts with macro-level clarity. The cluster of white fabric roses at her bust is rendered with incredible detail, showing the complex petal structure, the specific woven fabric texture of each petal, and tiny, clearly defined thread-sewn details connecting them. She wears the gold leaf-like earrings and a gold arm cuff with intricate surface textures, micro-scratches, and sharp metallic reflections. The skin texture is upgraded to a pore-perfect, natural texture, clearly showing individual pores and microscopic peach fuzz, without excessive smoothing. Her detailed eye makeup features individual eyelashes clearly defined. Professional multi-point studio lighting to emphasize textures, clear rim lighting. Perfectly smooth pure chroma key green solid background (#00FF00). Razor-sharp critical focus across her face and all intricate details. Shot on a Hasselblad H6D-100c with an 85mm f/1.4 lens for critical focus, f/2.2, 1/250s, ISO 100, 8k resolution, incredibly lifelike, masterpiece, sharpest details possible\n\nNEGATIVE PROMPT: blur, low resolution, poorly drawn, cartoon, illustration, painting, 3d render, distorted face, messy background, complex background, text, watermark, artificial plastic skin, airbrushed, overly smooth skin, mutated, overexposed, underexposed, bad proportions, depth of field blur, noise, artifacts.',
      'A hyper-detailed, ultra-photorealistic macro-portrait of the exact same Asian woman from the reference image, perfect facial likeness. She has dark hair styled in an elegant updo with individual, meticulously defined, separated loose wavy strands framing her face. She wears the identical light olive green top, which now shows its complex individual woven fibers and thread counts with macro-level clarity. The cluster of white fabric roses at her bust is rendered with incredible detail, showing the complex petal structure, the specific woven fabric texture of each petal, and tiny, clearly defined thread-sewn details connecting them. She wears the gold leaf-like earrings and a gold arm cuff with intricate surface textures, micro-scratches, and sharp metallic reflections. The skin texture is upgraded to a pore-perfect, natural texture, clearly showing individual pores and microscopic peach fuzz, without excessive smoothing. Her detailed eye makeup features individual eyelashes clearly defined. Professional multi-point studio lighting to emphasize textures, clear rim lighting. Perfectly smooth pure chroma key green solid background (#00FF00). Razor-sharp critical focus across her face and all intricate details. Shot on a Hasselblad H6D-100c with an 85mm f/1.4 lens for critical focus, f/2.2, 1/250s, ISO 100, 8k resolution, incredibly lifelike, masterpiece, sharpest details possible\n\nNEGATIVE PROMPT: blur, low resolution, poorly drawn, cartoon, illustration, painting, 3d render, distorted face, messy background, complex background, text, watermark, artificial plastic skin, airbrushed, overly smooth skin, mutated, overexposed, underexposed, bad proportions, depth of field blur, noise, artifacts.'
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

  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("MISSING_API_KEY");
  }

  const ai = new GoogleGenAI({ apiKey });

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
            text: finalPrompt,
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
    
    // Convert error to string/json for broad checking
    const errorStr = JSON.stringify(error).toLowerCase();
    const errorMsg = (error?.message || String(error)).toLowerCase();
    
    // 1. Check for Quota Exceeded (429)
    if (
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
      errorMsg.includes("api key not found") || 
      errorMsg.includes("invalid") || 
      errorMsg.includes("403") ||
      errorStr.includes("403") ||
      errorStr.includes("api_key_invalid")
    ) {
      throw new Error("INVALID_API_KEY");
    }

    throw error;
  }

  return null;
}
