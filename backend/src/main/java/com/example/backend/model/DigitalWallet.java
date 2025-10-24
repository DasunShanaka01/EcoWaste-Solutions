package com.example.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "digital_wallets")
public class DigitalWallet {
    @Id
    private String id;
    private String userId;
    private Integer points;
    private Instant createdAt;
    private Instant updatedAt;
    private List<Transaction> transactions;

    public DigitalWallet() {
        this.points = 0;
        this.transactions = new ArrayList<>();
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public DigitalWallet(String userId) {
        this();
        this.userId = userId;
    }

    // Getters and setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public Integer getPoints() {
        return points;
    }

    public void setPoints(Integer points) {
        this.points = points;
        this.updatedAt = Instant.now();
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<Transaction> getTransactions() {
        return transactions;
    }

    public void setTransactions(List<Transaction> transactions) {
        this.transactions = transactions;
    }

    public void addPoints(Integer points, String description) {
        this.points += points;
        this.updatedAt = Instant.now();
        this.transactions.add(new Transaction(points, description, "CREDIT"));
    }

    public boolean deductPoints(Integer points, String description) {
        if (this.points >= points) {
            this.points -= points;
            this.updatedAt = Instant.now();
            this.transactions.add(new Transaction(-points, description, "DEBIT"));
            return true;
        }
        return false;
    }

    // Inner class for transactions
    public static class Transaction {
        private Integer amount;
        private String description;
        private String type; // CREDIT or DEBIT
        private Instant timestamp;

        public Transaction() {
            this.timestamp = Instant.now();
        }

        public Transaction(Integer amount, String description, String type) {
            this();
            this.amount = amount;
            this.description = description;
            this.type = type;
        }

        // Getters and setters
        public Integer getAmount() {
            return amount;
        }

        public void setAmount(Integer amount) {
            this.amount = amount;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public Instant getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(Instant timestamp) {
            this.timestamp = timestamp;
        }
    }
}
