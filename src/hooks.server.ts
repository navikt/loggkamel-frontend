import { building } from '$app/environment';
import { getLoggkamelConfig } from '$lib/server/loggkamel-config';
import type { Handle } from '@sveltejs/kit';

if (!building) {
	getLoggkamelConfig();
}

export const handle: Handle = ({ event, resolve }) => resolve(event);
