import { json } from '@sveltejs/kit';

export function GET() {
	return new Response('OK', {
		status: 200,
		headers: {
			'Content-Type': 'text/plain'
		}
	});
	/*return json({ status: 'ok' });*/
}
