import { getToken, requestAzureOboToken, validateToken } from '@navikt/oasis';

const LOGGKAMEL_OBO_AUDIENCE = 'api://dev-gcp.sikkerhetstjenesten.loggkamel/.default';

type AuthenticatedHeadersResult =
	| { ok: true; headers: Headers }
	| { ok: false; reason: 'missing-token' | 'invalid-token' | 'obo-token-failed' };

export const authErrors = {
	'missing-token': 'Du må være logget inn for å fortsette.',
	'invalid-token': 'Innloggingen din er ikke gyldig. Last inn siden på nytt.',
	'obo-token-failed': 'Kunne ikke hente et tilgangstoken. Prøv igjen senere.'
} as const;

export async function getAuthenticatedHeaders(
	request: Request
): Promise<AuthenticatedHeadersResult> {
	const token = getToken(request);
	if (!token) {
		return { ok: false, reason: 'missing-token' };
	}

	const validation = await validateToken(token);
	if (!validation.ok) {
		return { ok: false, reason: 'invalid-token' };
	}

	const oboResult = await requestAzureOboToken(token, LOGGKAMEL_OBO_AUDIENCE);
	if (!oboResult.ok) {
		return { ok: false, reason: 'obo-token-failed' };
	}

	return {
		ok: true,
		headers: new Headers({
			Authorization: `Bearer ${oboResult.token}`,
			Accept: 'application/json',
			'Content-Type': 'application/json'
		})
	};
}
