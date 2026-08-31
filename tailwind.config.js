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
                display: ['Instrument Serif', 'ui-serif', 'Georgia', 'serif'],
                hand: ['Caveat', 'ui-serif', 'cursive'],
            },
            colors: {
                // Warm brown-tinted neutrals, ported from cmrg.me. Every step is
                // hue-shifted toward orange, so a "grey" here never reads cold.
                neutral: {
                    50: '#fef8f2',
                    100: '#f6f0eb',
                    150: '#f6ece4',
                    200: '#e9dfd7',
                    300: '#cfc3b9',
                    400: '#b7a89b',
                    500: '#948475',
                    600: '#6c6158',
                    700: '#3b3229',
                    800: '#2e2821',
                    850: '#28231f',
                    900: '#231e1a',
                    950: '#13110f',
                },
                // Burnt orange: hand-drawn marker underlines only.
                ember: {
                    300: '#f1b798',
                    400: '#e89068',
                    500: '#f1733d',
                },
                // Muted gold: highlights, ::selection, star ratings.
                amber: {
                    300: '#d4b98a',
                    400: '#ca9e66',
                    500: '#ba9659',
                    600: '#8e7347',
                },
            },
        },
    },
    plugins: [],
};
