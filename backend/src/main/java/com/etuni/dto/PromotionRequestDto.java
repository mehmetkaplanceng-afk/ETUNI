package com.etuni.dto;

import java.time.LocalDateTime;

public class PromotionRequestDto {

    public static class PromotionRequestResponse {
        private Long id;
        private Long userId;
        private String userFullName;
        private String userEmail;
        private String status;
        private LocalDateTime createdAt;

        public PromotionRequestResponse() {
        }

        public PromotionRequestResponse(Long id, Long userId, String userFullName, String userEmail, String status,
                LocalDateTime createdAt) {
            this.id = id;
            this.userId = userId;
            this.userFullName = userFullName;
            this.userEmail = userEmail;
            this.status = status;
            this.createdAt = createdAt;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public Long getUserId() {
            return userId;
        }

        public void setUserId(Long userId) {
            this.userId = userId;
        }

        public String getUserFullName() {
            return userFullName;
        }

        public void setUserFullName(String userFullName) {
            this.userFullName = userFullName;
        }

        public String getUserEmail() {
            return userEmail;
        }

        public void setUserEmail(String userEmail) {
            this.userEmail = userEmail;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public LocalDateTime getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
        }
    }
}
