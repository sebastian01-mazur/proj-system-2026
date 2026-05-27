package com.splittrip.auth;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    //Reprezentuje encję bazodanową użytkownika (tabela uzytkownicy), przechowując dane uwierzytelniające, identyfikator OAuth oraz profil

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String name;

    private String password;

    private String provider;

    @Column(name = "provider_id")
    private String providerId;

}
