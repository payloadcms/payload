var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// dist/withPayload/withPayload.js
var withPayload_exports = {};
__export(withPayload_exports, {
  default: () => withPayload_default,
  withPayload: () => withPayload
});
module.exports = __toCommonJS(withPayload_exports);

// dist/withPayload/withPayload.utils.js
var import_fs = require("fs");
var import_url = require("url");
var import_meta = {};
function _parseInt(input) {
  return parseInt(input || "", 10);
}
var SEMVER_REGEXP = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-z-][0-9a-z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-z-][0-9a-z-]*))*))?(?:\+([0-9a-z-]+(?:\.[0-9a-z-]+)*))?$/i;
function parseSemver(input) {
  const match = input.match(SEMVER_REGEXP) || [];
  const major = _parseInt(match[1]);
  const minor = _parseInt(match[2]);
  const patch = _parseInt(match[3]);
  const prerelease = match[4];
  const canaryVersion = prerelease?.startsWith("canary.") ? parseInt(prerelease.split(".")[1] || "0", 10) : void 0;
  return {
    buildmetadata: match[5],
    canaryVersion,
    major: isNaN(major) ? void 0 : major,
    minor: isNaN(minor) ? void 0 : minor,
    patch: isNaN(patch) ? void 0 : patch,
    prerelease: match[4]
  };
}
function getNextjsVersion() {
  try {
    let pkgPath;
    if (typeof import_meta?.resolve === "function") {
      const pkgUrl = import_meta.resolve("next/package.json");
      pkgPath = (0, import_url.fileURLToPath)(pkgUrl);
    } else {
      pkgPath = require.resolve("next/package.json");
    }
    const pkgJson = JSON.parse((0, import_fs.readFileSync)(pkgPath, "utf8"));
    return parseSemver(pkgJson.version);
  } catch (e) {
    console.error("Payload: Error getting Next.js version", e);
    return void 0;
  }
}
function supportsTurbopackExternalizeTransitiveDependencies(version) {
  if (!version) {
    return false;
  }
  const {
    canaryVersion,
    major,
    minor,
    patch
  } = version;
  if (major === void 0 || minor === void 0) {
    return false;
  }
  if (major > 16) {
    return true;
  }
  if (major === 16) {
    if (minor > 1) {
      return true;
    }
    if (minor === 1) {
      if (patch > 0) {
        return true;
      }
      if (canaryVersion !== void 0) {
        return canaryVersion >= 3;
      } else {
        return true;
      }
    }
  }
  return false;
}

// dist/withPayload/withPayloadLegacy.js
var withPayloadLegacy = (nextConfig = {}) => {
  if (process.env.PAYLOAD_PATCH_TURBOPACK_WARNINGS !== "false") {
    const turbopackWarningText = "Packages that should be external need to be installed in the project directory, so they can be resolved from the output files.\nTry to install it into the project directory by running";
    const turbopackConfigWarningText = "Unrecognized key(s) in object: 'turbopack'";
    const consoleWarn = console.warn;
    console.warn = (...args) => {
      if (typeof args[1] === "string" && args[1].includes(turbopackWarningText) || typeof args[0] === "string" && args[0].includes(turbopackWarningText)) {
        return;
      }
      const hasTurbopackConfigWarning = typeof args[1] === "string" && args[1].includes(turbopackConfigWarningText) || typeof args[0] === "string" && args[0].includes(turbopackConfigWarningText);
      if (hasTurbopackConfigWarning) {
        consoleWarn(...args);
        consoleWarn('Payload: You can safely ignore the "Invalid next.config" warning above. This only occurs on Next.js 15.2.x or lower. We recommend upgrading to the latest supported Next.js version to resolve this warning.');
        return;
      }
      consoleWarn(...args);
    };
  }
  const isBuild = process.env.NODE_ENV === "production";
  const isTurbopackNextjs15 = process.env.TURBOPACK === "1";
  const isTurbopackNextjs16 = process.env.TURBOPACK === "auto";
  if (isBuild && (isTurbopackNextjs15 || isTurbopackNextjs16)) {
    throw new Error("Your Next.js version does not support using Turbopack for production builds. The *minimum* Next.js version required for Turbopack Builds is 16.1.0. Please upgrade to the latest supported Next.js version to resolve this error.");
  }
  const toReturn = {
    ...nextConfig,
    serverExternalPackages: [
      // serverExternalPackages = webpack.externals, but with turbopack support and an additional check
      // for whether the package is resolvable from the project root
      ...nextConfig.serverExternalPackages || [],
      // External, because it installs import-in-the-middle and require-in-the-middle - both in the default serverExternalPackages list.
      "@sentry/nextjs"
    ]
  };
  return toReturn;
};

// dist/withPayload/withPayload.js
var poweredByHeader = {
  key: "X-Powered-By",
  value: "Next.js, Payload"
};
var withPayload = (nextConfig = {}, options = {}) => {
  const nextjsVersion = getNextjsVersion();
  const supportsTurbopackBuild = supportsTurbopackExternalizeTransitiveDependencies(nextjsVersion);
  const env = nextConfig.env || {};
  if (nextConfig.experimental?.staleTimes?.dynamic) {
    console.warn("Payload detected a non-zero value for the `staleTimes.dynamic` option in your Next.js config. This will slow down page transitions and may cause stale data to load within the Admin panel. To clear this warning, remove the `staleTimes.dynamic` option from your Next.js config or set it to 0. In the future, Next.js may support scoping this option to specific routes.");
    env.NEXT_PUBLIC_ENABLE_ROUTER_CACHE_REFRESH = "true";
  }
  const baseConfig = {
    ...nextConfig,
    env,
    outputFileTracingExcludes: {
      ...nextConfig.outputFileTracingExcludes || {},
      "**/*": [...nextConfig.outputFileTracingExcludes?.["**/*"] || [], "drizzle-kit", "drizzle-kit/api"]
    },
    outputFileTracingIncludes: {
      ...nextConfig.outputFileTracingIncludes || {},
      "**/*": [...nextConfig.outputFileTracingIncludes?.["**/*"] || [], "@libsql/client"]
    },
    turbopack: {
      ...nextConfig.turbopack || {}
    },
    // We disable the poweredByHeader here because we add it manually in the headers function below
    ...nextConfig.poweredByHeader !== false ? {
      poweredByHeader: false
    } : {},
    headers: async () => {
      const headersFromConfig = "headers" in nextConfig ? await nextConfig.headers() : [];
      return [...headersFromConfig || [], {
        headers: [{
          key: "Accept-CH",
          value: "Sec-CH-Prefers-Color-Scheme"
        }, {
          key: "Vary",
          value: "Sec-CH-Prefers-Color-Scheme"
        }, {
          key: "Critical-CH",
          value: "Sec-CH-Prefers-Color-Scheme"
        }, ...nextConfig.poweredByHeader !== false ? [poweredByHeader] : []],
        source: "/:path*"
      }];
    },
    serverExternalPackages: [
      ...nextConfig.serverExternalPackages || [],
      // WHY: without externalizing graphql, a graphql version error will be thrown
      // during runtime ("Ensure that there is only one instance of \"graphql\" in the node_modules\ndirectory.")
      "graphql",
      ...process.env.NODE_ENV === "development" && options.devBundleServerPackages !== true ? (
        /**
        * Unless explicitly disabled by the user, by passing `devBundleServerPackages: true` to withPayload, we
        * do not bundle server-only packages during dev for two reasons:
        *
        * 1. Performance: Fewer files to compile means faster compilation speeds.
        * 2. Turbopack support: Webpack's externals are not supported by Turbopack.
        *
        * Regarding Turbopack support: Unlike webpack.externals, we cannot use serverExternalPackages to
        * externalized packages that are not resolvable from the project root. So including a package like
        * "drizzle-kit" in here would do nothing - Next.js will ignore the rule and still bundle the package -
        * because it detects that the package is not resolvable from the project root (= not directly installed
        * by the user in their own package.json).
        *
        * Instead, we can use serverExternalPackages for the entry-point packages that *are* installed directly
        * by the user (e.g. db-postgres, which then installs drizzle-kit as a dependency).
        *
        *
        *
        * We should only do this during development, not build, because externalizing these packages can hurt
        * the bundle size. Not only does it disable tree-shaking, it also risks installing duplicate copies of the
        * same package.
        *
        * Example:
        * - @payloadcms/richtext-lexical (in bundle) -> installs qs-esm (bundled because of importer)
        * - payload (not in bundle, external) -> installs qs-esm (external because of importer)
        * Result: we have two copies of qs-esm installed - one in the bundle, and one in node_modules.
        *
        * During development, these bundle size difference do not matter much, and development speed /
        * turbopack support are more important.
        */
        ["payload", "@payloadcms/db-mongodb", "@payloadcms/db-postgres", "@payloadcms/db-sqlite", "@payloadcms/db-vercel-postgres", "@payloadcms/db-d1-sqlite", "@payloadcms/drizzle", "@payloadcms/email-nodemailer", "@payloadcms/email-resend", "@payloadcms/graphql", "@payloadcms/payload-cloud", "@payloadcms/plugin-redirects"]
      ) : []
    ],
    webpack: (webpackConfig, webpackOptions) => {
      const incomingWebpackConfig = typeof nextConfig.webpack === "function" ? nextConfig.webpack(webpackConfig, webpackOptions) : webpackConfig;
      return {
        ...incomingWebpackConfig,
        externals: [
          ...incomingWebpackConfig?.externals || [],
          /**
          * See the explanation in the serverExternalPackages section above.
          * We need to force Webpack to emit require() calls for these packages, even though they are not
          * resolvable from the project root. You would expect this to error during runtime, but Next.js seems to be able to require these just fine.
          *
          * This is the only way to get Webpack Build to work, without the bundle size caveats of externalizing the
          * entry point packages, as explained in the serverExternalPackages section above.
          */
          "drizzle-kit",
          "drizzle-kit/api",
          "sharp",
          "libsql",
          "require-in-the-middle"
        ],
        plugins: [
          ...incomingWebpackConfig?.plugins || [],
          // Fix cloudflare:sockets error: https://github.com/vercel/next.js/discussions/50177
          new webpackOptions.webpack.IgnorePlugin({
            resourceRegExp: /^pg-native$|^cloudflare:sockets$/
          })
        ],
        resolve: {
          ...incomingWebpackConfig?.resolve || {},
          alias: {
            ...incomingWebpackConfig?.resolve?.alias || {}
          },
          fallback: {
            ...incomingWebpackConfig?.resolve?.fallback || {},
            /*
            * This fixes the following warning when running next build with webpack (tested on Next.js 16.0.3 with Payload 3.64.0):
            *
            * ⚠ Compiled with warnings in 8.7s
            *
            * ./node_modules/.pnpm/mongodb@6.16.0/node_modules/mongodb/lib/deps.js
            * Module not found: Can't resolve 'aws4' in '/Users/alessio/Documents/temp/next16p/node_modules/.pnpm/mongodb@6.16.0/node_modules/mongodb/lib'
            *
            * Import trace for requested module:
            * ./node_modules/.pnpm/mongodb@6.16.0/node_modules/mongodb/lib/deps.js
            * ./node_modules/.pnpm/mongodb@6.16.0/node_modules/mongodb/lib/client-side-encryption/client_encryption.js
            * ./node_modules/.pnpm/mongodb@6.16.0/node_modules/mongodb/lib/index.js
            * ./node_modules/.pnpm/mongoose@8.15.1/node_modules/mongoose/lib/index.js
            * ./node_modules/.pnpm/mongoose@8.15.1/node_modules/mongoose/index.js
            * ./node_modules/.pnpm/@payloadcms+db-mongodb@3.64.0_payload@3.64.0_graphql@16.12.0_typescript@5.7.3_/node_modules/@payloadcms/db-mongodb/dist/index.js
            * ./src/payload.config.ts
            * ./src/app/my-route/route.ts
            *
            **/
            aws4: false
          }
        }
      };
    }
  };
  if (nextConfig.basePath) {
    process.env.NEXT_BASE_PATH = nextConfig.basePath;
    baseConfig.env.NEXT_BASE_PATH = nextConfig.basePath;
  }
  if (!supportsTurbopackBuild) {
    return withPayloadLegacy(baseConfig);
  } else {
    return {
      ...baseConfig,
      serverExternalPackages: [
        ...baseConfig.serverExternalPackages || [],
        "drizzle-kit",
        "drizzle-kit/api",
        "sharp",
        "libsql",
        "require-in-the-middle",
        // Prevents turbopack build errors by the thread-stream package which is installed by pino
        "pino"
      ]
    };
  }
};
var withPayload_default = withPayload;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  withPayload
});
//# sourceMappingURL=withPayload.cjs.map
