package com.splittrip.expense;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;

import java.math.BigDecimal;
import java.sql.Types;
import java.util.UUID;


@Entity
@Table(name = "podzial_wydatku")
@IdClass(ExpenseSplitId.class)
public class ExpenseSplit {

    @Id
    @JdbcTypeCode(Types.VARCHAR)
    @Column(name = "id_wydatku")
    private UUID expenseId;

    @Id
    @JdbcTypeCode(Types.VARCHAR)
    @Column(name = "id_uzytkownika")
    private UUID userId;

    @Column(name = "procent_udzialu", precision = 5, scale = 2)
    private BigDecimal percentageShare;

    @Column(name = "kwota_udzialu", precision = 12, scale = 2)
    private BigDecimal shareAmount;

    public ExpenseSplit() {
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

    public BigDecimal getPercentageShare() {
        return percentageShare;
    }

    public void setPercentageShare(BigDecimal percentageShare) {
        this.percentageShare = percentageShare;
    }

    public BigDecimal getShareAmount() {
        return shareAmount;
    }

    public void setShareAmount(BigDecimal shareAmount) {
        this.shareAmount = shareAmount;
    }
}