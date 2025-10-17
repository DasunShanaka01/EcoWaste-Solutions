package com.example.backend.service;

import com.example.backend.dto.SpecialCollectionDTOs.FeeRequest;
import com.example.backend.dto.SpecialCollectionDTOs.ScheduleRequest;
import com.example.backend.model.SpecialCollection;

import java.util.List;

public interface SpecialCollectionService {
    double calculateFee(FeeRequest req);
    List<String> getAvailableDates(int days);
    List<String> getAvailableSlots(String date);
    SpecialCollection schedule(String userId, ScheduleRequest req);
    SpecialCollection reschedule(String userId, String collectionId, String date, String timeSlot);
    List<SpecialCollection> listUserCollections(String userId);
    SpecialCollection markPaid(String userId, String collectionId);
    SpecialCollection markCashPending(String userId, String collectionId);
    SpecialCollection markUnpaid(String userId, String collectionId, String method);
    SpecialCollection cancelCollection(String userId, String collectionId);
}


