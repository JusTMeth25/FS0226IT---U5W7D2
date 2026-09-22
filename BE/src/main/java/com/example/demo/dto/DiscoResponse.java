package com.example.demo.dto;

/** Tipo comune alle due viste del disco: il server sceglie quale restituire in base al ruolo. */
public sealed interface DiscoResponse permits DiscoPubblicoResponse, DiscoAdminResponse {
}
