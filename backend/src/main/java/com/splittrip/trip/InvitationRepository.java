package com.splittrip.trip;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvitationRepository extends JpaRepository<Invitation, UUID> {
    List<Invitation> findByInviteeIdAndStatus(UUID inviteeId, InvitationStatus status);
    Optional<Invitation> findByTripIdAndInviteeId(UUID tripId, UUID inviteeId);
}
