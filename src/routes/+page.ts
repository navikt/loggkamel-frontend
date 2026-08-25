export const load = async ({ fetch }) => {
	try {
		const response = await fetch(
			'https://api.coinlore.com/api/tickers/' //
		);
		console.log('Response status:', response.status);
		if (!response.ok) {
			throw new Error(`HTTP error: ${response.status}`);
		}
		const currencies = await response.json();
		const currenciesArray = Object.values(currencies);
		console.log('Currencies:', currencies);
		console.log('Currencies length:', currencies.length);

		return { currencies };
	} catch (error) {
		console.error(error);
		return { error: 'Unable to fetch data' };
	}
};
