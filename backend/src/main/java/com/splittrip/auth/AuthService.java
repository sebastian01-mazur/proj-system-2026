package com.splittrip.auth;

import com.splittrip.auth.dto.AuthResponse;
import com.splittrip.auth.dto.LoginRequest;
import com.splittrip.auth.dto.RegisterRequest;
import com.splittrip.auth.repository.UserRepository;
import com.splittrip.auth.security.JwtService;
import com.splittrip.auth.exception.InvalidCredentialsException;
import com.splittrip.auth.exception.UserAlreadyExistsException;
import com.splittrip.auth.exception.WeakPasswordException;

import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    //Realizuje logikę walidacji danych, haszowania haseł, generowania tokenów JWT oraz weryfikacji tożsamości przez dostawców zewnętrznych.

    private static final Pattern PASSWORD_PATTERN =
            Pattern.compile("^(?=.*[A-Z])(?=.*\\d).{8,}$");
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthResponse register(RegisterRequest request) {

        validatePassword(request.getPassword());

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new UserAlreadyExistsException(request.getEmail());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .provider("local")
                .build();

        userRepository.save(user);

        String token = jwtService.generateToken(user.getEmail());

        return new AuthResponse(token);
    }

    public AuthResponse login(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(InvalidCredentialsException::new);

        if (user.getPassword() == null) {
            throw new InvalidCredentialsException();
        }

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword()
        )) {
            throw new InvalidCredentialsException();
        }

        String token = jwtService.generateToken(user.getEmail());

        return new AuthResponse(token);
    }
    private void validatePassword(String password) {

        if (!PASSWORD_PATTERN.matcher(password).matches()) {
            throw new WeakPasswordException();
        }
    }
}
