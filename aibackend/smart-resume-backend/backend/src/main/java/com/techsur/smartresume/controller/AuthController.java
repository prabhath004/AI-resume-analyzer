package com.techsur.smartresume.controller;

import com.techsur.smartresume.model.User;
import com.techsur.smartresume.payload.AuthResponse;
import com.techsur.smartresume.payload.LoginRequest;
import com.techsur.smartresume.payload.SignupRequest;
import com.techsur.smartresume.service.AuthService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;

import java.util.stream.Collectors;

@RestController
@RequestMapping(value = "/api/auth", produces = MediaType.APPLICATION_JSON_VALUE)
public class AuthController {
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(
            @Valid @RequestBody SignupRequest request,
            BindingResult bindingResult) {

        logger.debug("Signup request received: {}", request);

        if (bindingResult.hasErrors()) {
            String errors = bindingResult.getAllErrors()
                .stream()
                .map(error -> (error instanceof FieldError)
                    ? ((FieldError) error).getField() + ": " + error.getDefaultMessage()
                    : error.getDefaultMessage())
                .collect(Collectors.joining(", "));

            logger.error("Validation errors in signup request: {}", errors);
            return ResponseEntity.badRequest().body(AuthResponse.builder()
                .success(false)
                .message(errors)
                .build());
        }

        try {
            AuthResponse response = authService.signup(request);
            logger.info("User signed up successfully: {}", request.getEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error during signup: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(AuthResponse.builder()
                .success(false)
                .message(e.getMessage())
                .build());
        }
    }

    @PostMapping("/signin")
    public ResponseEntity<AuthResponse> signin(
            @Valid @RequestBody LoginRequest request,
            BindingResult bindingResult) {

        logger.debug("Signin request received: {}", request);

        if (bindingResult.hasErrors()) {
            String errors = bindingResult.getAllErrors()
                .stream()
                .map(error -> (error instanceof FieldError)
                    ? ((FieldError) error).getField() + ": " + error.getDefaultMessage()
                    : error.getDefaultMessage())
                .collect(Collectors.joining(", "));

            logger.error("Validation errors in signin request: {}", errors);
            return ResponseEntity.badRequest().body(AuthResponse.builder()
                .success(false)
                .message(errors)
                .build());
        }

        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            logger.error("Password is required");
            return ResponseEntity.badRequest().body(AuthResponse.builder()
                .success(false)
                .message("Password is required")
                .build());
        }

        try {
            AuthResponse response = authService.signin(request);
            logger.info("User signed in successfully: {}", request.getEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error during signin: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(AuthResponse.builder()
                .success(false)
                .message("Invalid email or password")
                .build());
        }
    }

    @PostMapping("/signout")
    public ResponseEntity<?> signout() {
        authService.signout();
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser() {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(user);
    }
}
