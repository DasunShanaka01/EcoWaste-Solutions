package com.example.backend.repository;

import com.example.backend.Admin.Report;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReportRepository extends MongoRepository<Report, String> {

    // Find reports by status
    List<Report> findByStatus(String status);

    // Find reports by category
    List<Report> findByCategory(String category);

    // Find reports by sub-category
    List<Report> findBySubCategory(String subCategory);

    // Find reports by category and sub-category
    List<Report> findByCategoryAndSubCategory(String category, String subCategory);

    // Find reports created within a date range
    List<Report> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

    // Find reports by location
    List<Report> findByLocationContainingIgnoreCase(String location);

    // Find reports by reported user
    List<Report> findByReportedBy(String reportedBy);

    // Find reports assigned to a specific user
    List<Report> findByAssignedTo(String assignedTo);

    // Get pending reports ordered by creation date
    List<Report> findByStatusOrderByCreatedAtAsc(String status);
}