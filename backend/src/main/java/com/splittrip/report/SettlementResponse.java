package com.splittrip.report;

import java.math.BigDecimal;
import java.util.UUID;

public record SettlementResponse(
        UUID debtorId,
        UUID creditorId,
        BigDecimal amount
) {
}
