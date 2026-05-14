package com.splittrip.currency;

import java.math.BigDecimal;

public class CurrencyRateResponse {

    private String currency;
    private String code;
    private BigDecimal rate;

    public CurrencyRateResponse() {
    }

    public CurrencyRateResponse(String currency, String code, BigDecimal rate) {
        this.currency = currency;
        this.code = code;
        this.rate = rate;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public BigDecimal getRate() {
        return rate;
    }

    public void setRate(BigDecimal rate) {
        this.rate = rate;
    }
}