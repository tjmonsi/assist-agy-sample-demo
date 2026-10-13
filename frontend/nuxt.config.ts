// [spec-budget-app -> BR-002 -> FR-007 -> NFR-005] Nuxt configuration for static SPA delivery
export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2024-11-01',
  nitro: {
    preset: 'static',
    output: {
      publicDir: '.output/public',
    },
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:8080',
    },
  },
  app: {
    head: {
      title: 'Budget Tracker',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Personal budget and transaction ledger tracker' },
      ],
    },
  },
});
