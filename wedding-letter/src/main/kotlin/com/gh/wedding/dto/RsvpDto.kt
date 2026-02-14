package com.gh.wedding.dto

import jakarta.validation.constraints.NotBlank

data class RsvpCreateRequest(
    @field:NotBlank(message = "성함을 입력해주세요.")
    val name: String,
    val attending: Boolean,
    val partyCount: Int = 1,
    val meal: Boolean = false,
    val note: String? = null,
)

data class RsvpSummaryResponse(
    val invitationId: Long,
    val invitationTitle: String,
    val name: String,
    val attending: Boolean,
    val partyCount: Int,
    val meal: Boolean,
    val note: String?,
    val createdAt: String,
)
