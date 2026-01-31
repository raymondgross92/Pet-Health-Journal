/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#F0FDF4', // Minty White
                    100: '#DCFCE7',
                    200: '#BBF7D0',
                    300: '#86EFAC',
                    400: '#4ADE80',
                    500: '#22C55E', // Fresh Green
                    600: '#16A34A',
                    700: '#15803D', // Forest Green
                    800: '#166534',
                    900: '#14532D',
                },
                secondary: {
                    50: '#FAFAF9', // Stone 50 (Warmer)
                    100: '#F5F5F4',
                    200: '#E7E5E4',
                    300: '#D6D3D1',
                    400: '#A8A29E',
                    500: '#78716C', // Stone 500
                    600: '#57534E',
                    700: '#44403C',
                    800: '#292524',
                    900: '#1C1917',
                    950: '#0C0A09',
                },
                accent: {
                    50: '#FFF7ED', // Orange/Sand accents
                    100: '#FFEDD5',
                    400: '#FB923C',
                    500: '#F97316',
                    600: '#EA580C',
                },
                danger: {
                    50: '#FEF2F2',
                    100: '#FEE2E2',
                    500: '#EF4444',
                    600: '#DC2626',
                },
                warning: {
                    50: '#FFFBEB',
                    100: '#FEF3C7',
                    500: '#F59E0B',
                    600: '#D97706',
                },
                surface: {
                    light: '#FFFFFF',
                    dark: '#1E293B',
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
