package com.eco_waste_solutions.eco_waste_solutions.Waste;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.graphql.GraphQlProperties.Http;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

import java.util.List;

@RestController
@RequestMapping("/api/waste")
//@CrossOrigin(origins = "http://localhost:3000") // Adjust this to your frontend's URL
@RequiredArgsConstructor
public class WasteController {

	private final WasteService wasteService;

	private static final String UPLOAD_DIR = "backend/uploads/";

	@GetMapping("/wastes")
	public ResponseEntity<List<Waste>> getAllWastes() {
		return new ResponseEntity<>(wasteService.findAll(), HttpStatus.OK);
	}

	

}
