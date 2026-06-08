package com.splittrip.auth.exception;

public class UserAlreadyExistsException extends RuntimeException {

    public UserAlreadyExistsException(String email) {
        super("Użytkownik z adresem email " + email + " już istnieje");
    }
}