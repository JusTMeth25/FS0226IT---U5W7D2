package com.example.demo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegistrazioneRequest(
        @NotBlank @Size(max = 100) String nome,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 100, message = "la password deve avere almeno 8 caratteri") String password
) {}
