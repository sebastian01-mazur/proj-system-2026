package com.splittrip.trip;

import jakarta.persistence.*;

import javax.management.relation.Role;
import java.time.LocalDate;

@Entity
@Table(name = "uczestnicy_podrozy")
public class TripMember {

    //Encja relacji (uczestnicy_podrozy), przypisująca użytkownika do danej podróży wraz z określeniem jego roli (organizator lub uczestnik)

    @EmbeddedId
    private TripMemberId id;

    @Enumerated(EnumType.STRING)
    @Column(name = "rola")
    private Role role;

    @Column(name = "data_dolaczenia")
    private LocalDate joinedAt;

    public TripMember() {
    }

    public TripMember(TripMemberId id, Role role, LocalDate joinedAt) {
        this.id = id;
        this.role = role;
        this.joinedAt = joinedAt;
    }

    public TripMemberId getId() {
        return id;
    }

    public void setId(TripMemberId id) {
        this.id = id;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public LocalDate getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(LocalDate joinedAt) {
        this.joinedAt = joinedAt;
    }

}
