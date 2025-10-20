package com.example.backend.repository;

import com.example.backend.model.WasteAccount;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface WasteAccountRepository extends MongoRepository<WasteAccount, String> {
    Optional<WasteAccount> findByUserId(String userId);
    Optional<WasteAccount> findByAccountId(String accountId);
    boolean existsByUserId(String userId);
}
