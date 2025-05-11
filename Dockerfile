FROM gradle:7.6.1-jdk17 AS build
WORKDIR /app
COPY . .
RUN gradle build -x test --no-daemon

FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar

# MongoDB connection details will be supplied as environment variables
ENV MONGODB_URI=mongodb+srv://elieissa:1234@cluster0.wgnomye.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]