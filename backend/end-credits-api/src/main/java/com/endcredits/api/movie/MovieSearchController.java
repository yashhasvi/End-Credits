package com.endcredits.api.movie;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@RestController
@Validated
@RequestMapping("/api/movies")
public class MovieSearchController {

    private final TmdbMovieSearchService tmdbMovieSearchService;

    public MovieSearchController(TmdbMovieSearchService tmdbMovieSearchService) {
        this.tmdbMovieSearchService = tmdbMovieSearchService;
    }

    @GetMapping("/search")
    public MovieSearchResponse search(
            @RequestParam @NotBlank @Size(min = 2, max = 100) String query) {
        return tmdbMovieSearchService.search(query.trim());
    }

    @GetMapping("/browse/{shelf}")
    public MovieBrowseResponse browse(@PathVariable @NotBlank String shelf) {
        return tmdbMovieSearchService.browse(shelf);
    }

    @GetMapping("/{tmdbId}/recommendations")
    public MovieRecommendationResponse recommendations(@PathVariable @Positive Long tmdbId) {
        return tmdbMovieSearchService.recommendations(tmdbId);
    }

    @GetMapping("/{tmdbId}")
    public MovieDetailsResponse detail(@PathVariable @Positive Long tmdbId) {
        return tmdbMovieSearchService.detail(tmdbId);
    }
}

@Service
class TmdbMovieSearchService {

    private static final int MAX_RESULTS = 12;

    private final RestClient tmdbClient;
    private final String readAccessToken;

    TmdbMovieSearchService(@Value("${tmdb.base-url}") String baseUrl,
            @Value("${tmdb.api-read-access-token}") String readAccessToken) {
        this.tmdbClient = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .build();
        this.readAccessToken = readAccessToken;
    }

    MovieSearchResponse search(String query) {
        if (!StringUtils.hasText(readAccessToken)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Movie discovery is not configured yet");
        }

        try {
            Map<?, ?> payload = tmdbClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/search/movie")
                            .queryParam("query", query)
                            .queryParam("include_adult", false)
                            .queryParam("language", "en-US")
                            .build())
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + readAccessToken)
                    .retrieve()
                    .body(Map.class);

            return new MovieSearchResponse(toMovieResults(payload));
        } catch (RestClientException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Movie discovery is temporarily unavailable", exception);
        }
    }

    MovieDetailsResponse detail(long tmdbId) {
        if (!StringUtils.hasText(readAccessToken)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Movie discovery is not configured yet");
        }

        try {
            Map<?, ?> payload = tmdbClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/movie/{tmdbId}")
                            .queryParam("append_to_response", "credits")
                            .queryParam("language", "en-US")
                            .build(tmdbId))
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + readAccessToken)
                    .retrieve()
                    .body(Map.class);
            return toMovieDetails(tmdbId, payload);
        } catch (RestClientException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Movie details are temporarily unavailable", exception);
        }
    }

    MovieBrowseResponse browse(String shelf) {
        if (!StringUtils.hasText(readAccessToken)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Movie discovery is not configured yet");
        }

        BrowseRequest request = browseRequest(shelf);
        try {
            Map<?, ?> payload = tmdbClient.get()
                    .uri(uriBuilder -> {
                        var builder = uriBuilder.path(request.path())
                                .queryParam("language", "en-US")
                                .queryParam("include_adult", false);
                        request.parameters().forEach((name, value) -> builder.queryParam(name, value));
                        return builder.build();
                    })
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + readAccessToken)
                    .retrieve()
                    .body(Map.class);
            return new MovieBrowseResponse(request.label(), toBrowseResults(payload));
        } catch (RestClientException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Movie discovery is temporarily unavailable", exception);
        }
    }

    MovieRecommendationResponse recommendations(long tmdbId) {
        if (!StringUtils.hasText(readAccessToken)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Movie discovery is not configured yet");
        }

        try {
            Map<?, ?> payload = tmdbClient.get()
                    .uri(uriBuilder -> uriBuilder.path("/movie/{tmdbId}/recommendations")
                            .queryParam("language", "en-US")
                            .queryParam("page", 1)
                            .build(tmdbId))
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + readAccessToken)
                    .retrieve()
                    .body(Map.class);
            return new MovieRecommendationResponse(tmdbId, toBrowseResults(payload));
        } catch (RestClientException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Related films are temporarily unavailable", exception);
        }
    }

    private BrowseRequest browseRequest(String shelf) {
        return switch (shelf) {
            case "trending" -> new BrowseRequest("TRENDING THIS WEEK", "/trending/movie/week", Map.of());
            case "now-playing" -> new BrowseRequest("NOW PLAYING", "/movie/now_playing", Map.of());
            case "popular" -> new BrowseRequest("POPULAR FILMS", "/movie/popular", Map.of());
            case "indian-cinema" -> new BrowseRequest("INDIAN CINEMA", "/discover/movie", Map.of(
                    "with_original_language", "hi|ta|te|ml|kn|bn",
                    "sort_by", "popularity.desc"));
            case "world-cinema" -> new BrowseRequest("AROUND THE WORLD", "/discover/movie", Map.of(
                    "with_original_language", "ko|ja|fr|es|it|de",
                    "sort_by", "popularity.desc"));
            case "horror" -> new BrowseRequest("HORROR", "/discover/movie", Map.of(
                    "with_genres", "27",
                    "sort_by", "popularity.desc"));
            // Vibe Table V1 deliberately resolves to transparent TMDB genre queries.
            // These names are allowlisted here instead of accepting a client supplied genre id.
            case "romance" -> genreShelf("ROMANCE", "10749");
            case "drama" -> genreShelf("DRAMA", "18");
            case "action" -> genreShelf("ACTION", "28");
            case "science-fiction" -> genreShelf("SCIENCE FICTION", "878");
            case "comedy" -> genreShelf("COMEDY", "35");
            case "animation" -> genreShelf("ANIMATION", "16");
            case "mystery" -> genreShelf("MYSTERY", "9648");
            case "fantasy" -> genreShelf("FANTASY", "14");
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown cinema shelf");
        };
    }

    private BrowseRequest genreShelf(String label, String genreId) {
        return new BrowseRequest(label, "/discover/movie", Map.of(
                "with_genres", genreId,
                "sort_by", "popularity.desc"));
    }

    private List<MovieSearchResult> toMovieResults(Map<?, ?> payload) {
        List<MovieSearchResult> movies = new ArrayList<>();
        Object rawResults = payload == null ? null : payload.get("results");
        if (!(rawResults instanceof List<?> results)) {
            return List.of();
        }

        for (Object result : results) {
            if (!(result instanceof Map<?, ?> movie) || !(movie.get("id") instanceof Number tmdbId)) {
                continue;
            }

            movies.add(new MovieSearchResult(
                    tmdbId.longValue(),
                    textOrNull(movie, "title"),
                    textOrNull(movie, "release_date"),
                    textOrNull(movie, "poster_path"),
                    textOrNull(movie, "overview")));

            if (movies.size() == MAX_RESULTS) {
                break;
            }
        }
        return List.copyOf(movies);
    }

    private List<MovieBrowseResult> toBrowseResults(Map<?, ?> payload) {
        List<MovieBrowseResult> movies = new ArrayList<>();
        Object rawResults = payload == null ? null : payload.get("results");
        if (!(rawResults instanceof List<?> results)) {
            return List.of();
        }

        for (Object result : results) {
            if (!(result instanceof Map<?, ?> movie) || !(movie.get("id") instanceof Number tmdbId)) {
                continue;
            }
            movies.add(new MovieBrowseResult(
                    tmdbId.longValue(),
                    textOrNull(movie, "title"),
                    textOrNull(movie, "release_date"),
                    textOrNull(movie, "poster_path"),
                    textOrNull(movie, "backdrop_path"),
                    textOrNull(movie, "overview"),
                    numberList(movie.get("genre_ids")),
                    textOrNull(movie, "original_language")));
            if (movies.size() == MAX_RESULTS) {
                break;
            }
        }
        return List.copyOf(movies);
    }

    private String textOrNull(Map<?, ?> node, String field) {
        Object value = node == null ? null : node.get(field);
        return value instanceof String text && !text.isBlank() ? text : null;
    }

    private MovieDetailsResponse toMovieDetails(long tmdbId, Map<?, ?> movie) {
        Map<?, ?> credits = mapOrEmpty(movie == null ? null : movie.get("credits"));
        return new MovieDetailsResponse(
                tmdbId,
                textOrNull(movie, "title"),
                textOrNull(movie, "original_title"),
                textOrNull(movie, "release_date"),
                textOrNull(movie, "poster_path"),
                textOrNull(movie, "backdrop_path"),
                textOrNull(movie, "overview"),
                numberOrNull(movie, "runtime"),
                textOrNull(movie, "original_language"),
                firstCountry(movie),
                names(movie == null ? null : movie.get("genres"), "name", 6),
                director(credits),
                names(credits.get("cast"), "name", 10));
    }

    private Map<?, ?> mapOrEmpty(Object value) {
        return value instanceof Map<?, ?> map ? map : Map.of();
    }

    private Integer numberOrNull(Map<?, ?> node, String field) {
        Object value = node == null ? null : node.get(field);
        return value instanceof Number number ? number.intValue() : null;
    }

    private List<Integer> numberList(Object rawValues) {
        if (!(rawValues instanceof List<?> values)) return List.of();
        List<Integer> numbers = new ArrayList<>();
        for (Object value : values) {
            if (value instanceof Number number) numbers.add(number.intValue());
        }
        return List.copyOf(numbers);
    }

    private String firstCountry(Map<?, ?> movie) {
        if (movie == null || !(movie.get("production_countries") instanceof List<?> countries)) {
            return null;
        }
        for (Object country : countries) {
            if (country instanceof Map<?, ?> entry) {
                String name = textOrNull(entry, "name");
                if (name != null) return name;
            }
        }
        return null;
    }

    private String director(Map<?, ?> credits) {
        Object rawCrew = credits.get("crew");
        if (!(rawCrew instanceof List<?> crew)) return null;
        for (Object person : crew) {
            if (person instanceof Map<?, ?> entry && "Director".equals(textOrNull(entry, "job"))) {
                return textOrNull(entry, "name");
            }
        }
        return null;
    }

    private List<String> names(Object rawValues, String field, int limit) {
        if (!(rawValues instanceof List<?> values)) return List.of();
        List<String> names = new ArrayList<>();
        for (Object value : values) {
            if (value instanceof Map<?, ?> entry) {
                String name = textOrNull(entry, field);
                if (name != null) names.add(name);
            }
            if (names.size() == limit) break;
        }
        return List.copyOf(names);
    }

    private record BrowseRequest(String label, String path, Map<String, String> parameters) {
    }
}

record MovieSearchResponse(List<MovieSearchResult> results) {
}

record MovieSearchResult(long tmdbId, String title, String releaseDate, String posterPath, String overview) {
}

record MovieBrowseResponse(String label, List<MovieBrowseResult> results) {
}

record MovieBrowseResult(long tmdbId, String title, String releaseDate, String posterPath, String backdropPath,
        String overview, List<Integer> genreIds, String originalLanguage) {
}

record MovieRecommendationResponse(long originTmdbId, List<MovieBrowseResult> results) {
}

record MovieDetailsResponse(long tmdbId, String title, String originalTitle, String releaseDate, String posterPath,
        String backdropPath, String overview, Integer runtime, String originalLanguage, String country,
        List<String> genres, String director, List<String> cast) {
}
