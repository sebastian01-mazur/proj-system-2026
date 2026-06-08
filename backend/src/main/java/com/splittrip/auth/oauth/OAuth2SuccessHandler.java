package com.splittrip.auth.oauth;

import com.splittrip.auth.User;
import com.splittrip.auth.repository.UserRepository;
import com.splittrip.auth.security.JwtService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtService jwtService;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException, ServletException {

        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();

        String email = oauthUser.getAttribute("email");
        String name = oauthUser.getAttribute("name");
        String providerId = oauthUser.getName();
        String provider =
                authentication.getAuthorities()
                        .stream()
                        .findFirst()
                        .map(a -> a.getAuthority())
                        .orElse("google");

        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {

                    String[] parts = name != null
                            ? name.trim().split("\\s+", 2)
                            : new String[0];

                    String firstName = parts.length > 0 ? parts[0] : "OAuth";
                    String lastName = parts.length > 1 ? parts[1] : "User";

                    User newUser = User.builder()
                            .email(email)
                            .firstName(firstName)
                            .lastName(lastName)
                            .provider(provider)
                            .providerId(providerId)
                            .build();

                    return userRepository.save(newUser);
                });

        String token = jwtService.generateToken(user.getEmail());

        response.sendRedirect(
                "http://localhost?token=" + token
        );
    }
}