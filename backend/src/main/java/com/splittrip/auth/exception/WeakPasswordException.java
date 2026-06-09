package com.splittrip.auth.exception;

public class WeakPasswordException extends RuntimeException {

    public WeakPasswordException() {
        super(
                "Hasło musi zawierać minimum 8 znaków, jedną wielką literę oraz jedną cyfrę"
        );
    }
}