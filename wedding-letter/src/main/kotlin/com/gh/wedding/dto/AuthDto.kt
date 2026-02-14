package com.gh.wedding.dto

data class AuthMeResponse(
    val loggedIn: Boolean,
    val userId: String? = null,
    val name: String? = null,
    val email: String? = null,
    val provider: String? = null,
)
