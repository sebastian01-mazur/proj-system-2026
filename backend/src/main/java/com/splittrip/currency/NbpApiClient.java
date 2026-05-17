package com.splittrip.currency;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import java.util.List;


@Component
public class NbpApiClient {

    //Realizuje połączenia HTTP do serwerów NBP w celu pobrania aktualnych tabel kursów średnic
    private final RestTemplate restTemplate;

    public NbpApiClient() {
        this.restTemplate = new RestTemplate();
    }

    public NbpRateResponse getLatestRate(String code) {

        String url =
                "https://api.nbp.pl/api/exchangerates/rates/A/"
                        + code
                        + "/?format=json";
        try {
            return restTemplate.getForObject(
                    url,
                    NbpRateResponse.class
            );
        } catch (HttpClientErrorException exception) {
            throw new CurrencyNotFoundException(
                    "Nie znaleziono waluty: " + code
            );
        }


    }

    public NbpRateResponse getRateByDate(
            String code,
            String date
    ) {

        String url =
                "https://api.nbp.pl/api/exchangerates/rates/A/"
                        + code
                        + "/"
                        + date
                        + "/?format=json";
        try {
            return restTemplate.getForObject(
                    url,
                    NbpRateResponse.class
            );
        } catch (HttpClientErrorException excpetion) {
            throw new CurrencyNotFoundException(
                    "Nie znaleziono kursu dla waluty: " + code + " na dzień " + date
            );
        }
    }
    //Pobranie obsługiwanych walut z API
    public List<Currency> getSupportedCurrencies() {

        String url =
                "https://api.nbp.pl/api/exchangerates/tables/A/?format=json";

        NbpTableResponse[] response =
                restTemplate.getForObject(
                        url,
                        NbpTableResponse[].class
                );

        if (response == null || response.length == 0) {
            return List.of();
        }

        return response[0]
                .getRates()
                .stream()
                .map(rate -> new Currency(
                        rate.getCode(),
                        rate.getCurrency()
                ))
                .toList();
    }
}