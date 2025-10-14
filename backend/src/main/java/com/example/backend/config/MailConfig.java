package com.example.backend.config;

import java.util.Properties;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

// @Configuration
// public class MailConfig {
//     @Bean
//     public JavaMailSender javaMailSender() {
//         JavaMailSenderImpl ms = new JavaMailSenderImpl();
//         ms.setHost("smtp.gmail.com");
//         ms.setPort(587);
//         ms.setUsername("thennakoonai03@gmail.com");
//         ms.setPassword("miwgoahpoxdfinst");
//         Properties p = ms.getJavaMailProperties();
//         p.put("mail.transport.protocol", "smtp");
//         p.put("mail.smtp.auth", "true");
//         p.put("mail.smtp.starttls.enable", "true");
//         return ms;
//     }
// }
