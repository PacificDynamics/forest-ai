import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify/functions';

export default defineConfig({
  integrations: [tailwind(), react()],
  output: 'server',
  adapter: netlify(),
  vite: {
    build: {
      rollupOptions: {
        external: [
          '@aws-sdk/client-s3',
          '@aws-sdk/credential-providers'
        ]
      }
    },
    ssr: {
      noExternal: ['lucide-react']
    },
    // Add environment variable prefix
    envPrefix: [
      'FOREST_AI_'
    ]
  }
});
