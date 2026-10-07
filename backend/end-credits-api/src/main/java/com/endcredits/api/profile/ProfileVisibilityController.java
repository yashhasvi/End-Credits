package com.endcredits.api.profile;

import com.endcredits.api.auth.AuthenticatedUser;
import com.endcredits.api.user.User;
import com.endcredits.api.user.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
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
@RequestMapping("/api/profile/visibility")
public class ProfileVisibilityController {

    private final UserRepository userRepository;

    public ProfileVisibilityController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public ProfileVisibilityResponse visibility(@AuthenticationPrincipal AuthenticatedUser authenticatedUser) {
        return new ProfileVisibilityResponse(user(authenticatedUser).isProfilePublic());
    }

    @PutMapping
    @Transactional
    public ProfileVisibilityResponse updateVisibility(@AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @Valid @RequestBody UpdateProfileVisibilityRequest request) {
        User user = user(authenticatedUser);
        user.updateProfilePublic(request.profilePublic());
        return new ProfileVisibilityResponse(user.isProfilePublic());
    }

    private User user(AuthenticatedUser authenticatedUser) {
        return userRepository.findById(authenticatedUser.id()).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Your session is no longer valid."));
    }
}

record ProfileVisibilityResponse(boolean profilePublic) {
}

record UpdateProfileVisibilityRequest(@NotNull Boolean profilePublic) {
}
