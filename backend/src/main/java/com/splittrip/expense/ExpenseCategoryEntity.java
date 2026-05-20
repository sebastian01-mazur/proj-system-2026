package com.splittrip.expense;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;

import java.sql.Types;
import java.util.UUID;

@Entity
@Table(name = "kategorie_wydatkow")
public class ExpenseCategoryEntity {

    @Id
    @JdbcTypeCode(Types.VARCHAR)
    @Column(name = "id_kategorii")
    private UUID id;

    @Column(name = "nazwa")
    private String name;

    public ExpenseCategoryEntity() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}