export const env = {
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ?? '',
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL ?? 'qwen/qwen3.6-plus',
} as const;

export function validateEnv(): void {
  if (!env.OPENROUTER_API_KEY) {
    throw new Error(
      'OPENROUTER_API_KEY is not set. Copy .env.example to .env and add your key.'
    );
  }
}
