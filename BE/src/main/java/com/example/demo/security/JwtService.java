package com.example.demo.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey chiave;
    private final long durataMs;

    public JwtService(@Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.expiration-ms}") long durataMs) {
        this.chiave = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.durataMs = durataMs;
    }

    /**
     * Genera un token con l'email come subject.
     * Il ruolo non viaggia nel token: il filtro ricarica l'utente dal DB a ogni richiesta,
     * cosi' un cambio di ruolo vale subito.
     */
    public String generaToken(String email) {
        Date adesso = new Date();
        return Jwts.builder()
                .subject(email)
                .issuedAt(adesso)
                .expiration(new Date(adesso.getTime() + durataMs))
                .signWith(chiave)
                .compact();
    }

    public String estraiEmail(String token) {
        return leggiClaims(token).getSubject();
    }

    public boolean tokenValido(String token) {
        try {
            leggiClaims(token);
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    private Claims leggiClaims(String token) {
        return Jwts.parser()
                .verifyWith(chiave)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
