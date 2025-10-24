package com.example.backend.model.valueobjects;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;

/**
 * Value object representing monetary amounts
 * Encapsulates money calculations and validation
 * Following Single Responsibility Principle - handles only monetary operations
 */
public class Money {
    private static final int DECIMAL_PLACES = 2;
    private static final RoundingMode ROUNDING_MODE = RoundingMode.HALF_UP;
    
    private final BigDecimal amount;

    // Default constructor for MongoDB deserialization
    public Money() {
        this.amount = BigDecimal.ZERO;
    }

    public Money(double amount) {
        this.amount = BigDecimal.valueOf(amount).setScale(DECIMAL_PLACES, ROUNDING_MODE);
    }

    public Money(BigDecimal amount) {
        this.amount = amount.setScale(DECIMAL_PLACES, ROUNDING_MODE);
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        // This setter is for MongoDB deserialization only
        // In practice, Money should be immutable, but we need this for MongoDB
    }

    public double getDoubleValue() {
        return amount.doubleValue();
    }

    public boolean isZero() {
        return amount.compareTo(BigDecimal.ZERO) == 0;
    }

    public boolean isPositive() {
        return amount.compareTo(BigDecimal.ZERO) > 0;
    }

    public Money add(Money other) {
        return new Money(this.amount.add(other.amount));
    }

    public Money multiply(double multiplier) {
        return new Money(this.amount.multiply(BigDecimal.valueOf(multiplier)));
    }

    public boolean isGreaterThan(Money other) {
        return this.amount.compareTo(other.amount) > 0;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Money money = (Money) o;
        return Objects.equals(amount, money.amount);
    }

    @Override
    public int hashCode() {
        return Objects.hash(amount);
    }

    @Override
    public String toString() {
        return String.format("LKR %.2f", amount.doubleValue());
    }
}
