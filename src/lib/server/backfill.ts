export function isValidDatabaseName(value: unknown): value is string {
	return (
		typeof value === 'string' &&
		value.trim().length > 0 &&
		!/[\\/\u0000-\u001f\u007f]/.test(value)
	);
}

export function backfillError(status: number, fallback: string): string {
	switch (status) {
		case 401:
			return 'You must be logged in to manage backfill and cold-storage requests.';
		case 403:
			return 'You do not have permission to manage backfill and cold-storage requests.';
		case 404:
			return 'The requested task was not found. Refresh the page and try again.';
		case 400:
		case 409:
			return 'The task is not in a state that allows this action. Refresh the page and try again.';
		default:
			return fallback;
	}
}
