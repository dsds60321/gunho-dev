package com.gh.wedding.domain

import jakarta.persistence.Column
import jakarta.persistence.Convert
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.PrePersist
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(
    indexes = [
        Index(name = "idx_pub_invitation_created", columnList = "invitation_id,publishedAt"),
    ],
)
class InvitationPublication(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invitation_id", nullable = false)
    var invitation: Invitation? = null,

    var version: Int? = null,

    @Convert(converter = InvitationContentConverter::class)
    @Column(columnDefinition = "TEXT")
    var content: InvitationContent = InvitationContent(),

    var publishedAt: LocalDateTime? = null,
) {
    @PrePersist
    fun onCreate() {
        publishedAt = LocalDateTime.now()
    }
}
