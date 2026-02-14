package com.gh.wedding.security

import com.gh.wedding.config.JwtProperties
import com.gh.wedding.config.OAuth2Properties
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.core.Authentication
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.security.web.authentication.AuthenticationFailureHandler
import org.springframework.security.web.authentication.AuthenticationSuccessHandler
import org.springframework.stereotype.Component
import org.springframework.http.ResponseCookie
import java.time.Duration

@Component
class OAuth2LoginSuccessHandler(
    private val jwtTokenProvider: JwtTokenProvider,
    private val oauth2Properties: OAuth2Properties,
    private val jwtProperties: JwtProperties,
) : AuthenticationSuccessHandler {

    override fun onAuthenticationSuccess(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authentication: Authentication,
    ) {
        val oauthToken = authentication as OAuth2AuthenticationToken
        val provider = oauthToken.authorizedClientRegistrationId
        val oauthUser = oauthToken.principal
        val user = extractUser(provider, oauthUser)
        val accessToken = jwtTokenProvider.createAccessToken(user)

        val cookieBuilder = ResponseCookie.from(JwtTokenProvider.ACCESS_TOKEN_COOKIE_NAME, accessToken)
            .httpOnly(true)
            .secure(request.isSecure)
            .path("/")
            .sameSite("Lax")
            .maxAge(Duration.ofSeconds(jwtTokenProvider.tokenValiditySeconds()))
        jwtProperties.cookieDomain
            ?.trim()
            ?.takeIf { it.isNotEmpty() }
            ?.let { cookieBuilder.domain(it) }

        val cookie = cookieBuilder.build()

        response.addHeader("Set-Cookie", cookie.toString())
        response.sendRedirect(oauth2Properties.successRedirectUri)
    }

    private fun extractUser(provider: String, oauthUser: OAuth2User): AuthUser {
        val attributes = oauthUser.attributes

        return when (provider) {
            "google" -> {
                val sub = (attributes["sub"] as? String) ?: (attributes["email"] as? String) ?: "google-unknown"
                AuthUser(
                    userId = "google:$sub",
                    name = attributes["name"] as? String,
                    email = attributes["email"] as? String,
                    provider = provider,
                )
            }

            "kakao" -> {
                val id = attributes["id"]?.toString() ?: "kakao-unknown"
                val properties = attributes["properties"] as? Map<*, *>
                val account = attributes["kakao_account"] as? Map<*, *>

                AuthUser(
                    userId = "kakao:$id",
                    name = properties?.get("nickname") as? String,
                    email = account?.get("email") as? String,
                    provider = provider,
                )
            }

            else -> {
                val fallbackId = oauthUser.name.ifBlank { "unknown" }
                AuthUser(
                    userId = "$provider:$fallbackId",
                    name = attributes["name"] as? String,
                    email = attributes["email"] as? String,
                    provider = provider,
                )
            }
        }
    }
}

@Component
class OAuth2LoginFailureHandler(
    private val oauth2Properties: OAuth2Properties,
) : AuthenticationFailureHandler {
    override fun onAuthenticationFailure(
        request: HttpServletRequest,
        response: HttpServletResponse,
        exception: org.springframework.security.core.AuthenticationException,
    ) {
        response.sendRedirect("${oauth2Properties.successRedirectUri.trimEnd('/')}/login?error=oauth2")
    }
}
