package com.endcredits.api.collection;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MyFiveMovieRepository extends JpaRepository<MyFiveMovie, Long> {
    List<MyFiveMovie> findByUserIdOrderByPositionAsc(Long userId);
    void deleteByUserId(Long userId);
    void deleteByUserIdAndTmdbId(Long userId, Long tmdbId);
}
