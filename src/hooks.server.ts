import { building } from '$app/environment';
import { getLoggkamelConfig } from '$lib/server/loggkamel-config';

if (!building) {
	getLoggkamelConfig();
}
