package com.splittrip.report;

import java.math.BigDecimal;
import java.util.UUID;

public record ParticipantReportResponse(
        UUID participantId,
        BigDecimal amountPaid,
        BigDecimal amountAssigned,
        BigDecimal balance
) {
}
