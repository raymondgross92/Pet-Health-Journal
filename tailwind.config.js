/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f5f3ff',
                    100: '#ede9fe',
                    200: '#ddd6fe',
                    300: '#c4b5fd',
                    400: '#a78bfa',
                    500: '#8b5cf6', // Violet Main
                    600: '#7c3aed',
                    700: '#6d28d9',
                    800: '#5b21b6',
                    900: '#4c1d95',
                },
                secondary: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                },
                accent: {
                    50: '#ecfdf5',
                    100: '#d1fae5',
                    400: '#34d399', // Emerald
                    500: '#10b981',
                    600: '#059669',
                }
            },
            fontFamily: {
                sans: ['Nunito_400Regular'],
                bold: ['Nunito_700Bold'],
                extrabold: ['Nunito_800ExtraBold'],
            },
            borderRadius: {
                'xl': '20px',
                '2xl': '28px',
                '3xl': '36px', // Extra round
            }
        },
    },
    plugins: [],
}
