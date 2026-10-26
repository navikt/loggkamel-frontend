import { describe, expect, it } from 'vitest';
import { backfillError, isValidDatabaseName } from './backfill';

describe('database name validation', () => {
	it.each(['audit-db', 'audit_db', 'db.name', 'ø database ?#%', ' spaced '])(
		'accepts the database name %j without normalizing it',
		(name) => {
			expect(isValidDatabaseName(name)).toBe(true);
		}
	);

	it.each([
		null,
		undefined,
		42,
		{},
		new File(['audit-db'], 'database.txt'),
		'',
		' \t\n',
		'db/name',
		'db\\name',
		...Array.from({ length: 32 }, (_, code) => `db${String.fromCharCode(code)}name`),
		'db\u007fname'
	])('rejects an invalid database name %j', (name) => {
		expect(isValidDatabaseName(name)).toBe(false);
	});
});

describe('backfill error messages', () => {
	it.each([
		[401, 'You must be logged in to manage backfill and cold-storage requests.'],
		[403, 'You do not have permission to manage backfill and cold-storage requests.'],
		[404, 'The requested task was not found. Refresh the page and try again.'],
		[400, 'The task is not in a state that allows this action. Refresh the page and try again.'],
		[409, 'The task is not in a state that allows this action. Refresh the page and try again.']
	])('maps HTTP %s to an actionable message', (status, message) => {
		expect(backfillError(status, 'fallback')).toBe(message);
	});

	it.each([200, 302, 422, 429, 500, 502, 503])(
		'uses the caller-specific fallback for HTTP %s',
		(status) => {
			expect(backfillError(status, 'operation failed')).toBe('operation failed');
		}
	);
});
