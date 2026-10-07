package com.endcredits.api.auth;

public class DuplicateUserException extends RuntimeException {

    public DuplicateUserException(String field) {
        super(field + " is already in use");
    }
}
