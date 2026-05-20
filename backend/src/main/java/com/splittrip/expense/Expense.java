package com.splittrip.expense;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;

import java.math.BigDecimal;
import java.sql.Types;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "wydatki")
public class Expense {

    //Główna encja wydatku (wydatki), łącząca kwoty (oryginalną i przeliczoną), datę, opis oraz relacje do podróży, kategorii i płatnika

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(Types.VARCHAR)
    @Column(name = "id_wydatku")
    private UUID id;

    @JdbcTypeCode(Types.VARCHAR)
    @Column(name = "podroze_id_podrozy")
    private UUID tripId;

    @JdbcTypeCode(Types.VARCHAR)
    @Column(name = "id_placacego")
    private UUID payerId;

    @Column(name = "kwota_oryginalna", precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "kod_waluty", length = 3)
    private String currency;

    @Column(name = "kwota_przeliczona", precision = 12, scale = 2)
    private BigDecimal amountInBaseCurrency;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_kategorii")
    private ExpenseCategoryEntity category;

    @Column(name = "opis")
    private String description;

    @Column(name = "data_wydatku")
    private LocalDate expenseDate;

    @Column(name = "data_dodania")
    private LocalDateTime createdAt;

    public Expense() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getTripId() {
        return tripId;
    }

    public void setTripId(UUID tripId) {
        this.tripId = tripId;
    }

    public UUID getPayerId() {
        return payerId;
    }

    public void setPayerId(UUID payerId) {
        this.payerId = payerId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public BigDecimal getAmountInBaseCurrency() {
        return amountInBaseCurrency;
    }

    public void setAmountInBaseCurrency(BigDecimal amountInBaseCurrency) {
        this.amountInBaseCurrency = amountInBaseCurrency;
    }

    public ExpenseCategoryEntity getCategory() {
        return category;
    }

    public void setCategory( ExpenseCategoryEntity category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDate getExpenseDate() {
        return expenseDate;
    }

    public void setExpenseDate(LocalDate expenseDate) {
        this.expenseDate = expenseDate;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}