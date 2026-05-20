package com.splittrip.currency;

import java.util.List;

public class NbpRateResponse {

    private String currency;
    private String code;
    private List<NbpRate> rates;

    public NbpRateResponse() {
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

    public List<NbpRate> getRates() {
        return rates;
    }

    public void setRates(List<NbpRate> rates) {
        this.rates = rates;
    }
}