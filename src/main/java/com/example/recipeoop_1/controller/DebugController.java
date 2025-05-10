package com.example.recipeoop_1.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DebugController {

    @GetMapping("/api/debug/auth-status")
    public String authStatus() {
        return "JWT authentication is working";
    }

    @GetMapping("/api/debug/public")
    public String publicEndpoint() {
        return "This public endpoint is accessible without authentication";
    }
}