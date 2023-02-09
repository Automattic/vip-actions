declare global {
	// Not sure why, but my IDE doesn't want to consider console as global, so here's something to force it
	// tsc doesn't really create any type error
	const console: Console;
}
