package com.gh.wedding.repository

import com.gh.wedding.domain.Guestbook
import org.springframework.data.jpa.repository.JpaRepository

interface GuestbookRepository : JpaRepository<Guestbook, Long> {
    fun findByInvitationIdOrderByCreatedAtDesc(invitationId: Long): List<Guestbook>
}
