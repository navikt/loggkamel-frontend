import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getTokenMock, validateTokenMock, requestAzureOboTokenMock } = vi.hoisted(() => ({
	getTokenMock: vi.fn(),
	validateTokenMock: vi.fn(),
	requestAzureOboTokenMock: vi.fn()
}));

vi.mock('@navikt/oasis', () => ({
	getToken: getTokenMock,
	validateToken: validateTokenMock,
	requestAzureOboToken: requestAzureOboTokenMock
}));

import { getAuthenticatedHeaders } from './authenticated-headers';

describe('getAuthenticatedHeaders', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns the OBO bearer token and JSON headers for a valid request', async () => {
		getTokenMock.mockReturnValue('request-token');
		validateTokenMock.mockResolvedValue({ ok: true });
		requestAzureOboTokenMock.mockResolvedValue({ ok: true, token: 'obo-token' });

		const result = await getAuthenticatedHeaders(new Request('https://example.test'));

		expect(result.ok).toBe(true);
		if (!result.ok) {
			throw new Error('Expected authenticated headers');
		}
		expect(Object.fromEntries(result.headers.entries())).toEqual({
			accept: 'application/json',
			authorization: 'Bearer obo-token',
			'content-type': 'application/json'
		});
		expect(requestAzureOboTokenMock).toHaveBeenCalledWith(
			'request-token',
			'api://dev-gcp.sikkerhetstjenesten.loggkamel/.default'
		);
	});

	it('reports a missing request token without validating or exchanging it', async () => {
		getTokenMock.mockReturnValue(undefined);

		const result = await getAuthenticatedHeaders(new Request('https://example.test'));

		expect(result).toEqual({ ok: false, reason: 'missing-token' });
		expect(validateTokenMock).not.toHaveBeenCalled();
		expect(requestAzureOboTokenMock).not.toHaveBeenCalled();
	});

	it('reports an invalid request token without exchanging it', async () => {
		getTokenMock.mockReturnValue('request-token');
		validateTokenMock.mockResolvedValue({ ok: false });

		const result = await getAuthenticatedHeaders(new Request('https://example.test'));

		expect(result).toEqual({ ok: false, reason: 'invalid-token' });
		expect(requestAzureOboTokenMock).not.toHaveBeenCalled();
	});

	it('reports a failed OBO token request', async () => {
		getTokenMock.mockReturnValue('request-token');
		validateTokenMock.mockResolvedValue({ ok: true });
		requestAzureOboTokenMock.mockResolvedValue({ ok: false });

		const result = await getAuthenticatedHeaders(new Request('https://example.test'));

		expect(result).toEqual({ ok: false, reason: 'obo-token-failed' });
	});
});
