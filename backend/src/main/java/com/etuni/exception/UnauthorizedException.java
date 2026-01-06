package com.etuni.exception;

/**
 * Exception thrown for authentication/authorization failures.
 * Returns HTTP 401 or 403 status.
 */
public class UnauthorizedException extends BusinessException {

    public UnauthorizedException() {
        super("Yetkilendirme hatası", "UNAUTHORIZED", 401);
    }

    public UnauthorizedException(String message) {
        super(message, "UNAUTHORIZED", 401);
    }

    public static UnauthorizedException forbidden() {
        return new UnauthorizedException("Bu işlem için yetkiniz yok") {
            @Override
            public int getHttpStatus() {
                return 403;
            }

            @Override
            public String getErrorCode() {
                return "FORBIDDEN";
            }
        };
    }

    public static UnauthorizedException invalidToken() {
        return new UnauthorizedException("Geçersiz veya süresi dolmuş token");
    }

    public static UnauthorizedException sessionExpired() {
        return new UnauthorizedException("Oturum süresi doldu, lütfen tekrar giriş yapın");
    }
}
