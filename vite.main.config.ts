import type { ConfigEnv, UserConfig } from 'vite';
import { defineConfig, mergeConfig } from 'vite';
import { viteStaticCopy } from "vite-plugin-static-copy";
import os from "os";
import path from "path";
import { getBuildConfig, getBuildDefine, external, pluginHotRestart } from './vite.base.config';

// https://vitejs.dev/config
export default defineConfig((env) => {
  const forgeEnv = env as ConfigEnv<'build'>;
  const { forgeConfigSelf } = forgeEnv;
  const define = getBuildDefine(forgeEnv);
  const config: UserConfig = {
    build: {
      lib: {
        entry: forgeConfigSelf.entry!,
        fileName: () => '[name].js',
        formats: ['es'],
      },
      rollupOptions: {
        external,
        output: {
          strict: false,
        },
      },
    },
    plugins: [pluginHotRestart('restart'), viteStaticCopy({
      targets: [
        {
          src: `lib/whisper.cpp/${
            process.env.PACKAGE_OS_ARCH || os.arch()
          }/${os.platform()}/*`,
          dest: "lib/whisper",
        },
        {
          src: `lib/whisper.cpp/models/*`,
          dest: "lib/whisper/models",
        },
        {
          src: "samples/*",
          dest: "samples",
        },
      ],
    }),],
    define,
    resolve: {
      // Load the Node.js entry.
      mainFields: ['module', 'jsnext:main', 'jsnext'],// Load the Node.js entry.
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@main": path.resolve(__dirname, "./src/main"),
        "@commands": path.resolve(__dirname, "./src/commands"),
      },
    },
  };

  return mergeConfig(getBuildConfig(forgeEnv), config);
});
