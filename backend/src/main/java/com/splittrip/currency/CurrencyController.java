package com.splittrip.currency;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/currency")
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
}
