//
package com.splittrip.currency;

import java.math.BigDecimal;

public class CurrencyConversionResponse {

    private String fromCurrency;
    private String toCurrency;

    private BigDecimal originalAmount;
    private BigDecimal convertedAmount;

    private BigDecimal rate;

    public CurrencyConversionResponse(
            String fromCurrency,
            String toCurrency,
            BigDecimal originalAmount,
            BigDecimal convertedAmount,
            BigDecimal rate
    ) {
        this.fromCurrency = fromCurrency;
        this.toCurrency = toCurrency;
        this.originalAmount = originalAmount;
        this.convertedAmount = convertedAmount;
        this.rate = rate;
    }

    public String getFromCurrency() {
        return fromCurrency;
    }

    public String getToCurrency() {
        return toCurrency;
    }

    public BigDecimal getOriginalAmount() {
        return originalAmount;
    }

    public BigDecimal getConvertedAmount() {
        return convertedAmount;
    }

    public BigDecimal getRate() {
        return rate;
    }
}