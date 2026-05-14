package com.splittrip.currency;

import org.springframework.stereotype.Service;

@Service
public class CurrencyService {

    //Odpowiada za pobieranie kursów z API NBP, ich buforowanie w bazie danych oraz przeliczanie kwot na walutę bazową podróż

    private final NbpApiClient nbpApiClient;

    public CurrencyService(NbpApiClient nbpApiClient) {
        this.nbpApiClient = nbpApiClient;
    }

    public CurrencyRateResponse getLatestRate(String code) {

        NbpRateResponse response =
                nbpApiClient.getLatestRate(code);

        NbpRate rate =
                response.getRates().get(0);

        return new CurrencyRateResponse(
                response.getCurrency(),
                response.getCode(),
                rate.getMid()
        );
    }
}
