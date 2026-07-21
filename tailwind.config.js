/** @type {import('tailwindcss').Config} */
module.exports = {
    content: {
        files: ['./*.html'],
        // Never scan the generated inline-CSS block: its minified tokens would
        // be picked up as class candidates and grow the CSS on every rebuild.
        transform: {
            html: (content) =>
                content.replace(/<style data-inline-css>[\s\S]*?<\/style>/g, '<style data-inline-css></style>'),
        },
    },
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                neutral: {
                    50: '#fafafa',
                    100: '#f5f5f5',
                    200: '#e5e5e5',
                    300: '#d4d4d4',
                    400: '#a3a3a3',
                    500: '#737373',
                    600: '#525252',
                    700: '#404040',
                    800: '#262626',
                    900: '#171717',
                    950: '#0a0a0a',
                },
            },
        },
    },
    plugins: [],
};
