package com.splittrip.currency;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;


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
}