package com.splittrip.expense;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ExpenseCategoryRepository
        extends JpaRepository<ExpenseCategoryEntity, UUID> {
}