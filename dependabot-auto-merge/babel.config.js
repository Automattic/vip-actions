/** @type {import('@babel/core').TransformOptions} */
const config = {
	presets: [
		[ '@babel/preset-env', { targets: { node: 'current' } } ],
		'@babel/preset-typescript',
	],
	env: {
		test: {
			plugins: [
				// see https://github.com/facebook/jest/issues/936#issuecomment-821944391
				// Jest has no good way of partially mocking a module
				'explicit-exports-references',
			],
		},
	},
};

module.exports = config;
