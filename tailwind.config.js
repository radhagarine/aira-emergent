/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ["class"],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./app/**/*.{js,ts,jsx,tsx}',
		'./components/**/*.{js,ts,jsx,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				'aira-primary': 'hsl(var(--aira-primary))',
				'aira-primary-hover': 'hsl(var(--aira-primary-hover))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				featuresFadeInUp: {
					from: {
						opacity: '0',
						transform: 'translateY(20px)'
					},
					to: {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				featuresPulse: {
					'0%, 100%': {
						opacity: '1'
					},
					'50%': {
						opacity: '0.5'
					}
				},
				glow: {
					'0%, 100%': {
						'text-shadow': '0 0 15px #FFD700, 0 0 10px #DAA520',
						'-webkit-text-stroke': '1px #FFD700'
					},
					'50%': {
						'text-shadow': '0 0 25px #FFD700, 0 0 15px #DAA520',
						'-webkit-text-stroke': '1px #FFC000'
					},
				},
				neon: {
					'0%, 100%': { 
					  'text-shadow': `
						0 0 7px #FFD700,
						0 0 10px #FFD700,
						0 0 21px #FFD700,
						0 0 42px #FFA500,
						0 0 82px #FFA500
					  `
					},
					'50%': { 
					  'text-shadow': `
						0 0 5px #FFD700,
						0 0 8px #FFD700,
						0 0 18px #FFD700,
						0 0 35px #FFA500,
						0 0 70px #FFA500
					  `
					}
				  }
			},
			animation: {
				'features-fade-in-up': 'featuresFadeInUp 0.5s ease-out forwards',
				'features-pulse': 'featuresPulse 2s infinite',
				'glow': 'glow 2s ease-in-out infinite',
				'neon': 'neon 1.5s ease-in-out infinite alternate',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
}