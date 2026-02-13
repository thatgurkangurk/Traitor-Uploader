
export function generate(): string {
	const bytes = new Uint8Array(32);
	return crypto.getRandomValues(bytes).toBase64();
}
