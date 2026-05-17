package com.splittrip.trip;


import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;

import java.math.BigDecimal;
import java.sql.Types;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "podroze")
public class Trip {
    //obiekt encji "podroze"

    
    //Centralna encja podróży (podroze), przechowująca budżet planowany, ramy czasowe, kraj docelowy, walutę bazową oraz status wyjazdu
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(Types.VARCHAR)
    @Column(name = "id_podrozy")
    private UUID id;


    @JdbcTypeCode(Types.VARCHAR)
    @Column(name = "id_organizatora")
    private UUID organizerId;

    @Column(name = "kraj")
    private String country;

    @Column(name = "data_rozpoczecia")
    private LocalDate startDate;

    @Column(name = "data_zakonczenia")
    private LocalDate endDate;

    @Column(name = "waluta_bazowa", length = 3)
    private String baseCurrency;

    @Column(name = "budzet_planowany", precision = 12, scale = 2)
    private BigDecimal plannedBudget;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private TripStatus status;

    @Column(name = "data_utworzenia")
    private LocalDate createdAt;


    //konstruktory / gettery / settery
    public Trip() {
    }

    public Trip(UUID organizerId, String country, LocalDate startDate, LocalDate endDate,
                String baseCurrency, BigDecimal plannedBudget, TripStatus status, LocalDate createdAt) {
        this.organizerId = organizerId;
        this.country = country;
        this.startDate = startDate;
        this.endDate = endDate;
        this.baseCurrency = baseCurrency;
        this.plannedBudget = plannedBudget;
        this.status = status;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getOrganizerId() {
        return organizerId;
    }

    public void setOrganizerId(UUID organizerId) {
        this.organizerId = organizerId;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public String getBaseCurrency() {
        return baseCurrency;
    }

    public void setBaseCurrency(String baseCurrency) {
        this.baseCurrency = baseCurrency;
    }

    public BigDecimal getPlannedBudget() {
        return plannedBudget;
    }

    public void setPlannedBudget(BigDecimal plannedBudget) {
        this.plannedBudget = plannedBudget;
    }

    public TripStatus getStatus() {
        return status;
    }

    public void setStatus(TripStatus status) {
        this.status = status;
    }

    public LocalDate getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDate createdAt) {
        this.createdAt = createdAt;
    }
}
