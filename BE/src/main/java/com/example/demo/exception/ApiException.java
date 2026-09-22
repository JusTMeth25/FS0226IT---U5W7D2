package com.example.demo.exception;

import org.springframework.http.HttpStatus;

/** Errore di business con lo stato HTTP da restituire al client. */
public class ApiException extends RuntimeException {

    private final HttpStatus stato;

    public ApiException(HttpStatus stato, String messaggio) {
        super(messaggio);
        this.stato = stato;
    }

    public HttpStatus getStato() {
        return stato;
    }

    public static ApiException nonTrovato(String messaggio) {
        return new ApiException(HttpStatus.NOT_FOUND, messaggio);
    }

    public static ApiException conflitto(String messaggio) {
        return new ApiException(HttpStatus.CONFLICT, messaggio);
    }

    public static ApiException nonAutorizzato(String messaggio) {
        return new ApiException(HttpStatus.UNAUTHORIZED, messaggio);
    }
}
