/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,jsx,ts,tsx}",
        "./components/**/*.{js,jsx,ts,tsx}",
    ],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            fontFamily: {
                "Jost-Black": ["Jost-Black", "sans-serif"],
                "Jost-Bold": ["Jost-Bold", "sans-serif"],
                "Jost-ExtraBold": ["Jost-ExtraBold", "sans-serif"],
                "Jost-Italic": ["Jost-Italic", "sans-serif"],
                "Jost-Light": ["Jost-Light", "sans-serif"],
                "Jost-Medium": ["Jost-Medium", "sans-serif"],
                "Jost-Regular": ["Jost-Regular", "sans-serif"],
            },
            colors: {
                primary: "#2a6ff2ff",
                secondary: "#f29f05ff",
                accent: "#0bd9b8ff",
                danger: "#ff0000ff",
                success: "#00bf00ff",
                warning: "ff4504ff",
            },
        },
    },
    plugins: [],
};
