import type { PageLoad} from './$types';

interface Currency {
	id: string;
	symbol: string;
	name: string;
	nameid: string;
	rank: number;
	price_usd: string;
	percent_change_24h: string;
	percent_change_1h: string;
	percent_change_7d: string;
	price_btc: string;
	market_cap_usd: string;
	volume24: number;
	volume24a: number;
	csupply: string;
	tsupply: string;
	msupply: string;
}

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
