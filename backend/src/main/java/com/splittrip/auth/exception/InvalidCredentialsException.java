package com.splittrip.auth.exception;

public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException() {
        super("Nieprawidłowy email lub hasło");
    }
}