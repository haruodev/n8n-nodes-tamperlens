import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { buildMultipart, joinUrl, multipartBoundary } from './GenericFunctions';

export class Tamperlens implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Tamperlens',
		name: 'tamperlens',
		icon: { light: 'file:tamperlens.svg', dark: 'file:tamperlens.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description:
			'Structural fraud signals for PDFs, images and Office documents — evidence and the benign explanation for each signal, never an approve/deny verdict',
		defaults: {
			name: 'Tamperlens',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'tamperlensApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Inspect Document',
						value: 'inspect',
						action: 'Inspect a document for fraud signals',
						description:
							'Report structural editing signals on a PDF, image or Office document — revision chains, fonts, producer strings, metadata — with evidence for each',
					},
					{
						name: 'Get Metadata',
						value: 'metadata',
						action: 'Extract document metadata',
						description:
							'Read the metadata a file carries (authors, tools, dates, device traces) without a full inspection',
					},
					{
						name: 'Compare Documents',
						value: 'compare',
						action: 'Compare a document against a trusted original',
						description:
							'Diff a candidate PDF against the original you already trust — the strongest check there is. Metered as 2 documents.',
					},
				],
				default: 'inspect',
			},
			{
				displayName: 'Input Binary Field',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: { operation: ['inspect', 'metadata'] },
				},
				hint: 'The name of the input binary field containing the document to check',
			},
			{
				displayName: 'Original Binary Field',
				name: 'originalBinaryProperty',
				type: 'string',
				default: 'original',
				required: true,
				displayOptions: {
					show: { operation: ['compare'] },
				},
				hint: 'The input binary field holding the PDF you already trust',
			},
			{
				displayName: 'Candidate Binary Field',
				name: 'candidateBinaryProperty',
				type: 'string',
				default: 'candidate',
				required: true,
				displayOptions: {
					show: { operation: ['compare'] },
				},
				hint: 'The input binary field holding the PDF being checked',
			},
			{
				displayName: 'Issuer',
				name: 'issuer',
				type: 'string',
				default: '',
				displayOptions: {
					show: { operation: ['inspect'] },
				},
				description:
					'Optional issuer name (e.g. a bank) to compare the document against that issuer\'s baseline. See the API docs for supported issuers.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		const credentials = await this.getCredentials('tamperlensApi');
		const baseUrl = (credentials.baseUrl as string) || 'https://tamperlens.com/api/v1';

		for (let i = 0; i < items.length; i++) {
			try {
				let options: IHttpRequestOptions;

				if (operation === 'compare') {
					const originalProperty = this.getNodeParameter('originalBinaryProperty', i) as string;
					const candidateProperty = this.getNodeParameter('candidateBinaryProperty', i) as string;
					const original = this.helpers.assertBinaryData(i, originalProperty);
					const candidate = this.helpers.assertBinaryData(i, candidateProperty);
					const originalBuffer = await this.helpers.getBinaryDataBuffer(i, originalProperty);
					const candidateBuffer = await this.helpers.getBinaryDataBuffer(i, candidateProperty);

					const boundary = multipartBoundary();
					const body = buildMultipart(
						[
							{
								field: 'original',
								fileName: original.fileName ?? 'original.pdf',
								contentType: original.mimeType ?? 'application/pdf',
								data: originalBuffer,
							},
							{
								field: 'candidate',
								fileName: candidate.fileName ?? 'candidate.pdf',
								contentType: candidate.mimeType ?? 'application/pdf',
								data: candidateBuffer,
							},
						],
						boundary,
					);

					options = {
						method: 'POST',
						url: joinUrl(baseUrl, '/compare'),
						headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
						body,
					};
				} else {
					const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
					const binary = this.helpers.assertBinaryData(i, binaryPropertyName);
					const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);

					const headers: Record<string, string> = {
						'Content-Type': binary.mimeType ?? 'application/octet-stream',
					};
					if (operation === 'inspect') {
						const issuer = this.getNodeParameter('issuer', i, '') as string;
						if (issuer !== '') headers['X-Tamperlens-Issuer'] = issuer;
					}

					options = {
						method: 'POST',
						url: joinUrl(baseUrl, operation === 'inspect' ? '/inspect' : '/metadata'),
						headers,
						body: buffer,
					};
				}

				const response = (await this.helpers.httpRequestWithAuthentication.call(
					this,
					'tamperlensApi',
					options,
				)) as IDataObject | string;

				const json: IDataObject =
					typeof response === 'string' ? (JSON.parse(response) as IDataObject) : response;

				returnData.push({ json, pairedItem: { item: i } });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: error instanceof Error ? error.message : String(error) },
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
