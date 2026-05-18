package com.splittrip.trip;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TripMemberRepository extends JpaRepository<TripMember, TripMemberId> {
    List<TripMember> findByIdTripId(UUID tripId);
    Optional<TripMember> findByIdTripIdAndIdUserId(UUID tripId, UUID userId);
}
