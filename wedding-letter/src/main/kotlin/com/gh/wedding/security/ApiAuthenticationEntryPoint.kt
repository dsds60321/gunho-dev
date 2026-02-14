package com.gh.wedding.security

import com.fasterxml.jackson.databind.ObjectMapper
import com.gh.wedding.common.ApiErrorResponses
import com.gh.wedding.common.WeddingErrorCode
import com.gh.wedding.config.JwtProperties
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.MediaType
import org.springframework.http.ResponseCookie
import org.springframework.security.core.AuthenticationException
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.stereotype.Component
import java.nio.charset.StandardCharsets

@Component
class ApiAuthenticationEntryPoint(
    private val objectMapper: ObjectMapper,
    private val jwtProperties: JwtProperties,
) : AuthenticationEntryPoint {
    override fun commence(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authException: AuthenticationException?,
    ) {
        val hasTokenCookie = request.cookies
            ?.any { it.name == JwtTokenProvider.ACCESS_TOKEN_COOKIE_NAME && it.value.isNotBlank() }
            ?: false

        val errorCode = if (hasTokenCookie) {
            WeddingErrorCode.SESSION_EXPIRED
        } else {
            WeddingErrorCode.AUTH_REQUIRED
        }

        val expiredCookieBuilder = ResponseCookie.from(JwtTokenProvider.ACCESS_TOKEN_COOKIE_NAME, "")
            .httpOnly(true)
            .secure(request.isSecure)
            .sameSite("Lax")
            .path("/")
            .maxAge(0)
        jwtProperties.cookieDomain
            ?.trim()
            ?.takeIf { it.isNotEmpty() }
            ?.let { expiredCookieBuilder.domain(it) }

        val expiredCookie = expiredCookieBuilder.build()

        response.addHeader("Set-Cookie", expiredCookie.toString())
        response.status = errorCode.status.value()
        response.contentType = MediaType.APPLICATION_JSON_VALUE
        response.characterEncoding = StandardCharsets.UTF_8.name()
        objectMapper.writeValue(response.writer, ApiErrorResponses.of(errorCode))
    }
}
