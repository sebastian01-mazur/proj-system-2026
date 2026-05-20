package com.splittrip.currency;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface CurrencyRateRepository
        extends JpaRepository<CurrencyRate, Long> {

    Optional<CurrencyRate> findByCurrencyCodeAndRateDate(
            String currencyCode,
            LocalDate rateDate
    );
}