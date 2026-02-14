package com.gh.wedding.controller

import com.gh.wedding.config.KakaoProperties
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/public/config")
class PublicConfigController(
    private val kakaoProperties: KakaoProperties,
) {
    @GetMapping
    fun getPublicConfig(): Map<String, String> {
        return mapOf(
            "kakaoJsKey" to kakaoProperties.js,
        )
    }
}
