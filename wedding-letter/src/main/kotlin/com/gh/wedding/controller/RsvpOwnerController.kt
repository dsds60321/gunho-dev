package com.gh.wedding.controller

import com.gh.wedding.common.requireAuthUser
import com.gh.wedding.dto.RsvpSummaryResponse
import com.gh.wedding.service.InvitationService
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/rsvps")
class RsvpOwnerController(
    private val invitationService: InvitationService,
) {
    @GetMapping("/me")
    fun myRsvps(authentication: Authentication?): List<RsvpSummaryResponse> {
        val user = authentication.requireAuthUser()
        return invitationService.getMyRsvps(user.userId)
    }
}
