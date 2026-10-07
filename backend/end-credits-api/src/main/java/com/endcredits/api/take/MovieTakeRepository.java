package com.endcredits.api.take;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MovieTakeRepository extends JpaRepository<MovieTake, Long> {
    List<MovieTake> findByUserIdOrderByUpdatedAtDesc(Long userId);
    Optional<MovieTake> findByUserIdAndTmdbId(Long userId, Long tmdbId);
    void deleteByUserIdAndTmdbId(Long userId, Long tmdbId);
}
