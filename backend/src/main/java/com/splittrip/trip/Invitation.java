package com.splittrip.trip;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;

import java.sql.Types;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "zaproszenia")
public class Invitation {

    //Encja zaproszenia (zaproszenia), śledząca relację między organizatorem a zapraszanym użytkownikiem, daty oraz aktualny status akceptacji

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(Types.VARCHAR)
    @Column(name = "id_zaproszenia", length = 36)
    private UUID id;

    @JdbcTypeCode(Types.VARCHAR)
    @Column(name = "podroze_id_podrozy", length = 36)
    private UUID tripId;

    @JdbcTypeCode(Types.VARCHAR)
    @Column(name = "id_zapraszanego", length = 36)
    private UUID inviteeId;

    @JdbcTypeCode(Types.VARCHAR)
    @Column(name = "id_zapraszajacego", length = 36)
    private UUID inviterId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private InvitationStatus status;

    @Column(name = "data_wyslania")
    private LocalDate sentAt;

    @Column(name = "data_odpowiedzi")
    private LocalDate respondedAt;

    public Invitation() {
    }

    public Invitation(UUID tripId, UUID inviteeId, UUID inviterId, InvitationStatus status, LocalDate sentAt) {
        this.tripId = tripId;
        this.inviteeId = inviteeId;
        this.inviterId = inviterId;
        this.status = status;
        this.sentAt = sentAt;
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

    public UUID getInviteeId() {
        return inviteeId;
    }

    public void setInviteeId(UUID inviteeId) {
        this.inviteeId = inviteeId;
    }

    public UUID getInviterId() {
        return inviterId;
    }

    public void setInviterId(UUID inviterId) {
        this.inviterId = inviterId;
    }

    public InvitationStatus getStatus() {
        return status;
    }

    public void setStatus(InvitationStatus status) {
        this.status = status;
    }

    public LocalDate getSentAt() {
        return sentAt;
    }

    public void setSentAt(LocalDate sentAt) {
        this.sentAt = sentAt;
    }

    public LocalDate getRespondedAt() {
        return respondedAt;
    }

    public void setRespondedAt(LocalDate respondedAt) {
        this.respondedAt = respondedAt;
    }
}

