interface ExchangeRateResponse {
  success: boolean;
  rates: Record<string, number>;
  base: string;
  date: string;
}

interface CurrencyConversion {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  convertedAmount: number;
  rate: number;
  timestamp: Date;
}

export class CurrencyService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.exchangerate-api.com/v4/latest';
  private readonly fallbackRates: Record<string, number> = {
    USD: 1,
    EUR: 0.85,
    GBP: 0.73,
    INR: 74.5,
    CAD: 1.25,
    AUD: 1.35,
    JPY: 110.0,
    CNY: 6.45,
    BRL: 5.25,
    MXN: 20.0
  };

  constructor() {
    this.apiKey = process.env.EXCHANGE_RATE_API_KEY || '';
  }

  private async fetchExchangeRates(baseCurrency: string = 'USD'): Promise<Record<string, number>> {
    if (!this.apiKey) {
      console.warn('Exchange Rate API key not found, using fallback rates');
      return this.fallbackRates;
    }

    try {
      const url = `${this.baseUrl}/${baseCurrency}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Exchange Rate API error: ${response.status}`);
      }

      const data: ExchangeRateResponse = await response.json();
      
      if (!data.success) {
        throw new Error('Exchange Rate API returned unsuccessful response');
      }

      return data.rates;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      console.log('Using fallback rates');
      return this.fallbackRates;
    }
  }

  public async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<CurrencyConversion> {
    if (fromCurrency === toCurrency) {
      return {
        fromCurrency,
        toCurrency,
        amount,
        convertedAmount: amount,
        rate: 1,
        timestamp: new Date()
      };
    }

    const rates = await this.fetchExchangeRates(fromCurrency);
    const rate = rates[toCurrency] || this.fallbackRates[toCurrency] || 1;
    const convertedAmount = amount * rate;

    return {
      fromCurrency,
      toCurrency,
      amount,
      convertedAmount: Number(convertedAmount.toFixed(2)),
      rate: Number(rate.toFixed(4)),
      timestamp: new Date()
    };
  }

  public async convertBudgetToUSD(budget: number, currency: string): Promise<number> {
    if (currency === 'USD') {
      return budget;
    }

    const conversion = await this.convertCurrency(budget, currency, 'USD');
    return conversion.convertedAmount;
  }

  public async convertUSDToLocal(usdAmount: number, currency: string): Promise<number> {
    if (currency === 'USD') {
      return usdAmount;
    }

    const conversion = await this.convertCurrency(usdAmount, 'USD', currency);
    return conversion.convertedAmount;
  }

  public getSupportedCurrencies(): string[] {
    return Object.keys(this.fallbackRates);
  }

  public formatCurrency(amount: number, currency: string): string {
    const formatters: Record<string, Intl.NumberFormat> = {
      USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
      EUR: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
      GBP: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }),
      INR: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }),
      CAD: new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }),
      AUD: new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }),
      JPY: new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }),
      CNY: new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }),
      BRL: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
      MXN: new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
    };

    const formatter = formatters[currency] || formatters.USD;
    return formatter.format(amount);
  }
}

export const currencyService = new CurrencyService(); 