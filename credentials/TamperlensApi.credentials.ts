import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class TamperlensApi implements ICredentialType {
	name = 'tamperlensApi';

	displayName = 'Tamperlens API';

	documentationUrl = 'https://tamperlens.com/api';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description:
				'Your Tamperlens API key (starts with tl_). Get a free one at https://tamperlens.com/account — 50 documents a month, no card.',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://tamperlens.com/api/v1',
			description: 'Leave as the default unless Tamperlens tells you otherwise',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	// POST /receipt/verify is keyed but unmetered: a wrong key answers 401 and a
	// valid key answers 200 without spending a document from the monthly quota.
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/receipt/verify',
			method: 'POST',
			body: { report: {}, receipt: {} },
		},
	};
}
