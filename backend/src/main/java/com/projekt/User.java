package com.projekt;

import jakarta.persistence.*;

@Entity
@Table(name = "test_users") // Tak nazwiemy tabelę w bazie
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String email;

    // Standardowe gettery i settery (Spring ich potrzebuje)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}