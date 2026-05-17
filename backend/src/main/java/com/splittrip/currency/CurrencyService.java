package com.splittrip.currency;

import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.Optional;

@Service
public class CurrencyService {

    //Odpowiada za pobieranie kursów z API NBP, ich buforowanie w bazie danych oraz przeliczanie kwot na walutę bazową podróż

    private final NbpApiClient nbpApiClient;
    private final CurrencyRateRepository currencyRateRepository;

    public CurrencyService(
            NbpApiClient nbpApiClient,
            CurrencyRateRepository currencyRateRepository)
            {
                this.nbpApiClient = nbpApiClient;
                this.currencyRateRepository = currencyRateRepository;
            }

    public CurrencyRateResponse getLatestRate(String code) {

            LocalDate today = LocalDate.now();

            Optional<CurrencyRate> existingRate=
                    currencyRateRepository.findByCurrencyCodeAndRateDate(code, today);
            if (existingRate.isPresent()) {
                CurrencyRate cachedRate = existingRate.get();

                return new CurrencyRateResponse(
                        cachedRate.getCurrencyName(),
                        cachedRate.getCurrencyCode(),
                        cachedRate.getRate()
                );
            }

        NbpRateResponse response =
                nbpApiClient.getLatestRate(code);

        NbpRate rate =
                response.getRates().get(0);

        CurrencyRate currencyRate = new CurrencyRate(response.getCode(), response.getCurrency(), rate.getMid(), today);
        currencyRateRepository.save(currencyRate);

        return new CurrencyRateResponse(
                response.getCurrency(),
                response.getCode(),
                rate.getMid()
        );
    }
}
