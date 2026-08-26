import type { PageLoad} from './$types';
import type { Example } from '$lib/types';

export const load: PageLoad = async () => {
	const response = await fetch('https://jsonplaceholder.typicode.com/users');
	const examples = await response.json();
	const examplesArray: Example[] = Object.values(examples);
	/*console.log('Examples:', examples);*/
	/*console.log('Examples length:', examplesArray.length); */
	return { examplesArray };
};
