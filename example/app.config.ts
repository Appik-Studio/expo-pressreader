import "ts-node/register";

module.exports = {
  expo: {
    name: "expo-pressreader-example",
    slug: "expo-pressreader-example",
    scheme: "expo-pressreader-example",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    plugins: [
      [
        "expo-build-properties",
        {
          ios: {
            deploymentTarget: "16.0",
          },
        },
      ],
      [
        "../plugin/build/index.js",
        {
          serviceName: "pressreader",
          isDebugMode: process.env.NODE_ENV === "development",
        },
      ],
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.expopressreader.example",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      package: "com.expopressreader.example",
    },
  },
};
