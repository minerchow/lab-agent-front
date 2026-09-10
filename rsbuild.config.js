/* eslint-disable */
import { defineConfig } from "@rsbuild/core";
import { pluginEslint } from "@rsbuild/plugin-eslint";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginSass } from "@rsbuild/plugin-sass";
import { pluginTypeCheck } from "@rsbuild/plugin-type-check";
import { rspack } from "@rspack/core";
import autoprefixer from "autoprefixer";

// eslint-disable-next-line no-undef
console.log(process.env.CROSS_ENV);
export default defineConfig({
  plugins: [
    pluginReact(),
    pluginSass(),
    pluginEslint(),
    pluginTypeCheck({
      enable: true, // 启用类型检查
      // 可选配置
      // tsconfigPath: './tsconfig.json', // 自定义 tsconfig 路径
      // forkTsCheckerOptions: { /* 额外的检查器选项 */ }
    }),
  ],
  entry: "index.js",
  server: {
    port: 3000,
    host: "localhost"
  },
  output: {
    polyfill: "usage",
  },
  //@ts-ignore
  resolve: {
    // 确保 TypeScript 可以找到类型定义
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
  },
  // 配置 TypeScript 以正确处理 JSX
  tsLoader: {
    compilerOptions: {
      jsx: "react-jsx",
      jsxImportSource: "react",
    },
  },
  tools: {
    babel: {
      plugins: [
        [
          "babel-plugin-react-compiler",
          {
            // 可选：排除不需要编译的文件（支持 glob 模式）
            exclude: /node_modules/,
            // 其他插件配置项（参考官方文档）
          },
        ],
      ],
    },
    postcss: (config) => {
      // 确保 postcssOptions 和 plugins 存在
      if (!config.postcssOptions) {
        config.postcssOptions = { plugins: [] };
      }
      if (!config.postcssOptions.plugins) {
        config.postcssOptions.plugins = [];
      }

      // 添加 autoprefixer 插件
      config.postcssOptions.plugins.push(
        autoprefixer({
          // 使用非常旧的浏览器列表来强制生成前缀
          overrideBrowserslist: [
            "Android >= 2.3",
            "iOS >= 7",
            "last 5 versions",
          ],
          grid: false,
          // 强制添加前缀，即使在现代浏览器中不需要
          cascade: true,
        })
      );
      return config;
    },
    swc: {}, // 添加 swc 配置以支持 service worker
    rspack: {
      // 添加externals配置，将peerDependencies中的库排除在打包范围外
      // externals: {
      //   'react': 'React',
      //   'react-dom': 'ReactDOM'
      //   // 'react-router-dom': 'ReactRouterDOM' // 添加这一行
      // },
      plugins: [
        new rspack.HtmlRspackPlugin({
          title: "xxx",
          template: "public/index.html",
          filename: "index.html",
          scriptLoading: "defer",
          inject: "body",
          minify: process.env.CROSS_ENV === "production",
        }),
      ],
    },
  },
  html: false,
  resolve: {
    alias: {
      "@": "./src",
    },
  },
  performance: {
    removeConsole: process.env.CROSS_ENV === "production" ? true : false,
    chunkSplit: {
      strategy: "custom",
      splitChunks: {
        name: true,
        cacheGroups: {
          react: {
            test: /node_modules[\\/](react|react-dom|react-router-dom|react-router)[\\/]/,
            name: "react",
            minChunks: 1,
            priority: -2,
            chunks: "all",
            enforce: true,
          },
          antdMobile: {
            test: /node_modules[\\/](antd-mobile)[\\/]/,
            name: "antd-mobile",
            minChunks: 1,
            priority: -9,
            chunks: "all",
            reuseExistingChunk: true,
          },

          vendor: {
            name: "vendor",
            chunks: "all",
            minChunks: 3,
            priority: -10,
            test: /[\\/]node_modules[\\/]/,
            reuseExistingChunk: true,
            minSize: 30000,
          },
          common: {
            chunks: "all",
            test: /[\\/]src[\\/]/,
            minChunks: 3,
            priority: -20,
            reuseExistingChunk: true,
            name: "common",
            minSize: 30000,
          },
          default: {
            priority: -30,
            reuseExistingChunk: true,
          },
        },
      },
    },
    // bundleAnalyze:{
    //   analyzerMode: 'server',
    //   openAnalyzer: true,
    // }
  },
  source: {
    define: {
      CROSS_ENV: JSON.stringify(process.env.CROSS_ENV),
    },
    // transformImport: [
    //   { libraryName:  "antd-mobile", libraryDirectory: 'es/components', style: false },
    // ],
  },
});
