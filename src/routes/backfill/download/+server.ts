import type { RequestHandler } from './$types';
import { authErrors, getAuthenticatedHeaders } from '$lib/server/authenticated-headers';
import { backfillError, isValidDatabaseName } from '$lib/server/backfill';
import { getLoggkamelConfig } from '$lib/server/loggkamel-config';

const DOWNLOAD_ERROR = 'Could not download the DB2 cold-storage export. Please try again later.';

function downloadError(status: number, message: string): Response {
	return new Response(message, {
		status,
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'no-store',
			'X-Content-Type-Options': 'nosniff'
		}
	});
}

export const GET: RequestHandler = async ({ fetch, request, url }) => {
	const dbname = url.searchParams.get('dbname');
	if (!isValidDatabaseName(dbname)) {
		return downloadError(400, 'A valid database name is required.');
	}

	const auth = await getAuthenticatedHeaders(request);
	if (!auth.ok) {
		return downloadError(auth.reason === 'obo-token-failed' ? 502 : 401, authErrors[auth.reason]);
	}

	const headers = auth.headers;
	headers.set('Accept', 'application/zip');
	headers.delete('Content-Type');

	let response: Response;
	try {
		response = await fetch(
			`${getLoggkamelConfig().apiUrl}/auditlogg-backfills/db2/${encodeURIComponent(dbname)}`,
			{
				headers,
				cache: 'no-store',
				redirect: 'error',
				signal: request.signal
			}
		);
	} catch (error) {
		if (error instanceof TypeError) {
			return downloadError(502, DOWNLOAD_ERROR);
		}
		throw error;
	}

	if (!response.ok) {
		await response.body?.cancel().catch(() => {});
		return downloadError(
			response.status >= 400 && response.status < 500 ? response.status : 502,
			backfillError(response.status, DOWNLOAD_ERROR)
		);
	}
	if (!response.body) {
		return downloadError(502, DOWNLOAD_ERROR);
	}

	return new Response(response.body, {
		headers: {
			'Content-Type': 'application/zip',
			'Content-Disposition':
				response.headers.get('Content-Disposition') ??
				`attachment; filename*=UTF-8''${encodeURIComponent(dbname)}-cold-storage.zip`,
			'Cache-Control': 'no-store',
			'X-Content-Type-Options': 'nosniff'
		}
	});
};
