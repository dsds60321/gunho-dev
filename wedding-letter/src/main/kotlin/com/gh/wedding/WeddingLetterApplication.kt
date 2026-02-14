package com.gh.wedding

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.ConfigurationPropertiesScan
import org.springframework.boot.runApplication

@SpringBootApplication
@ConfigurationPropertiesScan
class WeddingLetterApplication

fun main(args: Array<String>) {
    runApplication<WeddingLetterApplication>(*args)
}
