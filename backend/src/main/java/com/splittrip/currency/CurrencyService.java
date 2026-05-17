package com.splittrip.currency;

import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.Optional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class CurrencyService {

    //Odpowiada za pobieranie kursów z API NBP, ich buforowanie w bazie danych oraz przeliczanie kwot na walutę bazową podróż

    private final NbpApiClient nbpApiClient;
    private final CurrencyRateRepository currencyRateRepository;
    private final CurrencyRepository currencyRepository;

    public CurrencyService(
            NbpApiClient nbpApiClient,
            CurrencyRateRepository currencyRateRepository,
            CurrencyRepository currencyRepository)
            {
                this.nbpApiClient = nbpApiClient;
                this.currencyRateRepository = currencyRateRepository;
                this.currencyRepository = currencyRepository;
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
    //sprawdzenie cache i zwrócenie z bazy lub pobiera z API i zapisuje w bazie
    public CurrencyRateResponse getHistoricalRate(
            String code,
            LocalDate date
    ) {

        Optional<CurrencyRate> existingRate =
                currencyRateRepository
                        .findByCurrencyCodeAndRateDate(code, date);

        if (existingRate.isPresent()) {

            CurrencyRate cachedRate = existingRate.get();

            return new CurrencyRateResponse(
                    cachedRate.getCurrencyName(),
                    cachedRate.getCurrencyCode(),
                    cachedRate.getRate()
            );
        }

        NbpRateResponse response =
                nbpApiClient.getRateByDate(
                        code,
                        date.toString()
                );

        NbpRate rate =
                response.getRates().get(0);

        CurrencyRate currencyRate =
                new CurrencyRate(
                        response.getCode(),
                        response.getCurrency(),
                        rate.getMid(),
                        date
                );

        currencyRateRepository.save(currencyRate);

        return new CurrencyRateResponse(
                response.getCurrency(),
                response.getCode(),
                rate.getMid()
        );
    }
    // Przelicza kwotę między walutami według kursu historycznego
    public CurrencyConversionResponse convertCurrency(
            String from,
            String to,
            BigDecimal amount,
            LocalDate date
    ) {

        if (from.equalsIgnoreCase(to)) {

            return new CurrencyConversionResponse(
                    from,
                    to,
                    amount,
                    amount,
                    BigDecimal.ONE
            );
        }

        BigDecimal fromRate = getRateToPln(from, date);

        BigDecimal toRate = getRateToPln(to, date);

        BigDecimal conversionRate =
                fromRate.divide(
                        toRate,
                        4,
                        RoundingMode.HALF_UP
                );

        BigDecimal convertedAmount =
                amount.multiply(conversionRate)
                        .setScale(2, RoundingMode.HALF_UP);

        return new CurrencyConversionResponse(
                from,
                to,
                amount,
                convertedAmount,
                conversionRate
        );
    }
    //Zwraca kurs waluty względem PLN
    private BigDecimal getRateToPln(
            String code,
            LocalDate date
    ) {

        if (code.equalsIgnoreCase("PLN")) {
            return BigDecimal.ONE;
        }

        CurrencyRateResponse response =
                getPreviousWorkingRate(code, date);

        return response.getRate();
    }
    //lista obsługiwanych walut
    public List<Currency> getSupportedCurrencies() {

        return currencyRepository.findAll();
    }
    //Pobiera kurs z ostatniego dostępnego dnia roboczego
    private CurrencyRateResponse getPreviousWorkingRate(
            String code,
            LocalDate date
    ) {

        LocalDate currentDate = date;

        //Maksymalnie 7 prób cofania daty
        for (int i = 0; i < 7; i++) {

            try {

                return getHistoricalRate(
                        code,
                        currentDate
                );

            } catch (RuntimeException exception) {

                //Cofnięcie o dzień
                currentDate = currentDate.minusDays(1);
            }
        }

        throw new CurrencyNotFoundException(
                "Nie znaleziono kursu waluty: "
                        + code
                        + " dla daty: "
                        + date
        );
    }
}
