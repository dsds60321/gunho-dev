package com.gh.wedding.config

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client

@Configuration
class StorageConfig {

    @Bean
    @ConditionalOnProperty(prefix = "app.storage", name = ["type"], havingValue = "s3")
    fun s3Client(storageProperties: StorageProperties): S3Client {
        return S3Client.builder()
            .region(Region.of(storageProperties.s3.region))
            .credentialsProvider(DefaultCredentialsProvider.create())
            .build()
    }
}
