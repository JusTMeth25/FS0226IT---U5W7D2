package com.example.demo.dto;

import jakarta.validation.constraints.NotNull;

public record PreferitoRequest(@NotNull Long discoId) {}
