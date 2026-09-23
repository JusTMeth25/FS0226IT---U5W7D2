package com.example.demo.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Chi apre l'URL del backend nel browser finisce sul sito pubblico su GitHub Pages.
 * Redirect 302 (temporaneo): il browser non lo memorizza, la destinazione si puo' cambiare.
 */
@Controller
public class HomeController {

    @GetMapping("/")
    public String home() {
        return "redirect:https://justmeth25.github.io/FS0226IT---U5W7D2/";
    }
}
