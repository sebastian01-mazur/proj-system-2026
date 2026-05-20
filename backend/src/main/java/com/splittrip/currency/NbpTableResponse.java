package com.splittrip.currency;

import java.util.List;

public class NbpTableResponse {

    private List<NbpRate> rates;

    public List<NbpRate> getRates() {
        return rates;
    }

    public void setRates(List<NbpRate> rates) {
        this.rates = rates;
    }
}