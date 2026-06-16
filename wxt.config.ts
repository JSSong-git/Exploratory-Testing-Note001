import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'Exploratory Testing Extension',
    description: 'Chrome extension for exploratory testing',
    version: '1.0.0',
    permissions: [
      'storage',
      'tabs',
      'activeTab',
      'downloads',
      'scripting',
      'notifications',
    ],
    action: {
      default_title: 'Exploratory Testing',
    },
    icons: {
      128: 'icon/128.png',
    },
    web_accessible_resources: [
      {
        resources: ['annotation-editor.html'],
        matches: ['<all_urls>'],
      },
    ],
  },
});
