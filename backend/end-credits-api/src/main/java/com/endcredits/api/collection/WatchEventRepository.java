package com.endcredits.api.collection;

import org.springframework.data.jpa.repository.JpaRepository;

public interface WatchEventRepository extends JpaRepository<WatchEvent, Long> {
    long countByUserIdAndTmdbId(Long userId, Long tmdbId);

    void deleteByUserIdAndTmdbId(Long userId, Long tmdbId);
}
