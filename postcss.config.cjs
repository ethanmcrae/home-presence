/**
 * PostCSS configuration with TailwindCSS and Autoprefixer.
 *
 * PostCSS processes your CSS via plugins. TailwindCSS adds the utility
 * classes and Autoprefixer ensures vendor prefixes are added for
 * browser compatibility.
 */
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};