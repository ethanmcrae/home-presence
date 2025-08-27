/**
 * TailwindCSS configuration file.
 *
 * This config tells Tailwind where to look for class names so it can purge unused
 * styles in production. We include all files under ./src and the root
 * index.html. You can customize the theme or extend it here.
 */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      // You can customize your colour palette and typography here
    }
  },
  plugins: []
};