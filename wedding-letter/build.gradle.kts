plugins {
    id("org.springframework.boot")
    id("io.spring.dependency-management")
    id("org.jetbrains.kotlinx.kover")
    id("com.google.devtools.ksp") version "2.3.5"

    kotlin("jvm")
    kotlin("plugin.spring")
    kotlin("plugin.jpa")
}

// group/version은 루트에서 관리하므로 보통 생략 (원하면 유지해도 됨)
description = "wedding-letter"

configurations {
    compileOnly {
        extendsFrom(configurations.annotationProcessor.get())
    }
}

dependencies {
    // spring boot
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-oauth2-client")
    implementation("org.springframework.boot:spring-boot-starter-actuator")

    // JPA + DB
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-data-redis")
    implementation("org.flywaydb:flyway-core")
    runtimeOnly("org.flywaydb:flyway-mysql")
    runtimeOnly("org.mariadb.jdbc:mariadb-java-client")

    // kotlin
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("org.jetbrains.kotlin:kotlin-reflect")

    // dev
    developmentOnly("org.springframework.boot:spring-boot-devtools")

    // querydsl (ksp)
    implementation("io.github.openfeign.querydsl:querydsl-jpa:7.1")
    ksp("io.github.openfeign.querydsl:querydsl-ksp-codegen:7.1")

    // jwt
    implementation("io.jsonwebtoken:jjwt-api:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.6")

    // file/image
    implementation("net.coobird:thumbnailator:0.4.20")
    implementation("software.amazon.awssdk:s3:2.31.18")

    // config processor
    annotationProcessor("org.springframework.boot:spring-boot-configuration-processor")

    // test
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
    testImplementation("org.springframework.security:spring-security-test")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll(
            "-Xjsr305=strict",
            "-Xannotation-default-target=param-property"
        )
    }
}

allOpen {
    annotation("jakarta.persistence.Entity")
    annotation("jakarta.persistence.MappedSuperclass")
    annotation("jakarta.persistence.Embeddable")
}

tasks.withType<Test> {
    useJUnitPlatform()
}

tasks.named<org.springframework.boot.gradle.tasks.bundling.BootJar>("bootJar") {
    archiveFileName.set("wedding-letter.jar")
}
