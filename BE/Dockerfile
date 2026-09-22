# ---------- build ----------
FROM eclipse-temurin:25-jdk AS build
WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -q -B dependency:go-offline
COPY src src
RUN ./mvnw -q -B package -DskipTests

# ---------- esecuzione ----------
FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
# profilo demo: database H2 in memoria, segreti da variabili d'ambiente
ENV SPRING_PROFILES_ACTIVE=demo
EXPOSE 8080
# il piano gratuito di Render ha 512 MB: GC seriale e heap limitata
ENTRYPOINT ["java", "-XX:+UseSerialGC", "-XX:MaxRAMPercentage=70", "-jar", "app.jar"]
