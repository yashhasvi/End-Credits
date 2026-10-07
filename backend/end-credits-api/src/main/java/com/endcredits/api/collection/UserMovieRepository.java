package com.endcredits.api.collection;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserMovieRepository extends JpaRepository<UserMovie, Long> {
    Optional<UserMovie> findByUserIdAndTmdbId(Long userId, Long tmdbId);
    List<UserMovie> findByUserIdOrderByCreatedAtDesc(Long userId);
}
