const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
// [WEB] expo-sqlite en web usa un archivo .wasm
config.resolver.assetExts.push("wasm");

// [WEB] SharedArrayBuffer requiere estos headers en el servidor de desarrollo
config.server = config.server || {};
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
    return middleware(req, res, next);
  };
};

module.exports = withNativeWind(config, { input: "./src/global.css" });