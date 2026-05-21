package com.splittrip.expense;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class ExpenseSplitId implements Serializable {

    private UUID expenseId;
    private UUID userId;

    public ExpenseSplitId() {
    }

    public ExpenseSplitId(UUID expenseId, UUID userId) {
        this.expenseId = expenseId;
        this.userId = userId;
    }

    public UUID getExpenseId() {
        return expenseId;
    }

    public void setExpenseId(UUID expenseId) {
        this.expenseId = expenseId;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ExpenseSplitId that)) return false;
        return Objects.equals(expenseId, that.expenseId)
                && Objects.equals(userId, that.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(expenseId, userId);
    }
}