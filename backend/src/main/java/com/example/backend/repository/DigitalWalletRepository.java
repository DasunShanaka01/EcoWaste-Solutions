package com.example.backend.repository;

import com.example.backend.model.DigitalWallet;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface DigitalWalletRepository extends MongoRepository<DigitalWallet, String> {
    Optional<DigitalWallet> findByUserId(String userId);
}
