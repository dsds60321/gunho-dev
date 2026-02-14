package com.gh.wedding.config

import com.gh.wedding.domain.Template
import com.gh.wedding.repository.TemplateRepository
import org.springframework.boot.CommandLineRunner
import org.springframework.stereotype.Component

@Component
class DataLoader(
    private val templateRepository: TemplateRepository,
) : CommandLineRunner {
    override fun run(vararg args: String?) {
        saveTemplate("wedding-modern", "모던 화이트 웨딩", "군더더기 없는 깔끔한 화이트 톤의 디자인")
        saveTemplate("wedding-classic", "클래식 플로럴", "우아한 꽃장식과 함께하는 클래식 디자인")
        saveTemplate("wedding-warm", "웜 베이지 무드", "따뜻하고 감성적인 베이지 컬러의 차분한 초대장")
        saveTemplate("dol-cute", "큐트 베어 돌잔치", "귀여운 곰돌이 캐릭터와 따뜻한 색감")
        saveTemplate("dol-trad", "전통 돌상", "한국 전통의 멋을 살린 고풍스러운 디자인")
        saveTemplate("dol-photo", "포토 매거진", "아이의 사진이 돋보이는 잡지 커버 스타일")
        saveTemplate("party-neon", "네온 파티", "화려한 조명과 신나는 분위기의 파티 초대장")
        saveTemplate("party-birthday", "해피 버스데이", "알록달록 풍선과 케이크가 있는 생일 디자인")
    }

    private fun saveTemplate(id: String, name: String, description: String) {
        if (!templateRepository.existsById(id)) {
            templateRepository.save(
                Template(
                    id = id,
                    name = name,
                    description = description,
                    thumbnailImage = "",
                ),
            )
        }
    }
}
