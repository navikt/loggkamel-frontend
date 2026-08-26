import type { PageLoad} from './$types';
import type { Example } from '$lib/types';

export const load: PageLoad = async () => {
	const response = await fetch('https://jsonplaceholder.typicode.com/users');
	const examplesArray: Example[] = await response.json();
	return { examplesArray };
};
