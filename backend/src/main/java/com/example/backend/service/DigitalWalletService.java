package com.example.backend.service;

import com.example.backend.model.DigitalWallet;
import com.example.backend.repository.DigitalWalletRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class DigitalWalletService {

    @Autowired
    private DigitalWalletRepository digitalWalletRepository;

    public DigitalWallet getOrCreateWallet(String userId) {
        Optional<DigitalWallet> wallet = digitalWalletRepository.findByUserId(userId);
        if (wallet.isPresent()) {
            return wallet.get();
        } else {
            DigitalWallet newWallet = new DigitalWallet(userId);
            return digitalWalletRepository.save(newWallet);
        }
    }

    public DigitalWallet addPoints(String userId, Integer points, String description) {
        DigitalWallet wallet = getOrCreateWallet(userId);
        wallet.addPoints(points, description);
        return digitalWalletRepository.save(wallet);
    }

    public boolean deductPoints(String userId, Integer points, String description) {
        DigitalWallet wallet = getOrCreateWallet(userId);
        boolean success = wallet.deductPoints(points, description);
        if (success) {
            digitalWalletRepository.save(wallet);
        }
        return success;
    }

    public Integer getPoints(String userId) {
        DigitalWallet wallet = getOrCreateWallet(userId);
        return wallet.getPoints();
    }

    public DigitalWallet getWallet(String userId) {
        return getOrCreateWallet(userId);
    }
}
