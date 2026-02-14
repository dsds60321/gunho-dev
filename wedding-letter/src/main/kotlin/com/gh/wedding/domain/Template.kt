package com.gh.wedding.domain

import jakarta.persistence.Entity
import jakarta.persistence.Id

@Entity
class Template(
    @Id
    var id: String = "",
    var name: String = "",
    var description: String = "",
    var thumbnailImage: String = "",
)
