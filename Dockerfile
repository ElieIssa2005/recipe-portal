FROM gradle:7.6.1-jdk17 AS build
WORKDIR /app
COPY . .
RUN gradle build --no-daemon

FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar

# MongoDB connection details will be supplied as environment variables
ENV MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/recipedb

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]