@echo off
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.16.8-hotspot
echo JAVA_HOME set to: %JAVA_HOME%
cd /d "C:\Users\ASUS\Desktop\CSSE_Project\EcoWaste-Solutions\backend"
mvnw.cmd spring-boot:run
pause