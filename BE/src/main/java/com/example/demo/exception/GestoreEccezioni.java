package com.example.demo.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GestoreEccezioni {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, Object>> gestisciApiException(ApiException ex) {
        return risposta(ex.getStato(), ex.getMessage());
    }

    /** Lanciata da @PreAuthorize: utente autenticato ma senza il ruolo richiesto. */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> gestisciAccessoNegato(AccessDeniedException ex) {
        return risposta(HttpStatus.FORBIDDEN, "Operazione riservata all'amministratore");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> gestisciValidazione(MethodArgumentNotValidException ex) {
        Map<String, String> campi = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        fe -> fe.getDefaultMessage() == null ? "valore non valido" : fe.getDefaultMessage(),
                        (a, b) -> a));

        Map<String, Object> corpo = corpo(HttpStatus.BAD_REQUEST, "Dati non validi");
        corpo.put("campi", campi);
        return ResponseEntity.badRequest().body(corpo);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<Map<String, Object>> gestisciRichiestaMalformata(Exception ex) {
        return risposta(HttpStatus.BAD_REQUEST, "Richiesta non valida");
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, Object>> gestisciRisorsaInesistente(NoResourceFoundException ex) {
        return risposta(HttpStatus.NOT_FOUND, "Risorsa non trovata");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> gestisciGenerica(Exception ex) {
        return risposta(HttpStatus.INTERNAL_SERVER_ERROR, "Errore interno del server");
    }

    private ResponseEntity<Map<String, Object>> risposta(HttpStatus stato, String messaggio) {
        return ResponseEntity.status(stato).body(corpo(stato, messaggio));
    }

    private Map<String, Object> corpo(HttpStatus stato, String messaggio) {
        Map<String, Object> corpo = new LinkedHashMap<>();
        corpo.put("timestamp", LocalDateTime.now());
        corpo.put("status", stato.value());
        corpo.put("error", stato.getReasonPhrase());
        corpo.put("messaggio", messaggio);
        return corpo;
    }
}
