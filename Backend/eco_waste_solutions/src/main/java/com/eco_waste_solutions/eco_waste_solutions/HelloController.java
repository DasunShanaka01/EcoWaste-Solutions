package com.eco_waste_solutions.eco_waste_solutions;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;

@RestController
public class HelloController {
    @RequestMapping("/hello") //gfww
    public String hello() {
        return "Hello, World!";
    }

}
