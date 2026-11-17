import { building } from '$app/env';
import { getLoggkamelConfig } from '#lib/server/loggkamel-config.ts';

if (!building) {
	getLoggkamelConfig();
}
