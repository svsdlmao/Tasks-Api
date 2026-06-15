export default () => {
  const defaultModels = [
    'google/gemma-4-31b-it:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'openai/gpt-oss-120b:free',
    'nvidia/nemotron-3-super-120b-a12b:free',
    'qwen/qwen3-next-80b-a3b-instruct:free',
    'deepseek/deepseek-v4-flash:free',
  ];

  return {
    openRouterApiKey: process.env.OPENROUTER_API_KEY,
    openRouterModels:
      process.env.OPENROUTER_MODELS ??
      process.env.OPENROUTER_MODEL ??
      defaultModels.join(','),
    cacheTTLSeconds: Number(process.env.OPENROUTER_CACHE_TTL_SECONDS ?? '3600')
  };
};
