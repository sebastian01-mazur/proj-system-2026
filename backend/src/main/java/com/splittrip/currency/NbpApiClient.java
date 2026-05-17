package com.splittrip.currency;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;


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

        return restTemplate.getForObject(
                url,
                NbpRateResponse.class
        );
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

        return restTemplate.getForObject(
                url,
                NbpRateResponse.class
        );
    }
}