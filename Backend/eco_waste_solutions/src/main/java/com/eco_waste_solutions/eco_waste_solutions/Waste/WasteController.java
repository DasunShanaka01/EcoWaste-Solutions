package com.eco_waste_solutions.eco_waste_solutions.Waste;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/waste")
public class WasteController {

	@Autowired
	private WasteService wasteService;

	@GetMapping
	public ResponseEntity<List<Waste>> list() {
		return ResponseEntity.ok(wasteService.findAll());
	}

}
