package com.gh.wedding.controller

import com.gh.wedding.config.JwtProperties
import com.gh.wedding.dto.AuthMeResponse
import com.gh.wedding.security.AuthUser
import com.gh.wedding.security.JwtTokenProvider
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.ResponseCookie
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val jwtProperties: JwtProperties,
) {

    @GetMapping("/me")
    fun me(authentication: Authentication?): AuthMeResponse {
        val principal = authentication?.principal
        if (principal !is AuthUser) {
            return AuthMeResponse(loggedIn = false)
        }

        return AuthMeResponse(
            loggedIn = true,
            userId = principal.userId,
            name = principal.name,
            email = principal.email,
            provider = principal.provider,
        )
    }

    @PostMapping("/logout")
    fun logout(response: HttpServletResponse): Map<String, String> {
        val expiredCookieBuilder = ResponseCookie.from(JwtTokenProvider.ACCESS_TOKEN_COOKIE_NAME, "")
            .httpOnly(true)
            .path("/")
            .maxAge(0)
            .sameSite("Lax")
        jwtProperties.cookieDomain
            ?.trim()
            ?.takeIf { it.isNotEmpty() }
            ?.let { expiredCookieBuilder.domain(it) }

        val expiredCookie = expiredCookieBuilder.build()

        response.addHeader("Set-Cookie", expiredCookie.toString())
        return mapOf("message" to "로그아웃되었습니다.")
    }
}
