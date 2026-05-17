package com.splittrip.currency;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "currencies")
public class Currency {
    //Model mapujący tabelę walut (waluty), zawierający trzyliterowy kod waluty (ISO 4217) oraz jej pełną nazwę
    @Id
    @Column(length = 3, nullable = false)
    private String code;

    @Column(nullable = false)
    private String name;

    public Currency() {
    }

    public Currency(
            String code,
            String name
    ) {
        this.code = code;
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }
}
