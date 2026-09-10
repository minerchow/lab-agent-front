import { generateSW } from "workbox-build";

const swConfig = {
  globDirectory: "dist/",
  globPatterns: [
    "**/*.{js,css,html,png,jpg,jpeg,gif,svg,ico,woff,woff2,ttf,eot}",
  ],
  swDest: "dist/sw.js",
  clientsClaim: true,
  skipWaiting: true,
  // 定义运行时缓存策略
  runtimeCaching: [
    {
      urlPattern: /\.(?:js|css)$/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-resources",
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|gif|svg|ico)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "images",
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        },
      },
    },
    {
      urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "fonts",
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 365 Days
        },
      },
    },
    {
      urlPattern: /^https:\/\/api\//,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-responses",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 Minutes
        },
      },
    },
  ],
};

generateSW(swConfig).then(({ count, size }) => {
  console.log(`Generated ${count} files, totaling ${size} bytes.`);
});
