package com.gh.wedding.repository

import com.gh.wedding.domain.Template
import org.springframework.data.jpa.repository.JpaRepository

interface TemplateRepository : JpaRepository<Template, String>
