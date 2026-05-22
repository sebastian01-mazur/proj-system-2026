package com.splittrip.expense;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ExpenseSplitRepository
        extends JpaRepository<ExpenseSplit, ExpenseSplitId> {

    List<ExpenseSplit> findByExpenseId(UUID expenseId);

    List<ExpenseSplit> findByUserId(UUID userId);

    void deleteByExpenseId(UUID expenseId);
}