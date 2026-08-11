/**
 * Pure helpers, kept free of n8n types so they can be unit-tested with the
 * plain Node test runner.
 */

export interface MultipartFile {
	field: string;
	fileName: string;
	contentType: string;
	data: Buffer;
}

/**
 * Build a multipart/form-data body by hand.
 *
 * Deliberate: verified community nodes must not carry runtime dependencies, so
 * no form-data package. The format is two headers and a blank line per part,
 * CRLF line endings, and a closing boundary — nothing that warrants a library.
 */
export function buildMultipart(files: MultipartFile[], boundary: string): Buffer {
	const parts: Buffer[] = [];
	for (const file of files) {
		parts.push(
			Buffer.from(
				`--${boundary}\r\n` +
					`Content-Disposition: form-data; name="${file.field}"; filename="${escapeQuotes(file.fileName)}"\r\n` +
					`Content-Type: ${file.contentType}\r\n\r\n`,
				'utf8',
			),
			file.data,
			Buffer.from('\r\n', 'utf8'),
		);
	}
	parts.push(Buffer.from(`--${boundary}--\r\n`, 'utf8'));
	return Buffer.concat(parts);
}

/** RFC 2183 filenames go inside double quotes; escape the two bytes that break out. */
function escapeQuotes(value: string): string {
	return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/** A boundary that cannot collide with document bytes by accident. */
export function multipartBoundary(random: () => number = Math.random): string {
	let token = '';
	for (let i = 0; i < 24; i++) token += Math.floor(random() * 36).toString(36);
	return `----n8n-tamperlens-${token}`;
}

/** Trailing-slash-tolerant join so a pasted base URL never doubles a slash. */
export function joinUrl(baseUrl: string, path: string): string {
	return `${baseUrl.replace(/\/+$/, '')}${path}`;
}
