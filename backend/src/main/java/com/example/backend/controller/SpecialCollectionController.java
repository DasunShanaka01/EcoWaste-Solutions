package com.example.backend.controller;

import com.example.backend.dto.SpecialCollectionDTOs.FeeRequest;
import com.example.backend.dto.SpecialCollectionDTOs.FeeResponse;
import com.example.backend.dto.SpecialCollectionDTOs.RescheduleRequest;
import com.example.backend.dto.SpecialCollectionDTOs.PayRequest;
import com.example.backend.dto.SpecialCollectionDTOs.ScheduleRequest;
import com.example.backend.dto.SpecialCollectionDTOs.ScheduleResponse;
import com.example.backend.model.SpecialCollection;
import com.example.backend.service.SpecialCollectionService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/special-collection")
public class SpecialCollectionController {

    private final SpecialCollectionService specialCollectionService; // Service dependency for business logic

    public SpecialCollectionController(SpecialCollectionService specialCollectionService) { // Constructor injection
        this.specialCollectionService = specialCollectionService;
    }

    @GetMapping("/receipt/{id}")
    public ResponseEntity<byte[]> downloadReceipt(HttpServletRequest request, @PathVariable("id") String id) {
        String userId = getUserIdFromCookie(request); // Extract user ID from session cookie
        if (userId == null) return ResponseEntity.status(401).build(); // Return 401 if not authenticated
        List<SpecialCollection> list = specialCollectionService.listUserCollections(userId); // Get user's collections
        SpecialCollection sc = list.stream().filter(c -> id.equals(c.getId())).findFirst().orElse(null); // Find specific collection
        if (sc == null) return ResponseEntity.notFound().build(); // Return 404 if collection not found
        StringBuilder sb = new StringBuilder(); // Build receipt content
        sb.append("EcoWaste Solutions - Receipt\n");
        sb.append("==============================\n\n");
        sb.append("Collection ID: ").append(sc.getId()).append("\n");
        sb.append("Category: ").append(sc.getCategory()).append("\n");
        sb.append("Items: ").append(sc.getItems()).append("\n");
        sb.append("Quantity (kg): ").append(sc.getQuantity()).append("\n");
        sb.append("Date: ").append(sc.getDate()).append("\n");
        sb.append("Time Slot: ").append(sc.getTimeSlot()).append("\n");
        sb.append("Pickup: ").append(sc.getLocation()).append("\n");
        sb.append("Payment Status: ").append(sc.getPaymentStatus()).append("\n");
        sb.append(String.format("Amount: LKR %.2f\n\n", sc.getFee()));
        sb.append("------------------------------\n");
        sb.append("Thank you for using EcoWaste Solutions.\n");
        byte[] content = sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8); // Convert to bytes
        HttpHeaders headers = new HttpHeaders(); // Set response headers
        headers.setContentType(MediaType.TEXT_PLAIN);
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=receipt-" + sc.getId() + ".txt");
        return ResponseEntity.ok().headers(headers).body(content); // Return receipt as downloadable file
    }

    private String getUserIdFromCookie(HttpServletRequest request) { // Helper method to extract user ID from session cookie
        Cookie[] cookies = request.getCookies(); // Get all cookies from request
        if (cookies != null) {
            for (Cookie c : cookies) { // Loop through all cookies
                if ("SESSIONID".equals(c.getName()) && c.getValue() != null && !c.getValue().isEmpty()) { // Find SESSIONID cookie
                    return c.getValue(); // Return user ID from cookie value
                }
            }
        }
        return null; // Return null if no valid session cookie found
    }

    @PostMapping("/fee")
    public ResponseEntity<FeeResponse> calculateFee(@RequestBody FeeRequest req) { // Calculate collection fee based on request
        double fee = specialCollectionService.calculateFee(req); // Call service to calculate fee
        FeeResponse res = new FeeResponse(); // Create response object
        res.fee = fee; // Set calculated fee
        return ResponseEntity.ok(res); // Return fee response
    }

    @GetMapping("/dates")
    public ResponseEntity<List<String>> getDates() { // Get available collection dates
        return ResponseEntity.ok(specialCollectionService.getAvailableDates(14)); // Return next 14 days
    }

    @GetMapping("/slots")
    public ResponseEntity<List<String>> getSlots(@RequestParam String date) { // Get available time slots for specific date
        return ResponseEntity.ok(specialCollectionService.getAvailableSlots(date)); // Return available slots
    }

    @GetMapping("/mine")
    public ResponseEntity<List<SpecialCollection>> myCollections(HttpServletRequest request) { // Get current user's collections
        System.out.println("SpecialCollectionController.myCollections() called");
        String userId = getUserIdFromCookie(request); // Extract user ID from session
        System.out.println("User ID from cookie: " + userId);
        
        if (userId == null) { // Check if user is authenticated
            System.out.println("No user ID found in cookie");
            return ResponseEntity.status(401).build(); // Return 401 if not authenticated
        }
        
        try {
            List<SpecialCollection> userCollections = specialCollectionService.listUserCollections(userId); // Get user's collections
            System.out.println("Found " + userCollections.size() + " collections for user: " + userId);
            return ResponseEntity.ok(userCollections); // Return user's collections
        } catch (Exception e) { // Handle any errors
            System.out.println("Error getting user collections: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).build(); // Return 500 on error
        }
    }

    @GetMapping("/all")
    public ResponseEntity<List<SpecialCollection>> getAllCollections() { // Get all special collections (admin/collector view)
        try {
            List<SpecialCollection> collections = specialCollectionService.findAll(); // Get all collections from database
            System.out.println("Found " + collections.size() + " special collections");
            for (SpecialCollection sc : collections) { // Log collection details for debugging
                System.out.println("Collection: " + sc.getId() + " - " + sc.getCategory() + " - Lat: " + sc.getLatitude() + " Lng: " + sc.getLongitude());
            }
            return ResponseEntity.ok(collections); // Return all collections
        } catch (Exception e) { // Handle any errors
            System.err.println("Error fetching all special collections: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(null); // Return 500 on error
        }
    }

    @GetMapping("/map")
    public ResponseEntity<List<SpecialCollection>> getCollectionsForMap(HttpServletRequest request) { // Get collections for map display
        System.out.println("SpecialCollectionController.getCollectionsForMap() called");
        String userId = getUserIdFromCookie(request); // Extract user ID from session
        System.out.println("User ID from cookie: " + userId);
        
        if (userId == null) { // Check if user is authenticated
            System.out.println("No user ID found in cookie");
            return ResponseEntity.status(401).build(); // Return 401 if not authenticated
        }
        
        try {
            // Get all collections but filter out collected ones and those without coordinates
            List<SpecialCollection> allCollections = specialCollectionService.findAll(); // Get all collections
            List<SpecialCollection> mapCollections = allCollections.stream() // Filter collections for map
                .filter(sc -> sc.getLatitude() != null && sc.getLongitude() != null) // Only collections with coordinates
                .filter(sc -> !"Collected".equalsIgnoreCase(sc.getStatus()) && // Exclude collected collections
                             !"Completed".equalsIgnoreCase(sc.getStatus())) // Exclude completed collections
                .collect(Collectors.toList()); // Collect filtered results
            
            System.out.println("Found " + mapCollections.size() + " collections for map (excluding collected)");
            return ResponseEntity.ok(mapCollections); // Return filtered collections for map
        } catch (Exception e) { // Handle any errors
            System.out.println("Error getting collections for map: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).build(); // Return 500 on error
        }
    }

    @GetMapping("/dashboard/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats(HttpServletRequest request) { // Get dashboard statistics
        System.out.println("SpecialCollectionController.getDashboardStats() called");
        String userId = getUserIdFromCookie(request); // Extract user ID from session
        System.out.println("User ID from cookie: " + userId);
        
        if (userId == null) { // Check if user is authenticated
            System.out.println("No user ID found in cookie");
            return ResponseEntity.status(401).build(); // Return 401 if not authenticated
        }
        
        try {
            List<SpecialCollection> allCollections = specialCollectionService.findAll(); // Get all collections
            
            // Count collections by status
            long totalCollections = allCollections.size(); // Total count
            long collectedCollections = allCollections.stream() // Count collected collections
                .filter(sc -> "Collected".equalsIgnoreCase(sc.getStatus()) || "Completed".equalsIgnoreCase(sc.getStatus()))
                .count();
            long pendingCollections = allCollections.stream() // Count pending collections
                .filter(sc -> "Pending".equalsIgnoreCase(sc.getStatus()) || "Scheduled".equalsIgnoreCase(sc.getStatus()))
                .count();
            
            // Group collected collections by date
            Map<String, Long> collectedByDate = allCollections.stream() // Group by date
                .filter(sc -> "Collected".equalsIgnoreCase(sc.getStatus()) || "Completed".equalsIgnoreCase(sc.getStatus()))
                .collect(Collectors.groupingBy(
                    SpecialCollection::getDate, // Group by date
                    Collectors.counting() // Count per date
                ));
            
            Map<String, Object> stats = new HashMap<>(); // Create stats response
            stats.put("totalCollections", totalCollections);
            stats.put("collectedCollections", collectedCollections);
            stats.put("pendingCollections", pendingCollections);
            stats.put("collectedByDate", collectedByDate);
            
            System.out.println("Dashboard stats: " + stats);
            return ResponseEntity.ok(stats); // Return dashboard statistics
        } catch (Exception e) { // Handle any errors
            System.out.println("Error getting dashboard stats: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).build(); // Return 500 on error
        }
    }

    @GetMapping("/search/{collectionId}")
    public ResponseEntity<Map<String, Object>> searchCollection(@PathVariable String collectionId, HttpServletRequest request) { // Search collection by ID
        System.out.println("SpecialCollectionController.searchCollection() called with ID: " + collectionId);
        String userId = getUserIdFromCookie(request); // Extract user ID from session
        System.out.println("User ID from cookie: " + userId);
        
        if (userId == null) { // Check if user is authenticated
            System.out.println("No user ID found in cookie");
            return ResponseEntity.status(401).build(); // Return 401 if not authenticated
        }
        
        try {
            // Find collection by ID (assuming the ID is a 6-digit substring or full ID)
            List<SpecialCollection> allCollections = specialCollectionService.findAll(); // Get all collections
            SpecialCollection foundCollection = allCollections.stream() // Search for collection
                .filter(sc -> sc.getId() != null && (sc.getId().contains(collectionId) || sc.getId().equals(collectionId))) // Match by ID
                .findFirst() // Get first match
                .orElse(null); // Return null if not found
            
            if (foundCollection == null) { // Check if collection was found
                Map<String, Object> response = new HashMap<>(); // Create not found response
                response.put("found", false);
                response.put("message", "Collection not found");
                return ResponseEntity.ok(response); // Return not found response
            }
            
            boolean isCollected = "Collected".equalsIgnoreCase(foundCollection.getStatus()) || // Check if already collected
                                  "Completed".equalsIgnoreCase(foundCollection.getStatus());
            
            Map<String, Object> response = new HashMap<>(); // Create found response
            response.put("found", true);
            response.put("collection", foundCollection);
            response.put("isCollected", isCollected);
            response.put("message", isCollected ? "This collection has already been collected" : "Collection found");
            
            System.out.println("Collection search result: " + response);
            return ResponseEntity.ok(response); // Return search result
        } catch (Exception e) { // Handle any errors
            System.out.println("Error searching collection: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).build(); // Return 500 on error
        }
    }

	@GetMapping("/list")
	public ResponseEntity<List<SpecialCollection>> listAllCollections() { // List all collections (alternative endpoint)
		try {
			List<SpecialCollection> collections = specialCollectionService.findAll(); // Get all collections
			System.out.println("LIST endpoint - Found " + collections.size() + " special collections");
			return ResponseEntity.ok(collections); // Return all collections
		} catch (Exception e) { // Handle any errors
			System.err.println("Error in LIST endpoint: " + e.getMessage());
			return ResponseEntity.status(500).body(null); // Return 500 on error
		}
	}

	// Find special collection by simple ID (6-digit ID)
	@GetMapping("/find/{id}")
	public ResponseEntity<Map<String, Object>> findSpecialCollectionById(@PathVariable String id) { // Find collection by simple ID
		try {
			Optional<SpecialCollection> collection = specialCollectionService.findBySimpleId(id); // Find by simple ID
			if (collection.isPresent()) { // Check if collection found
				Map<String, Object> response = new HashMap<>(); // Create response map
				SpecialCollection collectionData = collection.get(); // Get collection data
				String simpleId = collectionData.getId().length() >= 6 ? collectionData.getId().substring(collectionData.getId().length() - 6) : collectionData.getId(); // Extract 6-digit ID
				
				response.put("collectionId", collectionData.getId()); // Add collection ID
				response.put("simpleId", simpleId); // Add simple ID
				response.put("userId", collectionData.getUserId()); // Add user ID
				response.put("category", collectionData.getCategory()); // Add category
				response.put("items", collectionData.getItems()); // Add items
				response.put("quantity", collectionData.getQuantity()); // Add quantity
				response.put("fee", collectionData.getFee()); // Add fee
				response.put("date", collectionData.getDate()); // Add date
				response.put("timeSlot", collectionData.getTimeSlot()); // Add time slot
				response.put("location", collectionData.getLocation()); // Add location
				response.put("instructions", collectionData.getInstructions()); // Add instructions
				response.put("status", collectionData.getStatus()); // Add status
				response.put("paymentStatus", collectionData.getPaymentStatus()); // Add payment status
				response.put("paymentMethod", collectionData.getPaymentMethod()); // Add payment method
				response.put("createdAt", collectionData.getCreatedAt()); // Add created date
				response.put("collectedAt", collectionData.getCollectedAt()); // Add collected date
				response.put("latitude", collectionData.getLatitude()); // Add latitude
				response.put("longitude", collectionData.getLongitude()); // Add longitude
				return new ResponseEntity<>(response, HttpStatus.OK); // Return collection details
			} else { // Collection not found
				Map<String, Object> errorResponse = new HashMap<>(); // Create error response
				errorResponse.put("error", "Special collection not found with ID: " + id);
				return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND); // Return 404
			}
		} catch (Exception e) { // Handle any errors
			e.printStackTrace();
			Map<String, Object> errorResponse = new HashMap<>(); // Create error response
			errorResponse.put("error", "Error finding special collection: " + e.getMessage());
			return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR); // Return 500
		}
	}

    @GetMapping("/test-data")
    public ResponseEntity<String> createTestData() { // Create test data for development
        try {
            // Create some test special collection data
            SpecialCollection sc1 = new SpecialCollection(); // Create first test collection
            sc1.setUserId("test-user"); // Set user ID
            sc1.setCategory("Bulky"); // Set category
            sc1.setItems("Old Sofa"); // Set items
            sc1.setQuantity(25); // Set quantity
            sc1.setFee(150.0); // Set fee
            sc1.setDate("2024-01-15"); // Set date
            sc1.setTimeSlot("Morning"); // Set time slot
            sc1.setLocation("456 Test Avenue, Colombo"); // Set location
            sc1.setLatitude(6.9280); // Set latitude
            sc1.setLongitude(79.8620); // Set longitude
            sc1.setInstructions("Please collect from front door"); // Set instructions
            sc1.setStatus("Pending"); // Set status
            sc1.setPaymentStatus("Unpaid"); // Set payment status
            
            SpecialCollection sc2 = new SpecialCollection(); // Create second test collection
            sc2.setUserId("test-user-2"); // Set user ID
            sc2.setCategory("E-Waste"); // Set category
            sc2.setItems("Old Computer"); // Set items
            sc2.setQuantity(15); // Set quantity
            sc2.setFee(200.0); // Set fee
            sc2.setDate("2024-01-16"); // Set date
            sc2.setTimeSlot("Afternoon"); // Set time slot
            sc2.setLocation("789 Test Road, Colombo"); // Set location
            sc2.setLatitude(6.9290); // Set latitude
            sc2.setLongitude(79.8630); // Set longitude
            sc2.setInstructions("Handle with care"); // Set instructions
            sc2.setStatus("Pending"); // Set status
            sc2.setPaymentStatus("Unpaid"); // Set payment status
            
            // Save to repository (assuming we have access to it)
            // For now, just return success message
            return ResponseEntity.ok("Test special collection data would be created here"); // Return success message
        } catch (Exception e) { // Handle any errors
            return ResponseEntity.badRequest().body("Error creating test data: " + e.getMessage()); // Return error message
        }
    }

    @GetMapping("/debug")
    public ResponseEntity<String> debugCollections() { // Debug endpoint to check collections
        try {
            System.out.println("Debug endpoint called");
            List<SpecialCollection> allCollections = specialCollectionService.findAll(); // Get all collections
            System.out.println("Debug: Found " + allCollections.size() + " collections");
            
            StringBuilder result = new StringBuilder(); // Build debug output
            result.append("Found ").append(allCollections.size()).append(" special collections:\n");
            for (SpecialCollection sc : allCollections) { // Loop through collections
                result.append("ID: ").append(sc.getId()) // Add collection details
                      .append(", Category: ").append(sc.getCategory())
                      .append(", Lat: ").append(sc.getLatitude())
                      .append(", Lng: ").append(sc.getLongitude())
                      .append("\n");
            }
            
            return ResponseEntity.ok(result.toString()); // Return debug information
        } catch (Exception e) { // Handle any errors
            System.err.println("Debug error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Debug error: " + e.getMessage()); // Return error message
        }
    }

    @GetMapping("/check-collection")
    public ResponseEntity<String> checkCollection() { // Check MongoDB collection status
        try {
            System.out.println("Checking MongoDB collection...");
            
            // Try to get collection info
            long count = specialCollectionService.count(); // Get collection count
            System.out.println("Collection count: " + count);
            
            // Also try to get all collections to see what's there
            List<SpecialCollection> allCollections = specialCollectionService.findAll(); // Get all collections
            System.out.println("All collections size: " + allCollections.size());
            
            return ResponseEntity.ok("Collection count: " + count + ", All collections: " + allCollections.size()); // Return collection info
        } catch (Exception e) { // Handle any errors
            System.err.println("Collection check error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Collection check error: " + e.getMessage()); // Return error message
        }
    }

    @PostMapping("/schedule")
    public ResponseEntity<?> schedule(HttpServletRequest request, @RequestBody ScheduleRequest req) { // Schedule new collection
        String userId = getUserIdFromCookie(request); // Extract user ID from session
        if (userId == null) return ResponseEntity.status(401).body("Not authenticated"); // Return 401 if not authenticated
        
        // Debug: Log the payment method received in controller
        System.out.println("CONTROLLER DEBUG: Received paymentMethod: " + req.paymentMethod);
        System.out.println("CONTROLLER DEBUG: PaymentMethod is null: " + (req.paymentMethod == null));
        
        SpecialCollection sc = specialCollectionService.schedule(userId, req); // Schedule collection via service
        ScheduleResponse res = new ScheduleResponse(); // Create response object
        res.collectionId = sc.getId(); // Set collection ID
        res.fee = sc.getFee(); // Set fee
        res.status = sc.getStatus(); // Set status
        res.paymentStatus = sc.getPaymentStatus(); // Set payment status
        return ResponseEntity.ok(res); // Return schedule response
    }

    @PostMapping("/reschedule/{id}")
    public ResponseEntity<SpecialCollection> reschedule(HttpServletRequest request, @PathVariable("id") String id,
                                                        @RequestBody RescheduleRequest req) { // Reschedule existing collection
        String userId = getUserIdFromCookie(request); // Extract user ID from session
        if (userId == null) return ResponseEntity.status(401).build(); // Return 401 if not authenticated
        return ResponseEntity.ok(specialCollectionService.reschedule(userId, id, req.date, req.timeSlot)); // Reschedule collection
    }

    @PostMapping("/pay/{id}")
    public ResponseEntity<?> markPaid(HttpServletRequest request, @PathVariable("id") String id, @RequestBody(required = false) PayRequest payRequest) { // Update payment status
        String userId = getUserIdFromCookie(request); // Extract user ID from session
        if (userId == null) return ResponseEntity.status(401).build(); // Return 401 if not authenticated
        SpecialCollection sc; // Collection to update
        String method = payRequest != null && payRequest.method != null ? payRequest.method.toLowerCase() : "card"; // Get payment method
        Boolean success = payRequest != null ? payRequest.success : Boolean.TRUE; // Get payment success status
        if ("cash".equals(method)) { // Handle cash payment
            sc = specialCollectionService.markCashPending(userId, id); // Mark as cash pending
        } else if (Boolean.TRUE.equals(success)) { // Handle successful payment
            sc = specialCollectionService.markPaid(userId, id); // Mark as paid
        } else { // Handle failed payment
            sc = specialCollectionService.markUnpaid(userId, id, method); // Mark as unpaid
        }
        Map<String, Object> res = new HashMap<>(); // Create response
        res.put("status", sc.getStatus()); // Add status
        res.put("paymentStatus", sc.getPaymentStatus()); // Add payment status
        return ResponseEntity.ok(res); // Return updated status
    }

	// Update payment status by simple ID
	@PutMapping("/{id}/payment-status")
	public ResponseEntity<Map<String, Object>> updatePaymentStatus(@PathVariable String id, @RequestBody Map<String, String> request) { // Update payment status by simple ID
		try {
			String newPaymentStatus = request.get("paymentStatus"); // Get new payment status
			if (newPaymentStatus == null) { // Check if payment status provided
				Map<String, Object> errorResponse = new HashMap<>(); // Create error response
				errorResponse.put("error", "Payment status is required");
				return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST); // Return 400
			}

			Optional<SpecialCollection> collectionOpt = specialCollectionService.findBySimpleId(id); // Find collection by simple ID
			if (collectionOpt.isPresent()) { // Check if collection found
				SpecialCollection collection = collectionOpt.get(); // Get collection
				collection.setPaymentStatus(newPaymentStatus); // Update payment status
				SpecialCollection updatedCollection = specialCollectionService.update(collection); // Save updated collection
				
				String simpleId = updatedCollection.getId().length() >= 6 ? updatedCollection.getId().substring(updatedCollection.getId().length() - 6) : updatedCollection.getId(); // Extract simple ID
				Map<String, Object> response = new HashMap<>(); // Create success response
				response.put("collectionId", updatedCollection.getId()); // Add collection ID
				response.put("simpleId", simpleId); // Add simple ID
				response.put("paymentStatus", updatedCollection.getPaymentStatus()); // Add payment status
				response.put("message", "Payment status updated successfully"); // Add success message
				return new ResponseEntity<>(response, HttpStatus.OK); // Return success response
			} else { // Collection not found
				Map<String, Object> errorResponse = new HashMap<>(); // Create error response
				errorResponse.put("error", "Collection not found with ID: " + id);
				return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND); // Return 404
			}
		} catch (Exception e) { // Handle any errors
			e.printStackTrace();
			Map<String, Object> errorResponse = new HashMap<>(); // Create error response
			errorResponse.put("error", "Error updating payment status: " + e.getMessage());
			return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR); // Return 500
		}
	}

	// Update collection status by simple ID
	@PutMapping("/{id}/status")
	public ResponseEntity<Map<String, Object>> updateCollectionStatus(@PathVariable String id, @RequestBody Map<String, String> request) { // Update collection status by simple ID
		try {
			String newStatus = request.get("status"); // Get new status
			if (newStatus == null) { // Check if status provided
				Map<String, Object> errorResponse = new HashMap<>(); // Create error response
				errorResponse.put("error", "Status is required");
				return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST); // Return 400
			}

			Optional<SpecialCollection> collectionOpt = specialCollectionService.findBySimpleId(id); // Find collection by simple ID
			if (collectionOpt.isPresent()) { // Check if collection found
				SpecialCollection collection = collectionOpt.get(); // Get collection
				collection.setStatus(newStatus); // Update status
				
				// If marking as collected, set collectedAt timestamp
				if ("Collected".equals(newStatus)) { // Check if marking as collected
					collection.setCollectedAt(java.time.LocalDateTime.now()); // Set collection timestamp
				}
				
				SpecialCollection updatedCollection = specialCollectionService.update(collection); // Save updated collection
				
				String simpleId = updatedCollection.getId().length() >= 6 ? updatedCollection.getId().substring(updatedCollection.getId().length() - 6) : updatedCollection.getId(); // Extract simple ID
				Map<String, Object> response = new HashMap<>(); // Create success response
				response.put("collectionId", updatedCollection.getId()); // Add collection ID
				response.put("simpleId", simpleId); // Add simple ID
				response.put("status", updatedCollection.getStatus()); // Add status
				response.put("collectedAt", updatedCollection.getCollectedAt()); // Add collected timestamp
				response.put("message", "Collection status updated successfully"); // Add success message
				return new ResponseEntity<>(response, HttpStatus.OK); // Return success response
			} else { // Collection not found
				Map<String, Object> errorResponse = new HashMap<>(); // Create error response
				errorResponse.put("error", "Collection not found with ID: " + id);
				return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND); // Return 404
			}
		} catch (Exception e) { // Handle any errors
			e.printStackTrace();
			Map<String, Object> errorResponse = new HashMap<>(); // Create error response
			errorResponse.put("error", "Error updating collection status: " + e.getMessage());
			return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR); // Return 500
		}
	}

	@PostMapping("/cancel/{id}")
	public ResponseEntity<?> cancelCollection(HttpServletRequest request, @PathVariable("id") String id) { // Cancel and delete collection
        String userId = getUserIdFromCookie(request); // Extract user ID from session
        if (userId == null) return ResponseEntity.status(401).build(); // Return 401 if not authenticated
        try {
            SpecialCollection sc = specialCollectionService.cancelCollection(userId, id); // Cancel collection via service
            Map<String, Object> res = new HashMap<>(); // Create response
            res.put("status", "Deleted"); // Add status
            res.put("message", "Collection cancelled and deleted successfully"); // Add message
            res.put("deletedId", sc.getId()); // Add deleted collection ID
            return ResponseEntity.ok(res); // Return success response
        } catch (Exception e) { // Handle any errors
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); // Return error response
        }
    }

    @GetMapping("/qr/{id}")
    public ResponseEntity<byte[]> downloadQRCode(HttpServletRequest request, @PathVariable("id") String id) { // Download QR code as PNG file
        System.out.println("QR download endpoint called for collection: " + id);
        String userId = getUserIdFromCookie(request); // Extract user ID from session
        System.out.println("User ID from cookie: " + userId);
        if (userId == null) { // Check if user is authenticated
            System.out.println("No user ID found, returning 401");
            return ResponseEntity.status(401).build(); // Return 401 if not authenticated
        }
        
        try {
            System.out.println("Generating QR code bytes...");
            byte[] qrCodeBytes = specialCollectionService.generateQRCodeBytes(id, userId); // Generate QR code bytes
            System.out.println("QR code bytes generated successfully, length: " + qrCodeBytes.length);
            HttpHeaders headers = new HttpHeaders(); // Set response headers
            headers.setContentType(MediaType.IMAGE_PNG); // Set content type as PNG
            headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=qr-code-" + id + ".png"); // Set filename
            return ResponseEntity.ok().headers(headers).body(qrCodeBytes); // Return QR code as downloadable file
        } catch (Exception e) { // Handle any errors
            System.err.println("Error in QR download endpoint: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build(); // Return 400 on error
        }
    }

    @GetMapping("/qr-base64/{id}")
    public ResponseEntity<Map<String, String>> getQRCodeBase64(HttpServletRequest request, @PathVariable("id") String id) { // Get QR code as base64 string
        System.out.println("QR base64 endpoint called for collection: " + id);
        String userId = getUserIdFromCookie(request); // Extract user ID from session
        System.out.println("User ID from cookie: " + userId);
        if (userId == null) { // Check if user is authenticated
            System.out.println("No user ID found, returning 401");
            return ResponseEntity.status(401).build(); // Return 401 if not authenticated
        }
        
        try {
            System.out.println("Generating QR code base64...");
            String qrCodeBase64 = specialCollectionService.generateQRCodeBase64(id, userId); // Generate QR code as base64
            System.out.println("QR code generated successfully, length: " + qrCodeBase64.length());
            Map<String, String> response = new HashMap<>(); // Create response
            response.put("qrCode", qrCodeBase64); // Add QR code base64
            response.put("collectionId", id); // Add collection ID
            return ResponseEntity.ok(response); // Return QR code data
        } catch (Exception e) { // Handle any errors
            System.err.println("Error in QR base64 endpoint: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); // Return error response
        }
    }

    @PostMapping("/scan-qr")
    public ResponseEntity<?> scanQRCode(@RequestBody Map<String, String> request) { // Scan QR code and mark collection as collected
        try {
            String qrCodeData = request.get("qrCodeData"); // Get QR code data from request
            if (qrCodeData == null || qrCodeData.trim().isEmpty()) { // Check if QR data provided
                return ResponseEntity.badRequest().body(Map.of("error", "QR code data is required")); // Return 400 if missing
            }
            
            SpecialCollection sc = specialCollectionService.markCollected(qrCodeData); // Mark collection as collected
            
            Map<String, Object> response = new HashMap<>(); // Create success response
            response.put("success", true); // Add success flag
            response.put("message", "Collection marked as collected successfully"); // Add success message
            response.put("collectionId", sc.getId()); // Add collection ID
            response.put("status", sc.getStatus()); // Add status
            response.put("collectedAt", sc.getCollectedAt()); // Add collected timestamp
            
            return ResponseEntity.ok(response); // Return success response
        } catch (Exception e) { // Handle any errors
            Map<String, Object> response = new HashMap<>(); // Create error response
            response.put("success", false); // Add failure flag
            response.put("error", e.getMessage()); // Add error message
            return ResponseEntity.badRequest().body(response); // Return error response
        }
    }
}


