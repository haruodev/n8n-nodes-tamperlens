import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
	buildMultipart,
	joinUrl,
	multipartBoundary,
} from '../dist/nodes/Tamperlens/GenericFunctions.js';

test('multipart body is well-formed for two files', () => {
	const boundary = '----n8n-tamperlens-test';
	const body = buildMultipart(
		[
			{ field: 'original', fileName: 'a.pdf', contentType: 'application/pdf', data: Buffer.from('AAA') },
			{ field: 'candidate', fileName: 'b.pdf', contentType: 'application/pdf', data: Buffer.from('BBB') },
		],
		boundary,
	);
	const text = body.toString('utf8');

	assert.equal(text.split(`--${boundary}`).length, 4, 'two opening boundaries and one closing');
	assert.ok(text.includes('Content-Disposition: form-data; name="original"; filename="a.pdf"'));
	assert.ok(text.includes('Content-Disposition: form-data; name="candidate"; filename="b.pdf"'));
	assert.ok(text.endsWith(`--${boundary}--\r\n`), 'closes with the terminal boundary');
	assert.ok(text.includes('\r\n\r\nAAA\r\n'), 'file bytes sit between CRLF blank line and CRLF');
});

test('binary payloads survive byte-for-byte', () => {
	const boundary = '----n8n-tamperlens-test';
	const payload = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x00, 0xff, 0x0d, 0x0a]);
	const body = buildMultipart(
		[{ field: 'file', fileName: 'x.pdf', contentType: 'application/pdf', data: payload }],
		boundary,
	);
	assert.notEqual(body.indexOf(payload), -1, 'raw bytes present unmodified');
});

test('filenames with quotes and backslashes cannot break out of the header', () => {
	const body = buildMultipart(
		[
			{
				field: 'file',
				fileName: 'we"ird\\name.pdf',
				contentType: 'application/pdf',
				data: Buffer.from('x'),
			},
		],
		'----b',
	);
	assert.ok(body.toString('utf8').includes('filename="we\\"ird\\\\name.pdf"'));
});

test('joinUrl tolerates trailing slashes', () => {
	assert.equal(joinUrl('https://tamperlens.com/api/v1', '/inspect'), 'https://tamperlens.com/api/v1/inspect');
	assert.equal(joinUrl('https://tamperlens.com/api/v1/', '/inspect'), 'https://tamperlens.com/api/v1/inspect');
	assert.equal(joinUrl('https://tamperlens.com/api/v1//', '/inspect'), 'https://tamperlens.com/api/v1/inspect');
});

test('boundary is deterministic under an injected RNG and unique-ish by default', () => {
	assert.equal(multipartBoundary(() => 0), '----n8n-tamperlens-000000000000000000000000');
	assert.notEqual(multipartBoundary(), multipartBoundary());
});
