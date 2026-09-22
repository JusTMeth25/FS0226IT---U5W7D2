package com.example.demo.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record DiscoRequest(
        @NotBlank @Size(max = 255) String titolo,
        @NotBlank @Size(max = 255) String artista,
        @Size(max = 100) String genere,
        @Min(1900) @Max(2100) Integer anno,
        @Size(max = 2000) String descrizione,
        @Size(max = 500) String copertinaUrl,
        @NotNull @DecimalMin("0.00") BigDecimal prezzoVendita,
        @Size(max = 500) @Pattern(regexp = "^https://.*", message = "deve essere un indirizzo https") String anteprimaUrl,
        @Size(max = 255) String anteprimaBrano,
        @Size(max = 500) @Pattern(regexp = "^https://.*", message = "deve essere un indirizzo https") String anteprimaLink,
        @DecimalMin("0.00") BigDecimal prezzoAcquisto,
        @Size(max = 255) String fornitore,
        Boolean pubblicato
) {}
