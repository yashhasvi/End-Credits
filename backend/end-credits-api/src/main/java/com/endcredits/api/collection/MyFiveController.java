package com.endcredits.api.collection;

import java.util.LinkedHashSet;
import java.util.List;

import com.endcredits.api.auth.AuthenticatedUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/profile/my-five")
public class MyFiveController {

    private final MyFiveMovieRepository myFiveMovieRepository;
    private final UserMovieRepository userMovieRepository;
    private final WatchEventRepository watchEventRepository;

    public MyFiveController(MyFiveMovieRepository myFiveMovieRepository, UserMovieRepository userMovieRepository,
            WatchEventRepository watchEventRepository) {
        this.myFiveMovieRepository = myFiveMovieRepository;
        this.userMovieRepository = userMovieRepository;
        this.watchEventRepository = watchEventRepository;
    }

    @GetMapping
    public List<CollectionMovieResponse> myFive(@AuthenticationPrincipal AuthenticatedUser user) {
        return myFiveMovieRepository.findByUserIdOrderByPositionAsc(user.id()).stream()
                .map(entry -> collectionMovie(user.id(), entry.getTmdbId()))
                .toList();
    }

    @PutMapping
    @Transactional
    public List<CollectionMovieResponse> replaceMyFive(@AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody MyFiveRequest request) {
        LinkedHashSet<Long> uniqueIds = new LinkedHashSet<>(request.tmdbIds());
        if (uniqueIds.size() != request.tmdbIds().size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A movie can only appear once in My Five.");
        }

        List<Long> tmdbIds = List.copyOf(uniqueIds);
        for (Long tmdbId : tmdbIds) {
            userMovieRepository.findByUserIdAndTmdbId(user.id(), tmdbId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "My Five can only include films in your saved collection."));
        }

        myFiveMovieRepository.deleteByUserId(user.id());
        myFiveMovieRepository.flush();
        for (int index = 0; index < tmdbIds.size(); index++) {
            myFiveMovieRepository.save(new MyFiveMovie(user.id(), tmdbIds.get(index), (short) (index + 1)));
        }
        return tmdbIds.stream().map(tmdbId -> collectionMovie(user.id(), tmdbId)).toList();
    }

    private CollectionMovieResponse collectionMovie(Long userId, Long tmdbId) {
        UserMovie movie = userMovieRepository.findByUserIdAndTmdbId(userId, tmdbId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Saved film was not found."));
        return CollectionMovieResponse.from(movie, watchEventRepository.countByUserIdAndTmdbId(userId, tmdbId));
    }
}

record MyFiveRequest(
        @NotNull @Size(max = 5) List<@NotNull @Positive Long> tmdbIds) {
}
