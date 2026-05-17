package com.splittrip.currency;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
public class CurrencyDataLoader
        implements CommandLineRunner {

    private final CurrencyRepository currencyRepository;
    private final NbpApiClient nbpApiClient;

    public CurrencyDataLoader(
            CurrencyRepository currencyRepository,
            NbpApiClient nbpApiClient
    ) {
        this.currencyRepository = currencyRepository;
        this.nbpApiClient = nbpApiClient;
    }

    @Override
    public void run(String... args) {

        if (currencyRepository.count() > 0) {
            return;
        }

        List<Currency> currencies =
                new java.util.ArrayList<>(
                        nbpApiClient.getSupportedCurrencies()
                );


        currencies.add(
                new Currency(
                        "PLN",
                        "Polski złoty"
                )
        );

        currencyRepository.saveAll(currencies);

        System.out.println(
                "Załadowano waluty z NBP"
        );
    }
}