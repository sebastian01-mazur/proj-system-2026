package com.splittrip.currency;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/currencies")
public class CurrencyController {

    //Zwraca listę obsługiwanych walut oraz historyczne dane kursowe pobrane z lokalnego cache lub API

    private final CurrencyService currencyService;

    public CurrencyController(CurrencyService currencyService) {
        this.currencyService = currencyService;
    }

    @GetMapping("/latest/{code}")
    public CurrencyRateResponse getLatestRate(
            @PathVariable String code
    ) {

        return currencyService.getLatestRate(code);
    }
    @GetMapping("/history/{code}")
    public CurrencyRateResponse getHistoricalRate(
            @PathVariable String code,
            @RequestParam LocalDate date
    ) {

        return currencyService.getHistoricalRate(
                code,
                date
        );
    }
    @GetMapping("/convert")
    public CurrencyConversionResponse convertCurrency(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam BigDecimal amount,
            @RequestParam LocalDate date
    ) {

        return currencyService.convertCurrency(
                from,
                to,
                amount,
                date
        );
    }
    //lista obsługiwanych walut
    @GetMapping
    public List<Currency> getCurrencies() {

        return currencyService.getSupportedCurrencies();
    }
}
