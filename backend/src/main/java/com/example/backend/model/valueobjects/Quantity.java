package com.example.backend.model.valueobjects;

import java.util.Objects;

/**
 * Value object representing quantity in kilograms
 * Encapsulates quantity validation and business rules
 * Following Single Responsibility Principle - handles only quantity-related operations
 */
public class Quantity {
    private static final int MIN_QUANTITY = 1;
    private static final int MAX_QUANTITY = 1000;
    
    private int value;

    // Default constructor for MongoDB deserialization
    public Quantity() {
        this.value = 0;
    }

    public Quantity(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }

    public void setValue(int value) {
        this.value = value;
    }

    public boolean isHeavy() {
        return value > 50; // Consider heavy if more than 50kg
    }

    public boolean isLight() {
        return value <= 10; // Consider light if 10kg or less
    }

    public boolean isValid() {
        return value >= MIN_QUANTITY && value <= MAX_QUANTITY;
    }

    public Quantity add(Quantity other) {
        return new Quantity(this.value + other.value);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Quantity quantity = (Quantity) o;
        return value == quantity.value;
    }

    @Override
    public int hashCode() {
        return Objects.hash(value);
    }

    @Override
    public String toString() {
        return value + " kg";
    }
}
