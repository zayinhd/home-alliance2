module.exports = function (api) {
    api.cache(true);
    return {
        presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }]],
        plugins: [
            // ... other plugins
            "react-native-reanimated/plugin",
        ],
    };
};
