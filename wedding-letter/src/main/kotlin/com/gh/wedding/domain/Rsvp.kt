package com.gh.wedding.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.PrePersist
import java.time.LocalDateTime

@Entity
class Rsvp(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invitation_id", nullable = false)
    var invitation: Invitation? = null,

    @Column(nullable = false)
    var name: String = "",

    @Column(nullable = false)
    var attending: Boolean = false,

    var partyCount: Int = 0,
    var meal: Boolean = false,
    var note: String? = null,
    var ipAddress: String? = null,
    var createdAt: LocalDateTime? = null,
) {
    @PrePersist
    fun onCreate() {
        createdAt = LocalDateTime.now()
    }
}
