import { Inngest } from "inngest"

export const inngest = new Inngest({
  id: 'nextjs-stock',
  ai: {
    gemini: {
      apiKey: process.env.GEMINI_API_KEY
    }
  }
});