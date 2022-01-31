import handlebars from 'vite-plugin-handlebars';
const { resolve } = require('path');
const { defineConfig } = require('vite');



module.exports = defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        lobby: resolve(__dirname, 'lobby/index.html'),
        game: resolve(__dirname, 'game/index.html')
      },
    }
  },
  plugins: [
    handlebars({
      partialDirectory: resolve(__dirname, 'partials')
    }),
  ]
});
