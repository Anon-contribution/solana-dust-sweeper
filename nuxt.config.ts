const nodePolyfills = require('vite-plugin-node-stdlib-browser');

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devServer: {
    port: 4000
  },
  devtools: { enabled: true },
  ssr: false,
  typescript: {
    typeCheck: true
  },
  modules: ["@nuxt/ui", "@nuxt/image"],
  vite: {
    esbuild: {
      target: "esnext",
    },
    build: {
      target: "esnext",
    },
    optimizeDeps: {
      include: ["@project-serum/anchor", "@solana/web3.js", "buffer"],
      esbuildOptions: {
        target: "esnext",
      },
    },
    define: {
      "process.env.BROWSER": true,
    },
    plugins: [nodePolyfills()],
  },
})
