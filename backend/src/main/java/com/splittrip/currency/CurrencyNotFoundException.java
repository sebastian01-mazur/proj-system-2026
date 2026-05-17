// obsługa błędu nieznalezionych walut
package com.splittrip.currency;

public class CurrencyNotFoundException
        extends RuntimeException {

    public CurrencyNotFoundException(String message) {
        super(message);
    }
}