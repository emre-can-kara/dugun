// postcss.config.js
export default {
  plugins: {
    '@tailwindcss/postcss': {
      content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
      ],
    },
    autoprefixer: {},
  },
}