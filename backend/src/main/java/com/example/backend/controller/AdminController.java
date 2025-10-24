package com.example.backend.controller;

import com.example.backend.model.User;
import com.example.backend.model.SpecialCollection;
import com.example.backend.Waste.Waste;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.SpecialCollectionRepository;
import com.example.backend.Waste.WasteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WasteRepository wasteRepository;

    @Autowired
    private SpecialCollectionRepository specialCollectionRepository;

    // Get dashboard statistics
    @GetMapping("/dashboard-stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        try {
            // Get all users
            List<User> allUsers = userRepository.findAll();
            long totalUsers = allUsers.size();
            long collectorsCount = allUsers.stream()
                    .filter(user -> "COLLECTOR".equals(user.getRole()))
                    .count();

            // Get all waste items
            List<Waste> allWasteItems = wasteRepository.findAll();
            long totalWasteItems = allWasteItems.size();
            long pendingPickups = allWasteItems.stream()
                    .filter(waste -> "Pending".equals(waste.getStatus()))
                    .count();

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalUsers", totalUsers);
            stats.put("totalWasteItems", totalWasteItems);
            stats.put("totalCollectors", collectorsCount);
            stats.put("pendingPickups", pendingPickups);

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // Get waste categories for pie chart
    @GetMapping("/waste-categories")
    public ResponseEntity<Map<String, Object>> getWasteCategories() {
        try {
            List<Waste> allWasteItems = wasteRepository.findAll();

            // Group by waste categories from items
            Map<String, Integer> categoryCount = new HashMap<>();
            for (Waste waste : allWasteItems) {
                if (waste.getItems() != null && !waste.getItems().isEmpty()) {
                    for (Waste.Item item : waste.getItems()) {
                        String category = item.getCategory();
                        if (category != null && !category.isEmpty()) {
                            categoryCount.put(category, categoryCount.getOrDefault(category, 0) + 1);
                        }
                    }
                }
            }

            // Convert to chart data format
            List<Map<String, Object>> chartData = new ArrayList<>();
            String[] colors = new String[] { "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40" };
            int colorIndex = 0;

            for (Map.Entry<String, Integer> entry : categoryCount.entrySet()) {
                Map<String, Object> dataPoint = new HashMap<>();
                dataPoint.put("name", entry.getKey());
                dataPoint.put("value", entry.getValue());
                dataPoint.put("color", colors[colorIndex % colors.length]);
                chartData.add(dataPoint);
                colorIndex++;
            }

            Map<String, Object> response = new HashMap<>();
            response.put("chartData", chartData);
            response.put("totalCategories", categoryCount.size());
            response.put("totalItems", allWasteItems.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // Get special collections for bar chart
    @GetMapping("/special-collections")
    public ResponseEntity<Map<String, Object>> getSpecialCollections() {
        try {
            List<SpecialCollection> allSpecialCollections = specialCollectionRepository.findAll();

            // Group by waste type or status
            Map<String, Integer> statusCount = new HashMap<>();
            for (SpecialCollection collection : allSpecialCollections) {
                String status = collection.getPaymentStatus();
                if (status != null && !status.isEmpty()) {
                    statusCount.put(status, statusCount.getOrDefault(status, 0) + 1);
                }
            }

            // If no payment status grouping, group by date (month)
            if (statusCount.isEmpty()) {
                for (SpecialCollection collection : allSpecialCollections) {
                    String month = collection.getDate() != null
                            ? collection.getDate().substring(0, Math.min(7, collection.getDate().length()))
                            : "Unknown";
                    statusCount.put(month, statusCount.getOrDefault(month, 0) + 1);
                }
            }

            // Convert to chart data format
            List<Map<String, Object>> chartData = new ArrayList<>();
            String[] colors = new String[] { "#4CAF50", "#FF9800", "#F44336", "#2196F3", "#9C27B0" };
            int colorIndex = 0;

            for (Map.Entry<String, Integer> entry : statusCount.entrySet()) {
                Map<String, Object> dataPoint = new HashMap<>();
                dataPoint.put("category", entry.getKey());
                dataPoint.put("value", entry.getValue());
                dataPoint.put("color", colors[colorIndex % colors.length]);
                chartData.add(dataPoint);
                colorIndex++;
            }

            Map<String, Object> response = new HashMap<>();
            response.put("chartData", chartData);
            response.put("totalCollections", allSpecialCollections.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // Get recent activities
    @GetMapping("/recent-activities")
    public ResponseEntity<List<Map<String, Object>>> getRecentActivities() {
        try {
            List<Map<String, Object>> activities = new ArrayList<>();

            // Get recent waste submissions
            List<Waste> recentWastes = wasteRepository.findAll()
                    .stream()
                    .sorted((w1, w2) -> w2.getSubmissionDate().compareTo(w1.getSubmissionDate()))
                    .limit(5)
                    .collect(Collectors.toList());

            for (Waste waste : recentWastes) {
                Map<String, Object> activity = new HashMap<>();
                activity.put("type", "waste");
                activity.put("message", "New waste item reported by " + waste.getFullName());
                activity.put("time", waste.getSubmissionDate());
                activity.put("status", waste.getStatus());
                activities.add(activity);
            }

            // Get recent special collections
            List<SpecialCollection> recentSpecial = specialCollectionRepository.findAll()
                    .stream()
                    .limit(3)
                    .collect(Collectors.toList());

            for (SpecialCollection special : recentSpecial) {
                Map<String, Object> activity = new HashMap<>();
                activity.put("type", "special");
                activity.put("message", "Special collection scheduled for " + special.getDate());
                activity.put("time", special.getDate());
                activity.put("status", special.getPaymentStatus());
                activities.add(activity);
            }

            // Sort by time (most recent first)
            activities.sort((a1, a2) -> {
                // Simple string comparison for now
                String time1 = a1.get("time").toString();
                String time2 = a2.get("time").toString();
                return time2.compareTo(time1);
            });

            return ResponseEntity.ok(activities.stream().limit(10).collect(Collectors.toList()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // Get collection routes (mock data for now since there's no routes collection)
    @GetMapping("/collection-routes")
    public ResponseEntity<List<Map<String, Object>>> getCollectionRoutes() {
        try {
            // Since there's no routes collection, we'll create mock routes based on waste
            // locations
            List<Waste> allWastes = wasteRepository.findAll();
            Map<String, Integer> cityRoutes = new HashMap<>();

            for (Waste waste : allWastes) {
                if (waste.getPickup() != null && waste.getPickup().getCity() != null) {
                    String city = waste.getPickup().getCity();
                    cityRoutes.put(city, cityRoutes.getOrDefault(city, 0) + 1);
                }
            }

            List<Map<String, Object>> routes = new ArrayList<>();
            int routeId = 1;
            for (Map.Entry<String, Integer> entry : cityRoutes.entrySet()) {
                Map<String, Object> route = new HashMap<>();
                route.put("id", routeId++);
                route.put("name", "Route " + entry.getKey());
                route.put("city", entry.getKey());
                route.put("collectionPoints", entry.getValue());
                route.put("status", "Active");
                route.put("estimatedTime", (entry.getValue() * 15) + " mins");
                routes.add(route);
            }

            return ResponseEntity.ok(routes);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}