/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				// FamilyFast brand colors - warm, welcoming family-oriented palette
				primary: {
					50: '#fef7ee',
					100: '#fdecd6',
					200: '#fad5ac',
					300: '#f6b878',
					400: '#f19141',
					500: '#ed741c',
					600: '#de5a12',
					700: '#b84311',
					800: '#933616',
					900: '#772f15',
					950: '#401509',
				},
				secondary: {
					50: '#f0f9ff',
					100: '#e0f2fe',
					200: '#bae6fd',
					300: '#7dd3fc',
					400: '#38bdf8',
					500: '#0ea5e9',
					600: '#0284c7',
					700: '#0369a1',
					800: '#075985',
					900: '#0c4a6e',
					950: '#082f49',
				},
				accent: {
					50: '#fdf4ff',
					100: '#fae8ff',
					200: '#f5d0fe',
					300: '#f0abfc',
					400: '#e879f9',
					500: '#d946ef',
					600: '#c026d3',
					700: '#a21caf',
					800: '#86198f',
					900: '#701a75',
					950: '#4a044e',
				}
			},
			fontFamily: {
				sans: ['Nunito', 'system-ui', 'sans-serif'],
				display: ['Quicksand', 'system-ui', 'sans-serif'],
			},
		},
	},
	plugins: [],
};
