const config = {
	'*.{js,jsx,ts,tsx}': ["npx prettier --write", "npx eslint --fix --quiet"],
	'*.{md,html,css,scss,sass}': ["npx prettier --write"]
}

export default config
