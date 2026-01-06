package com.etuni.exception;

/**
 * Exception thrown when a requested resource is not found.
 * Returns HTTP 404 status.
 */
public class ResourceNotFoundException extends BusinessException {

    public ResourceNotFoundException(String resourceType, Long id) {
        super(
                String.format("%s bulunamadı: %d", resourceType, id),
                resourceType.toUpperCase() + "_NOT_FOUND",
                404);
    }

    public ResourceNotFoundException(String resourceType, String identifier) {
        super(
                String.format("%s bulunamadı: %s", resourceType, identifier),
                resourceType.toUpperCase() + "_NOT_FOUND",
                404);
    }

    public ResourceNotFoundException(String message) {
        super(message, "RESOURCE_NOT_FOUND", 404);
    }
}
