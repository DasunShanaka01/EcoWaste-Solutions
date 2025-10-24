package com.example.backend.repository;

import com.example.backend.Admin.WasteCollectionReport;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface WasteCollectionReportRepository extends MongoRepository<WasteCollectionReport, String> {

    // Find reports by template type
    List<WasteCollectionReport> findByTemplateType(String templateType);

    // Find reports generated within a date range
    List<WasteCollectionReport> findByGeneratedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

    // Find reports by generated user
    List<WasteCollectionReport> findByGeneratedBy(String generatedBy);

    // Find reports by format
    List<WasteCollectionReport> findByFormat(String format);

    // Find reports by status
    List<WasteCollectionReport> findByStatus(String status);
}