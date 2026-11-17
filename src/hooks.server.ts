import { building } from '$app/environment';
import { getLoggkamelConfig } from '#lib/server/loggkamel-config.ts';

if (!building) {
	getLoggkamelConfig();
}
