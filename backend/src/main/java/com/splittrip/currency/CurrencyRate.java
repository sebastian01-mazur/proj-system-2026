package com.splittrip.currency;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "currency_rates")
public class CurrencyRate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String currencyCode;

    private String currencyName;

    private BigDecimal rate;

    private LocalDate rateDate;

    public CurrencyRate() {
    }

    public CurrencyRate(
            String currencyCode,
            String currencyName,
            BigDecimal rate,
            LocalDate rateDate
    ) {
        this.currencyCode = currencyCode;
        this.currencyName = currencyName;
        this.rate = rate;
        this.rateDate = rateDate;
    }

    public Long getId() {
        return id;
    }

    public String getCurrencyCode() {
        return currencyCode;
    }

    public void setCurrencyCode(String currencyCode) {
        this.currencyCode = currencyCode;
    }

    public String getCurrencyName() {
        return currencyName;
    }

    public void setCurrencyName(String currencyName) {
        this.currencyName = currencyName;
    }

    public BigDecimal getRate() {
        return rate;
    }

    public void setRate(BigDecimal rate) {
        this.rate = rate;
    }

    public LocalDate getRateDate() {
        return rateDate;
    }

    public void setRateDate(LocalDate rateDate) {
        this.rateDate = rateDate;
    }
}