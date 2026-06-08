package com.splittrip.auth;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "uzytkownicy")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    //Reprezentuje encję bazodanową użytkownika (tabela uzytkownicy), przechowując dane uwierzytelniające, identyfikator OAuth oraz profil

    @Id
    @Column(name = "id_uzytkownika", length = 36)
    private String id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "imie", nullable = false)
    private String firstName;

    @Column(name = "nazwisko", nullable = false)
    private String lastName;

    @Column(name = "haslo_hash")
    private String password;

    @Column(name = "dostawca_oauth")
    private String provider;

    @Column(name = "oauth_id")
    private String providerId;

    @Column(name = "data_utworzenia", nullable = false)
    private LocalDate createdAt;

    @PrePersist
    public void prePersist() {

        if (id == null) {
            id = UUID.randomUUID().toString();
        }

        if (createdAt == null) {
            createdAt = LocalDate.now();
        }
    }
}
