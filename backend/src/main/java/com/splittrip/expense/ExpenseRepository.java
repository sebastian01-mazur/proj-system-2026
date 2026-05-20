package com.splittrip.expense;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ExpenseRepository extends JpaRepository<Expense, UUID> {
    //Interfejs repozytorium dla encji wydatków, umożliwiający operacje CRUD oraz dodatkowe metody wyszukiwania

    List<Expense> findByTripId(UUID tripId);
    List<Expense> findByPayerId(UUID payerId);
    
}
